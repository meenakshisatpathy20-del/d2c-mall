/*
 * Shipping service — the D2C Mall equivalent of the Shiprocket panel.
 *
 * Who changes what (same as Shiprocket):
 *   New → Ready to ship        staff click "Ship now" (or the auto-ship rule)
 *   Ready → Pickup scheduled   staff click "Schedule pickup" (or auto)
 *   Picked up … Delivered      courier scans only (webhook in live mode)
 *   NDR                        courier marks failed; customer or staff respond
 *   RTO                        staff choose "Return to origin"; scans follow;
 *                              staff confirm "received & restocked"
 *
 * Live mode (Shiprocket credentials set): every action also calls
 * /api/shiprocket/ops on the server. Demo mode simulates the courier network.
 */
import { getState, setState, useStore } from "../store";
import { api, live } from "../api";
import { getWarehouse, lookupPincode } from "../../data/logistics";
import { productMap } from "../../data/catalog";
import { shipmentStatus } from "../orderModel";
import {
  NDR_REASONS,
  courierName,
  defaultPackage,
  newAwbFor,
  pickByRule,
  pickupPlan,
  quoteForShipment,
  reattemptPlan,
  rtoPlan,
} from "../shippingModel";
import { notify } from "./account";
import { reallocate, restock } from "./inventory";
import { formatDate, formatINR, uid } from "../format";

/** Demo courier clock: one scan every 3 minutes. */
export const SHIP_STEP_MS = 3 * 60 * 1000;
const DAY = 86400000;

export const DEFAULT_SHIPPING_SETTINGS = {
  autoShip: false,
  autoPickup: true,
  courierRule: "recommended",
  codMaxValue: 20000,
  codBlockedPincodes: [],
  ndrMaxAttempts: 2,
  remittanceCycleDays: 7,
  pickupSlot: "10:00 AM – 2:00 PM",
  demoNdrRate: 0.2,
  notifyChannels: ["sms", "whatsapp", "email"],
  trackingNote: "Questions about your delivery? Reply on WhatsApp or call 1800-120-D2C.",
};

export function getShippingSettings() {
  return { ...DEFAULT_SHIPPING_SETTINGS, ...(getState().shippingSettings || {}) };
}

export function useShippingSettings() {
  const s = useStore((st) => st.shippingSettings);
  return { ...DEFAULT_SHIPPING_SETTINGS, ...(s || {}) };
}

export function updateShippingSettings(patch) {
  setState((st) => ({ ...st, shippingSettings: { ...getShippingSettings(), ...patch } }));
}

export const useManifests = () => useStore((s) => s.manifests) || [];

/* ---------- helpers ---------- */

function findShipment(orderId, shipmentId) {
  const order = getState().orders.find((o) => o.id === orderId);
  const shipment = order?.shipments.find((s) => s.id === shipmentId);
  return { order, shipment };
}

function patchShipment(orderId, shipmentId, fn, orderPatch) {
  setState((st) => ({
    ...st,
    orders: st.orders.map((o) => {
      if (o.id !== orderId) return o;
      const shipments = o.shipments.map((s) => (s.id === shipmentId ? { ...s, ...fn(s, o) } : s));
      return { ...o, shipments, ...(orderPatch ? orderPatch(o) : {}) };
    }),
  }));
}

const event = (status, location, note, at = Date.now()) => ({ status, at, location, note });

async function liveOp(action, body) {
  if (!live("shiprocket")) return null;
  return api("/shiprocket/ops", { method: "POST", body: { action, ...body } });
}

function lineItems(order, shipment) {
  return order.items.filter((i) => shipment.lineIds.includes(i.lineId));
}

/* ---------- order → NEW shipments ---------- */

/**
 * Called when an order is confirmed: one NEW shipment per warehouse in the
 * fulfilment plan, with a suggested courier and package. Nothing is sent to a
 * courier until staff (or the auto-ship rule) click "Ship now".
 */
