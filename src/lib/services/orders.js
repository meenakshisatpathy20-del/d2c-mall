/*
 * Order pipeline:
 * Checkout → Reserve stock → Create payment order → Razorpay → Verify signature
 *          → Confirm order → Commit stock → Create shipments → Notify
 *
 * Safety: idempotency key per checkout attempt prevents duplicate orders;
 * failed / abandoned payments release reserved stock; retries re-reserve.
 */
import { getState, setState } from "../store";
import { productMap } from "../../data/catalog";
import { getCourier, getWarehouse } from "../../data/logistics";
import { computeSummary } from "../pricing";
import { planFulfilment } from "../delivery";
import { formatINR, uid } from "../format";
import { buildShipment, newInvoiceNo, newOrderId, shipmentStatus } from "../orderModel";
import { commitReservation, releaseReservation, reserveStock, restock } from "./inventory";
import { createGatewayOrder, openCheckout, verifyPayment } from "./payments";
import { notify, updateUser } from "./account";
import { coinsSummary } from "./extras";
import { api, live } from "../api";

/** Demo logistics clock: each shipment step advances this fast for new orders. */
export const DEMO_STEP_MS = 3 * 60 * 1000;

function patchOrder(orderId, patch) {
  setState((st) => ({
    ...st,
    orders: st.orders.map((o) => (o.id === orderId ? { ...o, ...(typeof patch === "function" ? patch(o) : patch) } : o)),
  }));
}

const addTimeline = (o, status, note) => ({ timeline: [...o.timeline, { status, at: Date.now(), note }] });

const log = (entry) =>
  setState((st) => ({ ...st, paymentLog: [{ id: uid("plog"), at: Date.now(), ...entry }, ...st.paymentLog].slice(0, 300) }));

/**
 * @param {object} p
 * @param {object} p.user
 * @param {Array}  p.lines     hydrated cart lines
 * @param {object} p.address
 * @param {object} p.courierChoice  { [warehouseId]: courierId }
 * @param {"standard"|"express"} p.deliverySpeed
 * @param {string} p.paymentMethod
 * @param {string|null} p.couponCode
 * @param {string} p.idempotencyKey
 * @param {(stage:string)=>void} p.onStage
 */
