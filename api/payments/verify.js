/*
 * POST /api/payments/verify
 * Verifies the Razorpay Checkout signature:
 *   expected = HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * using a timing-safe comparison. Only after this succeeds should the order
 * be confirmed and stock committed.
 */
import crypto from "node:crypto";
import { handler, readJson, requireEnv, validate } from "../_lib/http.js";

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("RAZORPAY_KEY_SECRET");
    const body = await readJson(req);
    validate(body, { razorpay_order_id: ["string"], razorpay_payment_id: ["string"], razorpay_signature: ["string"] });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(body.razorpay_signature), "utf8");
    const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

    return { verified, paymentId: verified ? body.razorpay_payment_id : null };
  },
  { limit: 30, key: "verify" }
);