export function createNewShipments(order) {
  const now = Date.now();
  const settings = getShippingSettings();
  return order.fulfilmentPlan.map((g, i) => {
    const items = order.items.filter((it) => g.lineIds.includes(it.lineId));
    const pkg = defaultPackage(items.map((it) => ({ weightKg: productMap[it.productId]?.weightKg, qty: it.qty })));
    const draft = { id: `SHP${order.id.slice(-6)}${i + 1}`, warehouseId: g.warehouseId, lineIds: g.lineIds, package: pkg };
    const q = quoteForShipment(order, draft);
    const suggested = q.ok ? pickByRule(q.list, settings.courierRule) : null;
    return {
      ...draft,
      courierId: suggested?.courierId || g.courierId,
      awb: null,
      stage: "new",
      createdAt: now,
      etaAt: now + ((suggested?.days || g.days || 4) + 1) * DAY,
      plan: [],
      manualEvents: [event("new", getWarehouse(g.warehouseId).short, "Order received at warehouse · packing", now)],
      attempts: 0,
      provider: "shiprocket",
      notifiedAt: now,
    };
  });
}

/** Auto-ship rule: ship + schedule pickup right after confirmation. */
export async function autoShipOrder(orderId) {
  const s = getShippingSettings();
  if (!s.autoShip) return;
  const order = getState().orders.find((o) => o.id === orderId);
  for (const sh of order?.shipments || []) await shipNow(orderId, sh.id, { by: "auto-ship rule" });
}

/* ---------- staff actions ---------- */

export async function shipNow(orderId, shipmentId, { courierId, by = "staff" } = {}) {
  const { order, shipment } = findShipment(orderId, shipmentId);
  if (!shipment) return { ok: false, error: "Shipment not found" };
  if (shipment.stage !== "new") return { ok: false, error: "Already shipped" };
  const settings = getShippingSettings();
  const value = lineItems(order, shipment).reduce((t, i) => t + i.price * i.qty, 0);
  if (order.payment.method === "cod" && value > settings.codMaxValue) return { ok: false, error: `COD limit is ${formatINR(settings.codMaxValue)} — convert to prepaid or raise the limit in Settings.` };
  if (order.payment.method === "cod" && settings.codBlockedPincodes.includes(order.address.pincode)) return { ok: false, error: "COD is blocked for this pincode (Settings)." };
  const q = quoteForShipment(order, shipment);
  if (!q.ok) return { ok: false, error: q.reason };
  const pick = (courierId && q.list.find((c) => c.courierId === courierId)) || pickByRule(q.list, settings.courierRule);

  let awb = newAwbFor(pick.courierId);
  let liveInfo = {};
  try {
    const r = await liveOp("assign-awb", { srShipmentId: shipment.srShipmentId, courierId: pick.courierId, orderId, shipmentId });
    if (r?.awb) {
      awb = r.awb;
      liveInfo = { provider: "shiprocket-live", liveCourier: r.courier, trackingUrl: r.trackingUrl };
    }
  } catch (e) {
    return { ok: false, error: `Shiprocket: ${e.message}` };
  }

  const now = Date.now();
  patchShipment(orderId, shipmentId, (s) => ({
    stage: "ready",
    courierId: pick.courierId,
    awb,
    ...liveInfo,
    charges: { freight: pick.freight, cod: pick.codCharge, total: pick.total, zone: q.zone.id, chargeableKg: q.weight },
    etaAt: now + (pick.days + 1) * DAY,
    shippedAt: now,
    shippedBy: by,
    manualEvents: [...s.manualEvents, event("awb_assigned", getWarehouse(s.warehouseId).short, `AWB ${awb} assigned · ${pick.name} · label & invoice generated`, now)],
  }));
  notify(order.userId, { type: "shipment", title: "Packed & ready to ship 📦", body: `${courierName(pick.courierId)} will pick up order ${orderId} soon. AWB ${awb}.`, link: `/track?awb=${awb}`, channels: ["push", "sms"] });
  if (settings.autoPickup) await schedulePickup(orderId, shipmentId, { by });
  return { ok: true, awb, courier: pick.name };
}