export async function placeOrder({ user, lines, address, courierChoice = {}, deliverySpeed, paymentMethod, couponCode, idempotencyKey, extras = {}, onStage = () => {} }) {
  const s = getState();

  // 0. Duplicate-order protection
  const dup = s.orders.find((o) => o.idempotencyKey === idempotencyKey && o.status !== "payment_failed");
  if (dup) return { ok: true, order: dup, duplicate: true };

  onStage("validating");
  const items = lines
    .filter((l) => !l.outOfStock)
    .map((l, i) => ({
      lineId: `L${i + 1}`,
      productId: l.productId,
      name: l.name,
      brand: l.brand,
      image: l.image,
      category: l.category,
      sku: productMap[l.productId].sku,
      size: l.size,
      color: l.color,
      price: productMap[l.productId].price,
      mrp: productMap[l.productId].mrp,
      qty: l.qty,
      weightKg: l.weightKg,
      returnDays: productMap[l.productId].returnDays,
    }));
  if (!items.length) return { ok: false, error: "Your bag is empty." };

  // 1. Re-price on "server" (never trust client totals)
  const userOrders = s.orders.filter((o) => o.userId === user.id && !["payment_failed", "pending_payment"].includes(o.status)).length;
  const freshUser = s.users.find((u) => u.id === user.id) || user;
  const coinBalance = coinsSummary(freshUser, s.orders).balance;
  if ((extras.credits || 0) > (freshUser.credits || 0)) return { ok: false, error: "Not enough D2C credits." };
  if ((extras.coins || 0) > coinBalance) return { ok: false, error: "Not enough D2C Coins." };
  if (extras.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(extras.gstin)) return { ok: false, error: "Enter a valid GSTIN for the GST invoice." };
  const summary = computeSummary({ items, couponCode, userOrders, usage: s.couponUsage[user.id] || {}, paymentMethod, deliverySpeed, giftWrap: extras.giftWrap, credits: extras.credits, coins: extras.coins });
  if (couponCode && !summary.couponCode) return { ok: false, error: summary.couponResult?.reason || "Coupon is no longer valid." };
  if (paymentMethod === "cod" && !summary.codAvailable) return { ok: false, error: "COD is not available for orders above ₹20,000." };

  // 2. Warehouse allocation
  const plan = planFulfilment(address.pincode, items.map((i) => ({ productId: i.productId, qty: i.qty, weightKg: i.weightKg })), s.inventory);
  if (!plan.ok) return { ok: false, error: plan.reason };
  if (paymentMethod === "cod" && !plan.codAvailable) return { ok: false, error: "COD isn't available for this pincode." };

  const orderId = newOrderId();
  const allocations = [];
  const groups = plan.shipments.map((g) => {
    const lineIds = [];
    g.items.forEach((gi) => {
      const line = items.find((i) => i.productId === gi.productId && !lineIds.includes(i.lineId) && !allocations.some((a) => a.lineId === i.lineId));
      if (line) {
        lineIds.push(line.lineId);
        allocations.push({ lineId: line.lineId, productId: line.productId, warehouseId: g.warehouseId, qty: line.qty });
      }
    });
    return { warehouseId: g.warehouseId, courierId: courierChoice[g.warehouseId] || g.courierId, lineIds, days: deliverySpeed === "express" ? plan.expressDays : g.days };
  });
  // Duplicate products (different sizes) → allocate remaining lines to the first group that has stock
  items.forEach((i) => {
    if (!allocations.some((a) => a.lineId === i.lineId)) {
      const g = groups[0];
      g.lineIds.push(i.lineId);
      allocations.push({ lineId: i.lineId, productId: i.productId, warehouseId: g.warehouseId, qty: i.qty });
    }
  });

  const order = {
    id: orderId,
    userId: user.id,
    customer: user.name,
    email: user.email,
    createdAt: Date.now(),
    items: items.map((i) => ({ ...i, lineId: `${orderId}-${i.lineId}` })),
    address,
    pricing: summary,
    deliverySpeed,
    status: "pending_payment",
    allocations: allocations.map((a) => ({ ...a, lineId: `${orderId}-${a.lineId}` })),
    fulfilmentPlan: groups.map((g) => ({ ...g, lineIds: g.lineIds.map((l) => `${orderId}-${l}`) })),
    etaAt: deliverySpeed === "express" ? plan.expressEta : plan.eta,
    payment: {
      method: paymentMethod,
      status: paymentMethod === "cod" ? "cod_pending" : "pending",
      gateway: paymentMethod === "cod" ? "cod" : "razorpay",
      attempts: [],
    },
    shipments: [],
    timeline: [{ status: "placed", at: Date.now(), note: "Order placed" }],
    invoiceNo: newInvoiceNo(orderId),
    idempotencyKey,
    extras: {
      giftWrap: !!extras.giftWrap,
      giftMessage: extras.giftWrap ? (extras.giftMessage || "").slice(0, 200) : "",
      gstin: extras.gstin || null,
      businessName: extras.gstin ? extras.businessName || "" : "",
      instructions: (extras.instructions || "").slice(0, 200),
      slot: extras.slot || "Anytime",
    },
  };

  // 3. Reserve stock
  onStage("reserving");
  const reserved = reserveStock(orderId, order.allocations);
  if (!reserved.ok) {
    const name = productMap[reserved.productId]?.name;
    return { ok: false, error: `${name || "An item"} just went out of stock. Please review your bag.` };
  }
  setState((st) => ({ ...st, orders: [order, ...st.orders] }));
  patchOrder(orderId, (o) => addTimeline(o, "stock_reserved", "Stock reserved for 15 minutes"));

  if (summary.total === 0) {
    // Fully paid with D2C credits / coins — no gateway needed
    patchOrder(orderId, (o) => ({ payment: { ...o.payment, method: "wallet", gateway: "wallet" } }));
    confirmOrder(orderId, { method: "wallet", instrument: "D2C credits & coins" });
    return { ok: true, order: getState().orders.find((o) => o.id === orderId) };
  }

  if (paymentMethod === "cod") {
    confirmOrder(orderId, { method: "cod" });
    return { ok: true, order: getState().orders.find((o) => o.id === orderId) };
  }

  return collectPayment(orderId, { user, address, paymentMethod, onStage });
}

