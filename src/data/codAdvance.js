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
 * If the customer refuses the parcel at the door (or it goes back to origin
 * because they asked to cancel delivery / were unreachable), the advance is
 * forfeited to cover two-way shipping. If the order is cancelled before it is
 * dispatched, or returned after delivery, the advance is refunded.
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
  "The advance is non-refundable if you refuse the order at delivery or ask the courier to cancel it — it covers the two-way shipping cost. It is fully refunded if you cancel before the order is shipped or return it after delivery.";

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
