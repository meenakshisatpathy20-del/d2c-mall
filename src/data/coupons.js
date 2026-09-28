/*
 * Coupon catalogue. Rules evaluated by src/lib/pricing.js:
 * minimum cart value, max discount cap, expiry, per-user usage limits,
 * global limits, category restrictions, first-order only and payment method.
 */

const DAY = 86400000;
const now = () => Date.now();

export const coupons = [
  {
    code: "WELCOME100",
    title: "Flat ₹100 off your first order",
    description: "New to D2C Mall? Enjoy ₹100 off on orders above ₹499.",
    type: "flat",
    value: 100,
    minCart: 499,
    firstOrderOnly: true,
    perUserLimit: 1,
    expiresAt: now() + 60 * DAY,
  },
  {
    code: "D2C20",
    title: "20% off up to ₹400",
    description: "20% off on orders above ₹1,499. Maximum discount ₹400.",
    type: "percent",
    value: 20,
    maxDiscount: 400,
    minCart: 1499,
    perUserLimit: 3,
    expiresAt: now() + 20 * DAY,
  },
  {
    code: "FESTIVE500",
    title: "Flat ₹500 off",
    description: "Festive special — ₹500 off on orders above ₹2,999.",
    type: "flat",
    value: 500,
    minCart: 2999,
    perUserLimit: 2,
    globalLimit: 5000,
    globalUsed: 4211,
    expiresAt: now() + 5 * DAY,
  },
  {
    code: "BEAUTY15",
    title: "15% off on Beauty",
    description: "15% off beauty products, up to ₹300. Min beauty value ₹699.",
    type: "percent",
    value: 15,
    maxDiscount: 300,
    minCart: 699,
    categories: ["beauty"],
    perUserLimit: 5,
    expiresAt: now() + 30 * DAY,
  },
  {
    code: "STREET10",
    title: "10% off — D2C Street exclusive",
    description: "Shopped a look from D2C Street? Take 10% off up to ₹250.",
    type: "percent",
    value: 10,
    maxDiscount: 250,
    minCart: 999,
    perUserLimit: 5,
    expiresAt: now() + 45 * DAY,
  },
  {
    code: "UPI50",
    title: "₹50 off on UPI",
    description: "Flat ₹50 off when you pay using any UPI app. Min order ₹499.",
    type: "flat",
    value: 50,
    minCart: 499,
    paymentMethods: ["upi"],
    perUserLimit: 3,
    expiresAt: now() + 30 * DAY,
  },
  {
    code: "FREESHIP",
    title: "Free delivery",
    description: "Free standard delivery on any order, no minimum.",
    type: "shipping",
    value: 0,
    minCart: 0,
    perUserLimit: 2,
    expiresAt: now() + 15 * DAY,
  },
  {
    code: "MONSOON30",
    title: "30% off — Monsoon sale",
    description: "This offer has ended.",
    type: "percent",
    value: 30,
    maxDiscount: 600,
    minCart: 999,
    expiresAt: now() - 3 * DAY,
  },
];

export const findCoupon = (code) =>
  coupons.find((c) => c.code === String(code || "").trim().toUpperCase());