/** Payment step — also used for retries. */
export async function collectPayment(orderId, { user, address, paymentMethod, onStage = () => {} }) {
  const order = getState().orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.payment.status === "paid") return { ok: true, order };

  // Re-reserve for retries (stock was released after a failure)
  const active = getState().reservations.find((r) => r.orderId === orderId && r.status === "active");
  if (!active) {
    const again = reserveStock(orderId, order.allocations);
    if (!again.ok) return { ok: false, error: "Some items went out of stock while you were paying." };
    patchOrder(orderId, (o) => ({ status: "pending_payment", ...addTimeline(o, "stock_reserved", "Stock re-reserved for payment retry") }));
  }

  onStage("creating_payment");
  let gatewayOrder;
  try {
    gatewayOrder = await createGatewayOrder({ orderId, amount: order.pricing.total, customer: user.email, order });
  } catch (e) {
    releaseReservation(orderId, "release");
    failOrder(orderId, e.message || "Could not create payment order");
    return { ok: false, error: e.message, retry: true, orderId };
  }
  patchOrder(orderId, (o) => ({ payment: { ...o.payment, method: paymentMethod, razorpayOrderId: gatewayOrder.id, gatewayMode: gatewayOrder.sandbox ? "sandbox" : "live" } }));
  log({ orderId, event: "gateway_order_created", ref: gatewayOrder.id, amount: order.pricing.total });

  onStage("awaiting_payment");
  const result = await openCheckout({ gatewayOrder, amount: order.pricing.total, method: paymentMethod, user, address, orderId });

  if (result.status !== "success") {
    const reason = result.status === "dismissed" ? "Payment cancelled by customer" : result.error || "Payment failed";
    releaseReservation(orderId, "release");
    failOrder(orderId, reason, result.status === "dismissed" ? "cancelled" : "failed");
    log({ orderId, event: `payment_${result.status}`, ref: gatewayOrder.id, note: reason });
    notify(user.id, { type: "payment", title: "Payment not completed", body: `${reason}. Your items are still in your order — retry within 15 minutes.`, link: `/orders/${orderId}` });
    return { ok: false, error: reason, retry: true, orderId };
  }

  onStage("verifying");
  const verification = await verifyPayment({ ...result, sandbox: !!gatewayOrder.sandbox });
  if (!verification.verified) {
    releaseReservation(orderId, "release");
    failOrder(orderId, "Payment signature verification failed", "failed");
    log({ orderId, event: "signature_mismatch", ref: result.razorpay_payment_id });
    return { ok: false, error: "We couldn't verify your payment. Any amount debited will be auto-refunded in 5–7 days.", retry: true, orderId };
  }

  log({ orderId, event: "payment_verified", ref: result.razorpay_payment_id, amount: order.pricing.total });
  onStage("confirming");
  confirmOrder(orderId, {
    proof: gatewayOrder.sandbox ? null : result,
    method: paymentMethod,
    razorpayPaymentId: result.razorpay_payment_id,
    razorpayOrderId: result.razorpay_order_id,
    signature: result.razorpay_signature,
    instrument: result.instrument,
  });
  return { ok: true, order: getState().orders.find((o) => o.id === orderId) };
}

function failOrder(orderId, reason, kind = "failed") {
  patchOrder(orderId, (o) => ({
    status: "payment_failed",
    payment: { ...o.payment, status: kind, attempts: [...o.payment.attempts, { at: Date.now(), status: kind, reason }] },
    ...addTimeline(o, "payment_failed", `${reason} — reserved stock released`),
  }));
}

