/*
 * POST /api/payments/create-order
 * Creates a Razorpay order. Amount is in paise. The key secret never leaves
 * the server. `receipt` doubles as an idempotency key on Razorpay's side.
 *
 * Production note: re-price the cart from the database here instead of
 * trusting the client amount (see README → "Hardening before launch").
 */
import { ApiError, handler, readJson, requireEnv, validate } from "../_lib/http.js";

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET");
    const body = await readJson(req);
    validate(body, { amount: ["int"], receipt: ["string"], currency: ["string", false] });
    if (body.amount < 100 || body.amount > 50_000_000) throw new ApiError(422, "INVALID_AMOUNT", "Amount must be between ₹1 and ₹5,00,000");
    if (!/^[A-Za-z0-9_-]{4,40}$/.test(body.receipt)) throw new ApiError(422, "INVALID_RECEIPT", "Invalid receipt/order id");

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: body.amount,
        currency: body.currency || "INR",
        receipt: body.receipt,
        payment_capture: 1,
        notes: typeof body.notes === "object" ? body.notes : {},
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(502, "GATEWAY_ERROR", data?.error?.description || "Razorpay order creation failed");
    return { id: data.id, amount: data.amount, currency: data.currency, receipt: data.receipt, status: data.status };
  },
  { limit: 20, key: "create-order" }
);
