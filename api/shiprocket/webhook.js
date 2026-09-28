/*
 * POST /api/shiprocket/webhook — Shiprocket status push.
 * Configure in Shiprocket → Settings → API → Webhooks with header
 * `x-api-key: <SHIPROCKET_WEBHOOK_TOKEN>`.
 * Maps courier status → shipment status, triggers customer notifications
 * (out for delivery, delivered, NDR) and failed-delivery handling.
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, requireEnv } from "../_lib/http.js";
import { mapStatus } from "../_lib/shiprocket.js";

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("SHIPROCKET_WEBHOOK_TOKEN");
    const given = Buffer.from(String(req.headers["x-api-key"] || ""));
    const expected = Buffer.from(process.env.SHIPROCKET_WEBHOOK_TOKEN);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw new ApiError(401, "UNAUTHORIZED", "Invalid webhook token");

    const e = await readJson(req);
    const status = mapStatus(e.current_status || e.shipment_status);
    // TODO(db): upsert shipment event (idempotent on awb + status + timestamp)
    // TODO(notify): send push/SMS/WhatsApp for out_for_delivery, delivered, delivery_failed
    console.log("[shiprocket] webhook", e.awb, e.order_id, status, e.current_timestamp);
    return { received: true, awb: e.awb, status };
  },
  { limit: 600, key: "sr-webhook" }
);