function confirmOrder(orderId, payment) {
  commitReservation(orderId);
  const order = getState().orders.find((o) => o.id === orderId);
  const now = Date.now();
  const shipments = order.fulfilmentPlan.map((g, i) =>
    buildShipment({
      id: `SHP${orderId.slice(-6)}${i + 1}`,
      warehouseId: g.warehouseId,
      courierId: g.courierId,
      lineIds: g.lineIds,
      createdAt: now + 20000,
      destCity: order.address.city,
      stepMs: DEMO_STEP_MS,
      etaDays: g.days,
    })
  );
  const instrumentLabel = {
    upi: "UPI",
    card: "Card",
    netbanking: "Net Banking",
    wallet: payment.instrument || "Wallet",
    cod: "Cash on Delivery",
  }[payment.method];

  patchOrder(orderId, (o) => ({
    status: "confirmed",
    shipments,
    payment: {
      ...o.payment,
      status: payment.method === "cod" ? "cod_pending" : "paid",
      razorpayPaymentId: payment.razorpayPaymentId || null,
      razorpayOrderId: payment.razorpayOrderId || o.payment.razorpayOrderId || null,
      signature: payment.signature || null,
      signatureVerified: payment.method !== "cod",
      instrument: payment.instrument && typeof payment.instrument === "string" && payment.instrument.length > 6 ? payment.instrument : instrumentLabel,
      paidAt: payment.method === "cod" ? null : now,
      attempts: [...o.payment.attempts, { at: now, status: payment.method === "cod" ? "cod" : "success" }],
    },
    timeline: [
      ...o.timeline,
      ...(payment.method === "cod" ? [] : [{ status: "paid", at: now, note: "Payment received & Razorpay signature verified" }]),
      { status: "confirmed", at: now, note: `Order confirmed · ${shipments.length} shipment${shipments.length > 1 ? "s" : ""} created` },
    ],
  }));

  // coupon usage + clear bag
  setState((st) => {
    const code = order.pricing.couponCode;
    const usage = code
      ? { ...st.couponUsage, [order.userId]: { ...(st.couponUsage[order.userId] || {}), [code]: ((st.couponUsage[order.userId] || {})[code] || 0) + 1 } }
      : st.couponUsage;
    const orderedKeys = new Set(order.items.map((i) => `${i.productId}__${i.size || "-"}__${i.color || "-"}`));
    return {
      ...st,
      couponUsage: usage,
      appliedCoupon: null,
      cart: st.cart.filter((l) => !orderedKeys.has(`${l.productId}__${l.size || "-"}__${l.color || "-"}`)),
    };
  });

  if (order.pricing.creditsUsed || order.pricing.coinsUsed) {
    updateUser(order.userId, (u) => ({
      credits: Math.max(0, (u.credits || 0) - (order.pricing.creditsUsed || 0)),
      walletLedger: order.pricing.creditsUsed ? [{ id: `wl-${orderId}`, at: now, type: "debit", amount: order.pricing.creditsUsed, note: `Used on order ${orderId}` }, ...(u.walletLedger || [])] : u.walletLedger,
      coinsSpent: order.pricing.coinsUsed ? [...(u.coinsSpent || []), { id: `cs-${orderId}`, at: now, amount: order.pricing.coinsUsed, note: `Redeemed on order ${orderId}` }] : u.coinsSpent,
    }));
  }

  notify(order.userId, {
    type: "order",
    title: "Order confirmed 🎉",
    body: `${order.items.length} item${order.items.length > 1 ? "s" : ""} · ${formatINR(order.pricing.total)} · ${shipments.length} shipment${shipments.length > 1 ? "s" : ""} from ${shipments.map((s) => getWarehouse(s.warehouseId).short).join(" & ")}`,
    link: `/orders/${orderId}`,
    channels: ["email", "sms", "whatsapp"],
  });
  if (payment.method !== "cod")
    notify(order.userId, { type: "payment", title: "Payment received", body: `${formatINR(order.pricing.total)} paid via ${instrumentLabel} for order ${orderId}.`, link: `/orders/${orderId}`, channels: ["email", "sms"] });

  syncOrderToServer(orderId, payment);
}

