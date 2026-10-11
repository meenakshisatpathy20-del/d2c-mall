/*
 * POST /api/shiprocket/webhook — Shiprocket status push.
 * Configure in Shiprocket → Settings → API → Webhooks with header
 * `x-api-key: <SHIPROCKET_WEBHOOK_TOKEN>`.
 * Saves each courier scan on the order (idempotent on awb + status + time)
 * and messages the customer at out-for-delivery, delivered, failed delivery and RTO.
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, requireEnv } from "../../_lib/http.js";
import { mapStatus } from "../../_lib/shiprocket.js";
import { db, dbConfigured } from "../../_lib/db.js";
import { sendNotification } from "../../_lib/notify.js";

const MESSAGES = {
  out_for_delivery: "is out for delivery today",
  delivered: "has been delivered",
  delivery_failed: "could not be delivered. Choose a new delivery date or update your address",
  rto: "is being returned to our warehouse",
};

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("SHIPROCKET_WEBHOOK_TOKEN");
    const given = Buffer.from(String(req.headers["x-api-key"] || ""));
    const expected = Buffer.from(process.env.SHIPROCKET_WEBHOOK_TOKEN);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw new ApiError(401, "UNAUTHORIZED", "Invalid webhook token");

    const e = await readJson(req);
    const awb = String(e.awb || "");
    const status = mapStatus(e.current_status || e.shipment_status);
    const at = e.current_timestamp || new Date().toISOString();
    if (!awb || !dbConfigured()) return { received: true, awb, status, stored: false };

    const ref = await db.get(`awb:${awb}`);
    const order = ref ? await db.get(`order:${ref.orderId}`) : null;
    if (!order) return { received: true, awb, status, stored: false };

    const events = order.scans?.[awb] || [];
    if (events.some((x) => x.status === status && x.at === at)) return { received: true, duplicate: true };
    order.scans = { ...(order.scans || {}), [awb]: [...events, { status, at, location: e.current_location || null, note: e.current_status || null }] };
    await db.set(`order:${order.id}`, order);

    if (MESSAGES[status]) {
      const link = `${process.env.PUBLIC_URL || ""}/track?awb=${awb}`;
      await sendNotification({
        template: "shipment_update",
        data: { orderId: order.id, text: `Your order ${order.id} ${MESSAGES[status]}.`, link },
        email: order.email,
        phone: order.address?.phone,
        channels: ["sms", "whatsapp"],
      }).catch(() => null);
    }
    return { received: true, awb, status, stored: true };
  },
  { limit: 600, key: "sr-webhook" }
);