export async function schedulePickup(orderId, shipmentId, { by = "staff", date } = {}) {
  const { order, shipment } = findShipment(orderId, shipmentId);
  if (!shipment || shipment.stage !== "ready") return { ok: false, error: "Assign an AWB first" };
  try {
    await liveOp("pickup", { srShipmentIds: [shipment.srShipmentId].filter(Boolean) });
  } catch (e) {
    return { ok: false, error: `Shiprocket: ${e.message}` };
  }
  const settings = getShippingSettings();
  const failed = shipment.provider !== "shiprocket-live" && Math.random() < settings.demoNdrRate;
  const start = Date.now();
  const wh = getWarehouse(shipment.warehouseId);
  const plan = pickupPlan({
    start,
    firstGap: SHIP_STEP_MS,
    stepMs: SHIP_STEP_MS,
    origin: wh.short,
    destCity: order.address.city,
    courierLabel: courierName(shipment.courierId),
    outcome: failed ? "failed" : "delivered",
    reason: NDR_REASONS[Math.floor(Math.random() * NDR_REASONS.length)],
  });
  patchShipment(orderId, shipmentId, () => ({
    stage: "pickup",
    plan: shipment.provider === "shiprocket-live" ? plan.slice(0, 1) : plan,
    pickupAt: date || start,
    pickupBy: by,
    attempts: 1,
  }));
  return { ok: true };
}

/** Shiprocket "Cancel shipment": AWB is cancelled and the order goes back to NEW. */
export async function cancelShipmentAwb(orderId, shipmentId, by = "staff") {
  const { shipment } = findShipment(orderId, shipmentId);
  const st = shipmentStatus(shipment);
  if (!["awb_assigned", "pickup_scheduled"].includes(st)) return { ok: false, error: "Only shipments not yet picked up can be cancelled." };
  try {
    await liveOp("cancel", { srOrderIds: [shipment.srOrderId].filter(Boolean) });
  } catch (e) {
    return { ok: false, error: `Shiprocket: ${e.message}` };
  }
  patchShipment(orderId, shipmentId, (s) => ({
    stage: "new",
    awb: null,
    plan: [],
    charges: null,
    manifestId: null,
    manualEvents: [...s.manualEvents, event("new", getWarehouse(s.warehouseId).short, `AWB ${s.awb} cancelled by ${by} · back to New`)],
  }));
  return { ok: true };
}

export function changePickupWarehouse(orderId, shipmentId, warehouseId, by = "staff") {
  const { order, shipment } = findShipment(orderId, shipmentId);
  if (!shipment || shipment.stage !== "new") return { ok: false, error: "Change the warehouse before shipping." };
  if (shipment.warehouseId === warehouseId) return { ok: true };
  const allocs = (order.allocations || []).filter((a) => shipment.lineIds.includes(a.lineId));
  const r = reallocate(allocs.length ? allocs : lineItems(order, shipment).map((i) => ({ lineId: i.lineId, productId: i.productId, warehouseId: shipment.warehouseId, qty: i.qty })), warehouseId, orderId, by);
  if (!r.ok) return r;
  const from = getWarehouse(shipment.warehouseId).short;
  patchShipment(
    orderId,
    shipmentId,
    (s) => ({ warehouseId, manualEvents: [...s.manualEvents, event("new", getWarehouse(warehouseId).short, `Pickup warehouse changed from ${from} by ${by}`)] }),
    (o) => ({ allocations: (o.allocations || []).map((a) => (shipment.lineIds.includes(a.lineId) ? { ...a, warehouseId } : a)) })
  );
  return { ok: true };
}

export function updatePackage(orderId, shipmentId, pkg) {
  const { shipment } = findShipment(orderId, shipmentId);
  if (!shipment || shipment.stage !== "new") return { ok: false, error: "Package can be edited only before shipping." };
  patchShipment(orderId, shipmentId, (s) => ({ package: { ...s.package, ...pkg } }));
  return { ok: true };
}