/**
 * Server confirmation (runs when the API is configured): verifies payment on the
 * server, re-prices, persists, creates real Shiprocket shipments and sends
 * email/SMS/WhatsApp. Live AWBs replace the local ones so tracking uses Shiprocket.
 */
async function syncOrderToServer(orderId, payment) {
  const needServer = live("db") || live("shiprocket") || live("notifications");
  const isCod = payment.method === "cod";
  const s = getState();
  if (!needServer || (!isCod && !payment.proof) || (isCod && !s.session?.serverToken)) return;
  const order = s.orders.find((o) => o.id === orderId);
  try {
    const r = await api("/orders/confirm", {
      method: "POST",
      body: {
        order: { ...order, email: order.email, items: order.items.map((i) => ({ lineId: i.lineId, productId: i.productId, qty: i.qty, size: i.size, color: i.color, name: i.name })), wallet: { credits: order.pricing.creditsUsed || 0, coins: order.pricing.coinsUsed || 0 } },
        payment: isCod ? { method: "cod" } : payment.proof,
      },
    });
    patchOrder(orderId, (o) => ({
      serverSynced: true,
      shipments: o.shipments.map((sh) => {
        const liveShip = r.shipments?.find((x) => x.warehouseId === sh.warehouseId && x.awb);
        return liveShip ? { ...sh, awb: liveShip.awb, liveCourier: liveShip.courier, trackingUrl: liveShip.trackingUrl, provider: "shiprocket-live" } : sh;
      }),
      timeline: [
        ...o.timeline,
        { status: "server", at: Date.now(), note: `Confirmed on server${r.persisted ? " & saved" : ""}${r.shipments?.some((x) => x.awb) ? " · Shiprocket AWB generated" : ""}` },
      ],
    }));
  } catch (e) {
    patchOrder(orderId, (o) => ({ timeline: [...o.timeline, { status: "server_error", at: Date.now(), note: `Server sync pending: ${e.message}` }] }));
  }
}


/** Called when the customer leaves checkout mid-payment. */
export function abandonPayment(orderId) {
  const o = getState().orders.find((x) => x.id === orderId);
  if (!o || o.status !== "pending_payment") return;
  releaseReservation(orderId, "release");
  failOrder(orderId, "Checkout abandoned", "cancelled");
}

/* ---------- post-purchase ---------- */

export function canCancel(order) {
  if (["cancelled", "payment_failed", "delivered", "returned", "return_requested"].includes(order.status)) return false;
  return order.shipments.every((s) => ["created", "pickup_scheduled"].includes(shipmentStatus(s)));
}

export function cancelOrder(orderId, reason, by = "customer") {
  const o = getState().orders.find((x) => x.id === orderId);
  if (!o) return { ok: false };
  if (o.status === "pending_payment" || o.status === "payment_failed") {
    releaseReservation(orderId, "release");
    patchOrder(orderId, (x) => ({ status: "cancelled", ...addTimeline(x, "cancelled", "Order cancelled") }));
    return { ok: true };
  }
  if (by === "customer" && !canCancel(o)) return { ok: false, error: "This order has already been shipped and can't be cancelled. You can return it after delivery." };
  restock(o.allocations || [], "cancel", orderId, by);
  const paid = o.payment.status === "paid";
  patchOrder(orderId, (x) => ({
    status: "cancelled",
    cancelReason: reason,
    shipments: x.shipments.map((s) => ({ ...s, cancelled: true, frozen: Date.now() })),
    payment: { ...x.payment, status: paid ? "refund_initiated" : "cancelled", refundAt: paid ? Date.now() : null },
    ...addTimeline(x, "cancelled", `Cancelled (${reason})${paid ? ` — refund of ${formatINR(x.pricing.total)} initiated to original payment method` : ""}`),
  }));
  if (o.pricing.creditsUsed || o.pricing.coinsUsed) {
    updateUser(o.userId, (u) => ({
      credits: (u.credits || 0) + (o.pricing.creditsUsed || 0),
      walletLedger: o.pricing.creditsUsed ? [{ id: `wr-${orderId}`, at: Date.now(), type: "credit", amount: o.pricing.creditsUsed, note: `Refund for cancelled order ${orderId}` }, ...(u.walletLedger || [])] : u.walletLedger,
      coinsSpent: (u.coinsSpent || []).filter((c) => c.id !== `cs-${orderId}`),
    }));
  }
  notify(o.userId, {
    type: "order",
    title: "Order cancelled",
    body: paid ? `Refund of ${formatINR(o.pricing.total)} will reach your ${o.payment.instrument || "original payment method"} in 3–5 working days.` : `Order ${orderId} has been cancelled.`,
    link: `/orders/${orderId}`,
    channels: ["email", "sms"],
  });
  return { ok: true };
}

