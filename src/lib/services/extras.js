/*
 * Flipkart-style extras: compare, back-in-stock & price-drop alerts,
 * gift cards, D2C Coins loyalty, refer & earn, PAN/GST details, product Q&A.
 */
import { getState, setState, useStore } from "../store";
import { productMap } from "../../data/catalog";
import { deriveOrderStatus } from "../orderModel";
import { toast } from "../toast";
import { formatINR, uid } from "../format";
import { notify, updateUser } from "./account";

/* ---------- compare (max 4, same category like Flipkart) ---------- */

export const useCompare = () => useStore((s) => s.compare) || [];

export function toggleCompare(product) {
  const list = getState().compare || [];
  if (list.includes(product.id)) {
    setState((st) => ({ ...st, compare: (st.compare || []).filter((x) => x !== product.id) }));
    return;
  }
  const first = productMap[list[0]];
  if (first && first.category !== product.category) {
    toast.error(`You can only compare ${first.category} products together`);
    return;
  }
  if (list.length >= 4) {
    toast.error("You can compare up to 4 products");
    return;
  }
  setState((st) => ({ ...st, compare: [...(st.compare || []), product.id] }));
  toast("Added to compare", { type: "info" });
}

export const clearCompare = () => setState((st) => ({ ...st, compare: [] }));

/* ---------- alerts ---------- */

export const useAlerts = () => useStore((s) => s.alerts) || { stock: {}, price: {} };

export function toggleStockAlert(productId, size) {
  const key = `${productId}__${size || "-"}`;
  const on = !(getState().alerts?.stock || {})[key];
  setState((st) => {
    const stock = { ...(st.alerts?.stock || {}) };
    if (on) stock[key] = Date.now();
    else delete stock[key];
    return { ...st, alerts: { ...(st.alerts || {}), stock } };
  });
  toast(on ? "We'll notify you when it's back in stock" : "Back-in-stock alert removed", { type: on ? "success" : "info" });
}

export function togglePriceAlert(product) {
  const on = !(getState().alerts?.price || {})[product.id];
  setState((st) => {
    const price = { ...(st.alerts?.price || {}) };
    if (on) price[product.id] = { at: Date.now(), price: product.price };
    else delete price[product.id];
    return { ...st, alerts: { ...(st.alerts || {}), price } };
  });
  toast(on ? `Price alert set — we'll tell you if it drops below ${formatINR(product.price)}` : "Price alert removed", { type: on ? "success" : "info" });
}

/* ---------- gift cards ---------- */

const GIFT_CARDS = {
  "D2C-GIFT-0500-2026": 500,
  "D2C-GIFT-1000-2026": 1000,
  "D2C-GIFT-2500-2026": 2500,
};

export function redeemGiftCard(userId, code, pin) {
  const c = String(code || "").trim().toUpperCase();
  const amount = GIFT_CARDS[c];
  if (!amount || String(pin) !== "2026") return { ok: false, error: "Invalid gift card number or PIN" };
  const used = getState().giftCardsRedeemed || {};
  if (used[c]) return { ok: false, error: "This gift card has already been redeemed" };
  setState((st) => ({ ...st, giftCardsRedeemed: { ...(st.giftCardsRedeemed || {}), [c]: { userId, at: Date.now() } } }));
  updateUser(userId, (u) => ({
    credits: (u.credits || 0) + amount,
    walletLedger: [{ id: uid("wl"), at: Date.now(), type: "credit", amount, note: `Gift card ${c.slice(-9)} redeemed` }, ...(u.walletLedger || [])],
  }));
  notify(userId, { type: "account", title: "Gift card added 🎁", body: `${formatINR(amount)} added to your D2C credits.`, link: "/account/giftcards" });
  return { ok: true, amount };
}

/* ---------- D2C Coins (loyalty) ---------- */

/** 2% of every delivered order (rounded down) + signup bonus − coins spent. */
export function coinsSummary(user, orders, now = Date.now()) {
  const earned = orders
    .filter((o) => o.userId === user.id && deriveOrderStatus(o, now) === "delivered")
    .map((o) => ({ id: `earn-${o.id}`, at: o.createdAt, amount: Math.floor(o.pricing.total * 0.02), note: `Earned on order ${o.id}`, type: "earn" }));
  const pending = orders
    .filter((o) => o.userId === user.id && ["confirmed", "processing", "shipped", "out_for_delivery"].includes(deriveOrderStatus(o, now)))
    .reduce((t, o) => t + Math.floor(o.pricing.total * 0.02), 0);
  const bonus = [{ id: "bonus", at: user.createdAt, amount: 50, note: "Welcome bonus", type: "earn" }];
  const spent = (user.coinsSpent || []).map((x) => ({ ...x, type: "spend", amount: -x.amount }));
  const ledger = [...earned, ...bonus, ...spent].sort((a, b) => b.at - a.at);
  const balance = Math.max(0, ledger.reduce((t, x) => t + x.amount, 0));
  return { balance, pending, ledger };
}

/* ---------- refer & earn ---------- */

export function referralCode(user) {
  const base = (user.name || "D2C").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "D2C";
  let h = 0;
  for (const ch of user.id) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return `${base}${1000 + h}`;
}

/* ---------- PAN / GST ---------- */

export const isPan = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(v).toUpperCase());
export const isGstin = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(v).toUpperCase());

/* ---------- product Q&A ---------- */

const SEED_QA = [
  ["Is this true to size?", "Yes, most customers find it true to size. If you're between sizes, pick the larger one.", 42],
  ["Is Cash on Delivery available?", "Yes, COD is available on most pincodes for orders up to ₹20,000.", 31],
  ["What is the return policy?", "Easy returns within the return window shown on this page, with free doorstep pickup.", 27],
];

export function productQuestions(productId, stored = {}) {
  const p = productMap[productId];
  const seed = SEED_QA.filter((_, i) => p?.sizes.length || i > 0).map(([q, a, up], i) => ({
    id: `${productId}-q${i}`,
    q,
    a,
    by: "D2C Mall",
    answeredBy: i === 0 ? `${p?.brand || "Brand"} (seller)` : "D2C Mall support",
    up,
    at: Date.now() - (i + 3) * 86400000 * 4,
  }));
  return [...(stored[productId] || []), ...seed];
}

export function askQuestion(productId, user, q) {
  const item = { id: uid("q"), q: q.trim(), a: null, by: user?.name || "Customer", up: 0, at: Date.now() };
  setState((st) => ({ ...st, questions: { ...(st.questions || {}), [productId]: [item, ...((st.questions || {})[productId] || [])] } }));
  // Simulated seller response so the flow is visible in the demo
  setTimeout(() => {
    setState((st) => ({
      ...st,
      questions: {
        ...(st.questions || {}),
        [productId]: ((st.questions || {})[productId] || []).map((x) => (x.id === item.id ? { ...x, a: "Thanks for asking! Our brand team has noted this and will add full details shortly. Meanwhile, check the specifications above or chat with support.", answeredBy: "D2C Mall support" } : x)),
      },
    }));
    if (user) notify(user.id, { type: "support", title: "Your question was answered", body: q.slice(0, 80), link: `/product/${productId}#qa` });
  }, 6000);
}

export function upvoteQuestion(productId, qid) {
  setState((st) => ({
    ...st,
    questions: { ...(st.questions || {}), [productId]: ((st.questions || {})[productId] || []).map((x) => (x.id === qid ? { ...x, up: x.up + 1 } : x)) },
  }));
}
