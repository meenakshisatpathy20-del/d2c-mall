/*
 * Orders (server side):
 *   POST /api/orders/confirm  { order, payment }   Verify payment → re-price → idempotency
 *                                                  → persist → Shiprocket shipments → notify
 *   GET  /api/orders/list                          (Bearer customer token)
 *
 * payment = { razorpay_order_id, razorpay_payment_id, razorpay_signature }  (prepaid)
 *         | { method: "cod" }                                                (requires login token)
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, validate } from "./_lib/http.js";
import { requireAuth, verifyJwt } from "./_lib/auth.js";
import { db, dbConfigured } from "./_lib/db.js";
import { serverSummary } from "./_lib/pricing.js";
import { PICKUP_LOCATIONS, sr } from "./_lib/shiprocket.js";
import { sendNotification } from "./_lib/notify.js";
import { router } from "./_lib/router.js";

const shiprocketReady = () => Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);

function verifySignature(p) {
  if (!process.env.RAZORPAY_KEY_SECRET) throw new ApiError(503, "NOT_CONFIGURED", "Razorpay is not configured");
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${p.razorpay_order_id}|${p.razorpay_payment_id}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(p.razorpay_signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function createShipments(order) {
  if (!shiprocketReady()) return { status: "skipped", shipments: [] };
  const out = [];
  for (const g of order.fulfilmentPlan || []) {
    const items = order.items.filter((i) => g.lineIds.includes(i.lineId));
    if (!items.length) continue;
    try {
      const created = await sr("/orders/create/adhoc", {
        method: "POST",
        body: {
          order_id: `${order.id}-${out.length + 1}`,
          order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
          pickup_location: PICKUP_LOCATIONS[g.warehouseId],
          billing_customer_name: order.address.name,
          billing_last_name: "",
          billing_address: order.address.line1,
          billing_address_2: order.address.line2 || "",
          billing_city: order.address.city,
          billing_pincode: order.address.pincode,
          billing_state: order.address.state,
          billing_country: "India",
          billing_email: order.email || "orders@d2cmall.in",
          billing_phone: order.address.phone,
          shipping_is_billing: true,
          order_items: items.map((i) => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: i.price })),
          payment_method: order.payment.method === "cod" ? "COD" : "Prepaid",
          sub_total: items.reduce((t, i) => t + i.price * i.qty, 0),
          length: 30,
          breadth: 25,
          height: 5,
          weight: Math.max(0.5, items.reduce((t, i) => t + (i.weightKg || 0.5) * i.qty, 0)),
        },
      });
      const awb = await sr("/courier/assign/awb", { method: "POST", body: { shipment_id: created.shipment_id } });
      await sr("/courier/generate/pickup", { method: "POST", body: { shipment_id: [created.shipment_id] } }).catch(() => null);
      const d = awb?.response?.data || {};
      out.push({ warehouseId: g.warehouseId, lineIds: g.lineIds, shiprocketShipmentId: created.shipment_id, awb: d.awb_code, courier: d.courier_name, trackingUrl: d.awb_code ? `https://shiprocket.co/tracking/${d.awb_code}` : null });
      if (d.awb_code && dbConfigured()) await db.set(`awb:${d.awb_code}`, { orderId: order.id, userId: order.userId });
    } catch (e) {
      out.push({ warehouseId: g.warehouseId, lineIds: g.lineIds, error: e.message });
    }
  }
  return { status: "created", shipments: out };
}

const confirm = handler(
  ["POST"],
  async (req) => {
    const { order, payment } = await readJson(req);
    if (!order || !payment) throw new ApiError(422, "VALIDATION_FAILED", "order and payment are required");
    validate(order, { id: ["string"], idempotencyKey: ["string"] });
    validate(order.address || {}, { name: ["string"], phone: ["phone"], line1: ["string"], city: ["string"], state: ["string"], pincode: ["pincode"] });

    // 1. Who is paying? Prepaid → Razorpay signature proves payment. COD → must be logged in.
    let claims = null;
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (bearer) claims = verifyJwt(bearer);
    const cod = payment.method === "cod";
    if (cod && !claims) throw new ApiError(401, "UNAUTHENTICATED", "Login required for Cash on Delivery");
    if (!cod && !verifySignature(payment)) throw new ApiError(400, "SIGNATURE_INVALID", "Payment signature verification failed");

    // 2. Re-price on the server
    const { items, summary } = serverSummary({
      items: order.items,
      couponCode: order.pricing?.couponCode,
      paymentMethod: cod ? "cod" : order.payment?.method,
      deliverySpeed: order.deliverySpeed,
    });

    // 3. Idempotency — one order per checkout attempt / payment
    const idemKey = cod ? `idem:${order.idempotencyKey}` : `idem:pay:${payment.razorpay_payment_id}`;
    if (dbConfigured()) {
      const fresh = await db.setnx(idemKey, order.id, 86400);
      if (!fresh) {
        const existingId = await db.get(idemKey);
        const existing = existingId ? await db.get(`order:${existingId}`) : null;
        return { duplicate: true, order: existing };
      }
    }

    const record = {
      ...order,
      items: order.items.map((i, idx) => ({ ...i, price: items[idx].price, mrp: items[idx].mrp, sku: items[idx].sku })),
      pricing: summary,
      userId: claims?.sub || order.userId || null,
      email: claims?.email || order.email || null,
      status: "confirmed",
      payment: {
        method: cod ? "cod" : order.payment?.method,
        status: cod ? "cod_pending" : "paid",
        razorpayOrderId: payment.razorpay_order_id || null,
        razorpayPaymentId: payment.razorpay_payment_id || null,
        signatureVerified: !cod,
      },
      serverConfirmedAt: Date.now(),
    };

    // 4. Shipments via Shiprocket
    const shipping = await createShipments(record);
    record.liveShipments = shipping.shipments;

    // 5. Persist
    if (dbConfigured()) {
      await db.set(`order:${record.id}`, record);
      if (record.userId) await db.lpush(`orders:${record.userId}`, record.id);
      await db.lpush("orders:all", record.id);
    }

    // 6. Notify customer (email / SMS / WhatsApp — whichever providers are configured)
    const link = `${process.env.PUBLIC_URL || ""}/orders/${record.id}`;
    const contact = { email: record.email, phone: record.address.phone };
    const notified = await sendNotification({ template: "order_confirmed", data: { name: record.address.name.split(" ")[0], orderId: record.id, total: summary.total, link }, ...contact });
    if (!cod) await sendNotification({ template: "payment_received", data: { orderId: record.id, total: summary.total }, ...contact, channels: ["email"] });
    for (const s of shipping.shipments.filter((x) => x.awb)) {
      await sendNotification({ template: "shipment_created", data: { orderId: record.id, courier: s.courier, awb: s.awb, link }, ...contact, channels: ["sms", "whatsapp"] });
    }

    return {
      order: { id: record.id, total: summary.total, status: record.status },
      shipments: shipping.shipments,
      notifications: notified.results,
      persisted: dbConfigured(),
    };
  },
  { limit: 30, key: "orders-confirm" }
);

const list = handler(["GET"], async (req) => {
  const claims = requireAuth(req, ["customer"]);
  const ids = await db.lrange(`orders:${claims.sub}`, 0, 49);
  const orders = (await Promise.all(ids.map((id) => db.get(`order:${id}`)))).filter(Boolean);
  return { orders };
});

export default router({ confirm, list });