export function returnWindowOpen(order, item, deliveredAtTs) {
  if (!deliveredAtTs || !item.returnDays) return false;
  return Date.now() - deliveredAtTs < item.returnDays * 86400000;
}

/* ---------- returns ---------- */

const RETURN_FLOW = ["requested", "approved", "pickup_scheduled", "picked_up", "qc_passed", "refund_initiated", "refunded"];
export const RETURN_LABEL = {
  requested: "Return requested",
  approved: "Return approved",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  qc_passed: "Quality check passed",
  refund_initiated: "Refund initiated",
  refunded: "Refund completed",
  exchange_shipped: "Replacement shipped",
  cancelled: "Return cancelled",
  rejected: "Return rejected",
};

export function requestReturn({ order, lineIds, reason, comment, type, pickupSlot, refundMethod, userId }) {
  const now = Date.now();
  const lines = order.items.filter((i) => lineIds.includes(i.lineId));
  const amount = lines.reduce((t, i) => t + i.price * i.qty, 0);
  const step = DEMO_STEP_MS * 1.5;
  const plan = RETURN_FLOW.map((status, i) => ({
    status: type === "exchange" && status === "refund_initiated" ? "exchange_shipped" : status,
    at: now + i * step,
  })).filter((e) => !(type === "exchange" && e.status === "refunded"));
  const ret = {
    id: `RET${String(now).slice(-8)}`,
    orderId: order.id,
    userId,
    lineIds,
    type,
    reason,
    comment,
    pickupSlot,
    refundMethod,
    refundAmount: type === "exchange" ? 0 : amount,
    status: "requested",
    createdAt: now,
    plan,
    timeline: [{ status: "requested", at: now, note: RETURN_LABEL.requested }],
  };
  setState((st) => ({ ...st, returns: [ret, ...st.returns] }));
  patchOrder(order.id, (o) => ({ returnState: "requested", ...addTimeline(o, "return_requested", `${type === "exchange" ? "Exchange" : "Return"} requested for ${lines.length} item(s)`) }));
  notify(userId, { type: "return", title: `${type === "exchange" ? "Exchange" : "Return"} request received`, body: `Pickup ${pickupSlot}. ${type === "exchange" ? "Replacement ships after pickup." : `Refund of ${formatINR(amount)} after quality check.`}`, link: "/returns", channels: ["email", "sms", "whatsapp"] });
  return ret;
}

export function returnStatus(ret, now = Date.now()) {
  if (ret.status === "cancelled" || ret.status === "rejected") return ret.status;
  if (!ret.plan) return ret.status;
  const done = ret.plan.filter((e) => e.at <= now);
  return done.length ? done[done.length - 1].status : "requested";
}

export function returnEvents(ret, now = Date.now()) {
  if (!ret.plan) return ret.timeline;
  const base = ret.plan.filter((e) => e.at <= now).map((e) => ({ ...e, note: RETURN_LABEL[e.status] }));
  const extra = ret.timeline.filter((t) => t.status === "cancelled" || t.status === "rejected");
  return [...base, ...extra];
}

export function cancelReturn(retId) {
  const r = getState().returns.find((x) => x.id === retId);
  if (!r) return { ok: false };
  const st = returnStatus(r);
  if (["picked_up", "qc_passed", "refund_initiated", "refunded", "exchange_shipped"].includes(st)) return { ok: false, error: "Item already picked up — the return can't be cancelled now." };
  setState((s) => ({
    ...s,
    returns: s.returns.map((x) => (x.id === retId ? { ...x, status: "cancelled", plan: x.plan?.filter((e) => e.at <= Date.now()), timeline: [...x.timeline, { status: "cancelled", at: Date.now(), note: RETURN_LABEL.cancelled }] } : x)),
    orders: s.orders.map((o) => (o.id === r.orderId ? { ...o, returnState: null } : o)),
  }));
  return { ok: true };
}

