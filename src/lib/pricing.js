/*
 * Pricing & coupon engine. The backend runs the same rules again before
 * creating a payment order — the frontend result is only a preview.
 */
import { coupons, findCoupon } from "../data/coupons.js";
import { formatINR } from "./format.js";

export const FREE_SHIPPING_THRESHOLD = 499;
export const STANDARD_SHIPPING = 49;
export const EXPRESS_SHIPPING = 99;
export const COD_FEE = 29;
export const COD_LIMIT = 20000;
export const GIFT_WRAP_FEE = 25;
/** D2C Coins can cover at most this share of the item total (like Flipkart SuperCoins). */
export const COINS_MAX_SHARE = 0.3;

export function lineTotals(items) {
  const itemTotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const mrpTotal = items.reduce((t, i) => t + (i.mrp || i.price) * i.qty, 0);
  return { itemTotal, mrpTotal, productDiscount: Math.max(mrpTotal - itemTotal, 0) };
}

/**
 * Validate a coupon against the cart.
 * @returns {{ok:boolean, reason?:string, discount?:number, freeShipping?:boolean, coupon?:object}}
 */
export function evaluateCoupon(code, { items, userOrders = 0, usage = {}, paymentMethod } = {}) {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, reason: "This coupon code doesn't exist." };
  if (coupon.expiresAt < Date.now()) return { ok: false, reason: "This coupon has expired." };
  if (coupon.globalLimit && (coupon.globalUsed || 0) >= coupon.globalLimit)
    return { ok: false, reason: "This coupon has reached its usage limit." };
  if (coupon.perUserLimit && (usage[coupon.code] || 0) >= coupon.perUserLimit)
    return { ok: false, reason: `You've already used this coupon ${coupon.perUserLimit} time(s).` };
  if (coupon.firstOrderOnly && userOrders > 0)
    return { ok: false, reason: "Valid on your first order only." };
  if (coupon.paymentMethods && paymentMethod && !coupon.paymentMethods.includes(paymentMethod))
    return { ok: false, reason: `Valid only with ${coupon.paymentMethods.join(", ").toUpperCase()} payments.` };

  const eligible = coupon.categories ? items.filter((i) => coupon.categories.includes(i.category)) : items;
  const eligibleValue = eligible.reduce((t, i) => t + i.price * i.qty, 0);
  if (!eligible.length) return { ok: false, reason: "No items in your cart are eligible for this coupon." };
  if (eligibleValue < (coupon.minCart || 0))
    return {
      ok: false,
      reason: `Add ${formatINR(coupon.minCart - eligibleValue)} more${coupon.categories ? " of eligible items" : ""} to use this coupon.`,
      shortBy: coupon.minCart - eligibleValue,
    };

  if (coupon.type === "shipping") return { ok: true, coupon, discount: 0, freeShipping: true };

  let discount = coupon.type === "percent" ? (eligibleValue * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(Math.round(discount), eligibleValue);
  return { ok: true, coupon, discount };
}

export function listCouponsForCart(ctx) {
  return coupons
    .filter((c) => c.expiresAt > Date.now() - 7 * 86400000)
    .map((c) => ({ coupon: c, result: evaluateCoupon(c.code, ctx) }))
    .sort((a, b) => Number(b.result.ok) - Number(a.result.ok) || (b.result.discount || 0) - (a.result.discount || 0));
}

/**
 * Full order summary used by cart + checkout + order creation.
 */
export function computeSummary({
  items,
  couponCode,
  userOrders = 0,
  usage = {},
  paymentMethod,
  deliverySpeed = "standard",
  giftWrap = false,
  credits = 0,
  coins = 0,
}) {
  const { itemTotal, mrpTotal, productDiscount } = lineTotals(items);
  let couponDiscount = 0;
  let couponFreeShipping = false;
  let couponResult = null;

  if (couponCode && items.length) {
    couponResult = evaluateCoupon(couponCode, { items, userOrders, usage, paymentMethod });
    if (couponResult.ok) {
      couponDiscount = couponResult.discount || 0;
      couponFreeShipping = !!couponResult.freeShipping;
    }
  }

  const afterDiscount = itemTotal - couponDiscount;
  const freeShipping = couponFreeShipping || afterDiscount >= FREE_SHIPPING_THRESHOLD;
  let shipping = items.length ? (freeShipping ? 0 : STANDARD_SHIPPING) : 0;
  if (deliverySpeed === "express" && items.length) shipping += EXPRESS_SHIPPING;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const giftWrapFee = giftWrap && items.length ? GIFT_WRAP_FEE : 0;
  const payable = Math.max(afterDiscount + shipping + codFee + giftWrapFee, 0);
  const coinsUsed = Math.max(0, Math.min(Math.floor(coins) || 0, Math.floor(itemTotal * COINS_MAX_SHARE), payable));
  const creditsUsed = Math.max(0, Math.min(Math.floor(credits) || 0, payable - coinsUsed));
  const total = payable - coinsUsed - creditsUsed;
  const savings = productDiscount + couponDiscount + (freeShipping ? STANDARD_SHIPPING : 0) + coinsUsed;

  return {
    itemCount: items.reduce((t, i) => t + i.qty, 0),
    mrpTotal,
    itemTotal,
    productDiscount,
    couponCode: couponResult?.ok ? couponResult.coupon.code : null,
    couponDiscount,
    couponResult,
    shipping,
    freeShipping,
    amountForFreeShipping: freeShipping ? 0 : Math.max(FREE_SHIPPING_THRESHOLD - afterDiscount, 0),
    codFee,
    giftWrapFee,
    coinsUsed,
    creditsUsed,
    coinsEarn: Math.floor(total * 0.02),
    codAvailable: total <= COD_LIMIT,
    total,
    savings,
    gst: Math.round(total - total / 1.12),
  };
}
