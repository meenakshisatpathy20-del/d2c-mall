/*
 * POST /api/payments/create-order
 * Body: { receipt, items:[{productId,qty,size,color}], couponCode?, paymentMethod?, deliverySpeed?, amount? }
 * The amount is recomputed on the server from the catalogue + coupon rules;
 * if the browser's amount differs, the request is rejected (price tampering).
 * The Razorpay key secret never leaves the server.
 */
import { ApiError, handler, readJson, requireEnv, validate } from "../../_lib/http.js";
import { serverSummary } from "../../_lib/pricing.js";

export default handler(
  ["POST"],
  async (req) => {
    requireEnv("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET");
    const body = await readJson(req);
    validate(body, { receipt: ["string"] });
    if (!/^[A-Za-z0-9_-]{4,40}$/.test(body.receipt)) throw new ApiError(422, "INVALID_RECEIPT", "Invalid receipt/order id");

    let amount = body.amount;
    if (Array.isArray(body.items)) {
      const { summary } = serverSummary({ items: body.items, couponCode: body.couponCode, paymentMethod: body.paymentMethod, deliverySpeed: body.deliverySpeed });
      amount = Math.round(summary.total * 100);
      if (body.amount && Math.abs(body.amount - amount) > 100) throw new ApiError(409, "PRICE_CHANGED", "Prices changed — please review your bag", { expected: amount / 100 });
    }
    if (!Number.isInteger(amount) || amount < 100 || amount > 50_000_000) throw new ApiError(422, "INVALID_AMOUNT", "Amount must be between ₹1 and ₹5,00,000");

    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount, currency: "INR", receipt: body.receipt, payment_capture: 1, notes: { orderId: body.receipt } }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(502, "GATEWAY_ERROR", data?.error?.description || "Razorpay order creation failed");
    return { id: data.id, amount: data.amount, currency: data.currency, receipt: data.receipt, status: data.status };
  },
  { limit: 20, key: "create-order" }
);