/* ---------- support tickets & reviews ---------- */

export function createTicket({ userId, orderId, subject, message, category }) {
  const t = {
    id: `TKT-${String(Date.now()).slice(-5)}`,
    userId,
    orderId: orderId || null,
    subject,
    category,
    status: "open",
    createdAt: Date.now(),
    messages: [
      { from: "customer", text: message, at: Date.now() },
      { from: "support", text: "Thanks for reaching out! A support specialist will reply within 2 hours. Meanwhile, you can track updates here.", at: Date.now() + 1000 },
    ],
  };
  setState((st) => ({ ...st, tickets: [t, ...st.tickets] }));
  notify(userId, { type: "support", title: `Ticket ${t.id} created`, body: subject, link: "/account/help", channels: ["email"] });
  return t;
}

export function replyTicket(ticketId, from, text) {
  setState((st) => ({
    ...st,
    tickets: st.tickets.map((t) => (t.id === ticketId ? { ...t, status: from === "support" ? "awaiting_customer" : "open", messages: [...t.messages, { from, text, at: Date.now() }] } : t)),
  }));
}

export function closeTicket(ticketId) {
  setState((st) => ({ ...st, tickets: st.tickets.map((t) => (t.id === ticketId ? { ...t, status: "resolved" } : t)) }));
}

export function addReview(productId, review) {
  setState((st) => ({
    ...st,
    userReviews: { ...st.userReviews, [productId]: [{ id: uid("rv"), date: Date.now(), helpful: 0, verified: true, ...review }, ...(st.userReviews[productId] || [])] },
  }));
}

/* ---------- admin-side shipment operations (Shiprocket actions) ---------- */

export function adminShipmentAction(orderId, shipmentId, action, payload = {}) {
  const now = Date.now();
  setState((st) => ({
    ...st,
    orders: st.orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        shipments: o.shipments.map((s) => {
          if (s.id !== shipmentId) return s;
          if (action === "advance") {
            const idx = s.plan.findIndex((e) => e.at > now);
            if (idx < 0) return s;
            const shift = s.plan[idx].at - now;
            return { ...s, plan: s.plan.map((e, i) => (i >= idx ? { ...e, at: e.at - shift } : e)) };
          }
          if (action === "fail") {
            const shifted = s.plan.map((e) => (e.at > now ? { ...e, at: e.at + DEMO_STEP_MS * 2 } : e));
            return {
              ...s,
              attempts: (s.attempts || 1) + 1,
              plan: shifted,
              manualEvents: [
                ...s.manualEvents,
                { status: "delivery_failed", at: now, location: o.address.city, note: payload.reason || "Delivery attempt failed" },
                { status: "reattempt", at: now + 1000, location: o.address.city, note: "Re-attempt scheduled" },
              ],
            };
          }
          if (action === "reassign") {
            const c = getCourier(payload.courierId);
            return {
              ...s,
              courierId: payload.courierId,
              awb: `${payload.courierId.slice(0, 2).toUpperCase()}${Math.floor(1e10 + Math.random() * 9e10)}`,
              manualEvents: [...s.manualEvents, { status: "reassigned", at: now, location: getWarehouse(s.warehouseId).short, note: `Reassigned to ${c.name} · new AWB generated` }],
            };
          }
          if (action === "hold") return { ...s, frozen: s.frozen ? null : now };
          return s;
        }),
      };
    }),
  }));
  const o = getState().orders.find((x) => x.id === orderId);
  if (action === "fail") notify(o.userId, { type: "shipment", title: "Delivery attempt failed", body: `${payload.reason || "We couldn't deliver your package"}. We'll try again tomorrow.`, link: `/orders/${orderId}`, channels: ["sms", "whatsapp"] });
}