export function generateManifest(warehouseId, refs, by = "staff") {
  const id = `MNF-${getWarehouse(warehouseId).short.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-6)}`;
  const manifest = { id, warehouseId, createdAt: Date.now(), by, refs };
  setState((st) => ({
    ...st,
    manifests: [manifest, ...(st.manifests || [])].slice(0, 100),
    orders: st.orders.map((o) => {
      const mine = refs.filter((r) => r.orderId === o.id);
      if (!mine.length) return o;
      return { ...o, shipments: o.shipments.map((s) => (mine.some((r) => r.shipmentId === s.id) ? { ...s, manifestId: id } : s)) };
    }),
  }));
  liveOp("manifest", { srShipmentIds: refs.map((r) => findShipment(r.orderId, r.shipmentId).shipment?.srShipmentId).filter(Boolean) }).catch(() => null);
  return manifest;
}

/* ---------- NDR (failed delivery) ---------- */

/**
 * action: "reattempt" | "update" (new address / phone + reattempt) | "rto"
 * by: "customer" | staff name
 */
export async function ndrAction(orderId, shipmentId, { action, by = "staff", date, phone, line1, landmark, note } = {}) {
  const { order, shipment } = findShipment(orderId, shipmentId);
  if (!shipment || shipmentStatus(shipment) !== "delivery_failed") return { ok: false, error: "This shipment has no pending failed delivery." };
  const settings = getShippingSettings();
  const attempts = shipment.attempts || 1;
  if (action !== "rto" && attempts >= settings.ndrMaxAttempts + 1) return { ok: false, error: `Maximum ${settings.ndrMaxAttempts} re-attempts reached — return to origin.` };
  try {
    await liveOp("ndr-action", { awb: shipment.awb, ndrAction: action === "rto" ? "return" : "re-attempt", comments: [note, date && `Deliver on ${date}`, phone && `Phone ${phone}`, line1 && `Address ${line1}`, landmark && `Landmark ${landmark}`].filter(Boolean).join(" · ") });
  } catch (e) {
    return { ok: false, error: `Shiprocket: ${e.message}` };
  }
  const now = Date.now();
  const start = date ? Math.max(now + 15000, new Date(date).getTime()) : now + 15000;
  const isLive = shipment.provider === "shiprocket-live";
  // Show the customer's/staff's choice immediately (screens refresh every few seconds).
  const lastAt = Math.max(0, ...shipment.plan.filter((e) => e.at <= now).map((e) => e.at));
  const instant = Math.max(lastAt + 1000, now - 4000);
  const extra =
    action === "rto"
      ? rtoPlan({ start: instant, stepMs: SHIP_STEP_MS, destCity: order.address.city, origin: getWarehouse(shipment.warehouseId).short, note: `Return to origin requested by ${by}` })
      : reattemptPlan({ requestedAt: instant, start, stepMs: SHIP_STEP_MS, destCity: order.address.city, attempt: attempts + 1, note: `Re-attempt requested by ${by}${date ? ` for ${formatDate(start, { year: false })}` : ""}` });
  const record = { at: now, by, action, note: note || null, date: date || null, phone: phone || null, line1: line1 || null, landmark: landmark || null };
  patchShipment(
    orderId,
    shipmentId,
    (s) => ({
      plan: [...s.plan.filter((e) => e.at <= now), ...(isLive ? extra.slice(0, 1) : extra)],
      attempts: action === "rto" ? attempts : attempts + 1,
      ndr: { history: [...(s.ndr?.history || []), record] },
    }),
    action === "update" && (phone || line1 || landmark)
      ? (o) => ({ address: { ...o.address, phone: phone || o.address.phone, line1: line1 || o.address.line1, landmark: landmark || o.address.landmark } })
      : null
  );
  notify(order.userId, {
    type: "shipment",
    title: action === "rto" ? "Order is being returned" : "Delivery re-attempt scheduled",
    body: action === "rto" ? `Order ${orderId} is returning to our warehouse.${order.payment.method !== "cod" ? " A refund will be issued once it arrives." : ""}` : `We'll try delivering order ${orderId} again${date ? ` on ${formatDate(start, { year: false })}` : " on the next working day"}.`,
    link: `/track?awb=${shipment.awb}`,
    channels: ["sms", "whatsapp"],
  });
  return { ok: true };
}

