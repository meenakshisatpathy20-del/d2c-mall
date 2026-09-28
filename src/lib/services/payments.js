/*
 * Payment gateway abstraction.
 *
 * LIVE mode  (VITE_RAZORPAY_KEY_ID set): Razorpay Checkout.js + backend
 *            /api/payments/create-order and /api/payments/verify, where the
 *            HMAC-SHA256 signature is verified with the secret on the server.
 * SANDBOX    (no key): an in-app Razorpay-style test gateway. Signatures are
 *            generated & verified with the same algorithm using a test secret
 *            so the full flow — success, failure, retry, abandon — can be demoed.
 */
import { hmacSha256, randomId } from "../crypto";

const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API = import.meta.env.VITE_API_BASE || "/api";
const SANDBOX_SECRET = "d2c_sandbox_secret_do_not_use_in_prod";

export const paymentMode = () => (KEY_ID ? "live" : "sandbox");

export const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm, BHIM & more", offer: "₹50 off with UPI50" },
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay, Amex", offer: "10% off on HDFC cards" },
  { id: "netbanking", label: "Net Banking", sub: "All major Indian banks" },
  { id: "wallet", label: "Wallets & Pay Later", sub: "Paytm, Amazon Pay, Simpl, LazyPay" },
  { id: "cod", label: "Cash on Delivery", sub: "Pay in cash or UPI at your doorstep" },
];

/* ---------- gateway order ---------- */

export async function createGatewayOrder({ orderId, amount, customer }) {
  if (KEY_ID) {
    const res = await fetch(`${API}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt: orderId, amount: Math.round(amount * 100), currency: "INR", notes: { orderId, customer } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || "Could not start payment");
    return data;
  }
  await new Promise((r) => setTimeout(r, 450));
  return { id: `order_${randomId(14)}`, amount: Math.round(amount * 100), currency: "INR", sandbox: true };
}

/* ---------- checkout.js loader ---------- */

let rzpPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!rzpPromise) {
    rzpPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => {
        rzpPromise = null;
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return rzpPromise;
}

/* ---------- sandbox gateway bridge (rendered by <SandboxGateway/>) ---------- */

let sandboxListener = null;
export function onSandboxRequest(fn) {
  sandboxListener = fn;
  return () => {
    if (sandboxListener === fn) sandboxListener = null;
  };
}

export function sandboxSign(orderId, paymentId) {
  return hmacSha256(SANDBOX_SECRET, `${orderId}|${paymentId}`);
}

/**
 * Open the gateway. Resolves with
 *  { status: "success", razorpay_order_id, razorpay_payment_id, razorpay_signature, instrument }
 *  { status: "failed", error }  |  { status: "dismissed" }
 */
export async function openCheckout({ gatewayOrder, amount, method, user, address, orderId }) {
  if (KEY_ID && !gatewayOrder.sandbox) {
    const ok = await loadRazorpay();
    if (!ok) return { status: "failed", error: "Could not load Razorpay. Check your connection." };
    return new Promise((resolve) => {
      const rzp = new window.Razorpay({
        key: KEY_ID,
        amount: gatewayOrder.amount,
        currency: "INR",
        order_id: gatewayOrder.id,
        name: "D2C Mall",
        description: `Order ${orderId}`,
        image: "/favicon.svg",
        prefill: { name: user?.name, email: user?.email, contact: address?.phone || user?.phone, method: method === "wallet" ? "wallet" : method },
        notes: { orderId },
        theme: { color: "#2457ff" },
        retry: { enabled: false },
        handler: (resp) => resolve({ status: "success", ...resp, instrument: method }),
        modal: { ondismiss: () => resolve({ status: "dismissed" }), confirm_close: true },
      });
      rzp.on("payment.failed", (resp) => resolve({ status: "failed", error: resp?.error?.description || "Payment failed" }));
      rzp.open();
    });
  }

  if (!sandboxListener) return { status: "failed", error: "Payment gateway unavailable" };
  return new Promise((resolve) => {
    sandboxListener({
      orderId,
      gatewayOrderId: gatewayOrder.id,
      amount,
      method,
      user,
      resolve: (result) => {
        if (result.status !== "success") return resolve(result);
        const paymentId = `pay_${randomId(14)}`;
        resolve({
          status: "success",
          razorpay_order_id: gatewayOrder.id,
          razorpay_payment_id: paymentId,
          razorpay_signature: sandboxSign(gatewayOrder.id, paymentId),
          instrument: result.instrument,
        });
      },
    });
  });
}

/* ---------- signature verification (server-side in LIVE mode) ---------- */

export async function verifyPayment(payload) {
  if (KEY_ID && !payload.sandbox) {
    const res = await fetch(`${API}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { verified: !!data.verified, error: data?.error?.message };
  }
  await new Promise((r) => setTimeout(r, 500));
  const expected = sandboxSign(payload.razorpay_order_id, payload.razorpay_payment_id);
  return { verified: expected === payload.razorpay_signature };
}
