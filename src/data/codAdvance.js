/*
 * Partial Advance for Cash on Delivery orders.
 *
 * The customer pays a small advance online at checkout and the balance in
 * cash / UPI at the doorstep:
 *
 *   Order value  < ₹1,000  →  ₹49 advance
 *   Order value ≥ ₹1,000  →  ₹99 advance
 *
 *   e.g. order ₹1,299 → advance ₹99 now → ₹1,200 collected on delivery
 *
 * The advance is adjusted against the order total (it is not an extra fee),
 * and the usual COD handling fee is waived when an advance is paid.
 *
 * The advance is refunded only if the order is cancelled before it is
 * dispatched. It is forfeited if the customer refuses the parcel at the door,
 * the parcel goes back to origin for any reason, or the order is returned
 * after delivery — it covers the shipping cost.
 *
 * This file is shared by the storefront and the serverless API so both
 * compute exactly the same amounts.
 */

export const COD_ADVANCE_POLICY = {
  /** Order value at which the higher advance applies. */
  threshold: 1000,
  /** Advance for orders below the threshold. */
  below: 49,
  /** Advance for orders at or above the threshold. */
  above: 99,
  /** Waive the regular COD handling fee when an advance is paid. */
  waiveCodFee: true,
};

/** "off" — plain COD only · "optional" — customer chooses · "required" — every COD order needs an advance. */
export const COD_ADVANCE_MODES = ["off", "optional", "required"];
export const DEFAULT_COD_ADVANCE_MODE = "required";

/**
 * Advance due for an order value (₹). Returns 0 when the order is too small
 * for a split to make sense (the whole amount would be the advance).
 */
export function codAdvanceFor(orderValue, policy = COD_ADVANCE_POLICY) {
  const v = Math.max(0, Math.round(Number(orderValue) || 0));
  const advance = v >= policy.threshold ? policy.above : policy.below;
  return v > advance ? advance : 0;
}

/** One-line policy text shown at checkout, on the order and in the FAQ. */
export const COD_ADVANCE_FORFEIT_TEXT =
  "The advance is refunded only if you cancel before your order is shipped. It is non-refundable if you refuse the order at delivery, the order is returned to us, or you return it after delivery — it covers the shipping cost.";

export const codAdvanceTierText = (policy = COD_ADVANCE_POLICY) =>
  `₹${policy.below} advance on orders below ₹${policy.threshold.toLocaleString("en-IN")}, ₹${policy.above} on ₹${policy.threshold.toLocaleString("en-IN")} and above`;

/* ---------- order helpers (work on any stored order) ---------- */

/** True when the order is COD with an advance attached. */
export const hasCodAdvance = (order) => order?.payment?.method === "cod" && (order?.pricing?.codAdvance || 0) > 0;

/** Amount the courier must collect at the door for the whole order. */
export function codDue(order) {
  if (order?.payment?.method !== "cod") return 0;
  const p = order.pricing || {};
  return typeof p.codBalance === "number" ? p.codBalance : p.total || 0;
}

/** Amount to charge online now (advance for partial COD, full total for prepaid, 0 for plain COD). */
export function amountDueNow(order) {
  const p = order?.pricing || {};
  if (typeof p.payNow === "number") return p.payNow;
  return order?.payment?.method === "cod" ? 0 : p.total || 0;
}

/** Human status of the advance: pending → paid → refunded | forfeited | adjusted (delivered). */
export const ADVANCE_STATUS_LABEL = {
  pending: "Awaiting payment",
  paid: "Paid",
  adjusted: "Adjusted in order total",
  refunded: "Refunded",
  forfeited: "Forfeited",
};

/**
 * What the customer sees about the advance on an order, given its derived
 * status (from orderModel.deriveOrderStatus). Delivered → the advance was
 * adjusted against the total and the balance collected.
 */
export function advanceView(order, orderStatus) {
  if (!hasCodAdvance(order)) return null;
  const adv = order.payment.advance || { amount: order.pricing.codAdvance, balance: order.pricing.codBalance, status: "pending" };
  let status = adv.status || "pending";
  if (status === "paid" && orderStatus === "delivered") status = "adjusted";
  if (status === "paid" && (orderStatus === "rto" || orderStatus === "returned" || orderStatus === "return_requested")) status = "forfeited";
  const balanceStatus = ["delivered", "returned", "return_requested"].includes(orderStatus) ? "collected" : orderStatus === "cancelled" || orderStatus === "rto" ? "not_due" : "due";
  return { ...adv, status, label: ADVANCE_STATUS_LABEL[status] || status, balanceStatus };
}

/**
 * Advance still to be kept back from a return refund. The advance is not
 * refunded on returns, and it is deducted only once per order even if items
 * are returned in several requests.
 */
export function advanceReturnDeduction(order, returns = []) {
  if (!hasCodAdvance(order) || order.payment.advance?.status !== "paid") return 0;
  const already = returns.filter((r) => r.orderId === order.id && r.status !== "cancelled").reduce((t, r) => t + (r.advanceDeducted || 0), 0);
  return Math.max(0, order.payment.advance.amount - already);
}