/** Staff confirm the RTO parcel is back in the warehouse → restock + refund if prepaid. */
export function markRtoReceived(orderId, shipmentId, by = "staff") {
  const { order, shipment } = findShipment(orderId, shipmentId);
  if (!shipment || shipmentStatus(shipment) !== "rto_delivered") return { ok: false, error: "Parcel is not back at the warehouse yet." };
  const allocs = (order.allocations || []).filter((a) => shipment.lineIds.includes(a.lineId));
  if (allocs.length) restock(allocs, "rto", orderId, by);
  const refund = order.payment.method !== "cod" ? lineItems(order, shipment).reduce((t, i) => t + i.price * i.qty, 0) : 0;
  patchShipment(
    orderId,
    shipmentId,
    (s) => ({ rtoReceivedAt: Date.now(), manualEvents: [...s.manualEvents, event("rto_received", getWarehouse(s.warehouseId).short, `Received & restocked by ${by}${refund ? ` · refund ${formatINR(refund)} initiated` : ""}`)] }),
    (o) => ({ timeline: [...o.timeline, { status: "rto", at: Date.now(), note: `Shipment ${shipmentId} returned to seller${refund ? ` · refund ${formatINR(refund)} initiated` : ""}` }] })
  );
  if (refund) notify(order.userId, { type: "refund", title: "Refund initiated", body: `${formatINR(refund)} for undelivered order ${orderId} will reach your original payment method in 5–7 days.`, link: `/orders/${orderId}`, channels: ["email", "sms"] });
  return { ok: true, refund };
}

/** Demo only: bring the next courier scan forward (for showing the flow quickly). */
export function simulateNextScan(orderId, shipmentId) {
  const now = Date.now();
  patchShipment(orderId, shipmentId, (s) => {
    const idx = s.plan.findIndex((e) => e.at > now);
    if (idx < 0) return {};
    const shift = s.plan[idx].at - now;
    return { plan: s.plan.map((e, i) => (i >= idx ? { ...e, at: e.at - shift } : e)) };
  });
}

/* ---------- customer side ---------- */

const digits = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/** Public tracking lookup: by AWB, or by order ID + registered phone. */
export function findShipmentsForTracking({ awb, orderId, phone }) {
  const orders = getState().orders;
  if (awb) {
    const a = awb.trim().toUpperCase();
    for (const o of orders) {
      const s = o.shipments.find((x) => (x.awb || "").toUpperCase() === a || x.id.toUpperCase() === a);
      if (s) return { ok: true, order: o, shipments: [s] };
    }
    return { ok: false, error: "No shipment found for this AWB." };
  }
  const o = orders.find((x) => x.id.toUpperCase() === String(orderId || "").trim().toUpperCase());
  if (!o || digits(o.address.phone) !== digits(phone)) return { ok: false, error: "Order ID and phone number don't match our records." };
  return { ok: true, order: o, shipments: o.shipments.filter((s) => !s.cancelled) };
}

/** Delivery charge calculator for customers (uses the shipping rate engine). */
export { quoteCouriers } from "../shippingModel";
export const pinInfo = lookupPincode;
export const newManifestId = () => uid("mnf");

/** Customer rates the delivery experience (shown in reports / courier performance). */
export function rateDelivery(orderId, shipmentId, { rating, comment }) {
  patchShipment(orderId, shipmentId, () => ({ feedback: { rating, comment: comment || "", at: Date.now() } }));
}
