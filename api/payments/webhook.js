/*
 * POST /api/payments/webhook — Razorpay webhook receiver.
 * Verifies X-Razorpay-Signature over the RAW body with RAZORPAY_WEBHOOK_SECRET.
 * Handles payment.captured / payment.failed / refund.processed so orders stay
 * correct even if the customer closes the browser mid-payment.
 */
import crypto from "node:crypto";
import { ApiError, handler, readRaw, requireEnv } from "../_lib/http.js";

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("RAZORPAY_WEBHOOK_SECRET");
    const raw = await readRaw(req);
    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new ApiError(401, "INVALID_SIGNATURE", "Webhook signature mismatch");
    }
    const event = JSON.parse(raw);
    const payment = event?.payload?.payment?.entity;

    switch (event.event) {
      case "payment.captured":
        // TODO(db): mark order paid (idempotent on payment.id), commit reserved stock, create shipment
        console.log("[razorpay] captured", payment?.id, payment?.order_id, payment?.amount);
        break;
      case "payment.failed":
        // TODO(db): mark attempt failed, release reservation
        console.log("[razorpay] failed", payment?.id, payment?.error_description);
        break;
      case "refund.processed":
        console.log("[razorpay] refund", event?.payload?.refund?.entity?.id);
        break;
      default:
        console.log("[razorpay] ignored event", event.event);
    }
    return { received: true };
  },
  { limit: 300, key: "rzp-webhook" }
);
