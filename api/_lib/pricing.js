/*
 * Server-side re-pricing. Never trust totals sent by the browser: prices,
 * coupons, shipping and COD fee are recomputed from the catalogue using the
 * same rules as the storefront.
 */
import { productMap } from "../../src/data/catalog.js";
import { computeSummary } from "../../src/lib/pricing.js";
import { ApiError } from "./http.js";

export function repriceItems(rawItems = []) {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new ApiError(422, "EMPTY_CART", "No items to price");
  if (rawItems.length > 50) throw new ApiError(422, "TOO_MANY_ITEMS", "Too many items");
  return rawItems.map((i) => {
    const p = productMap[i.productId];
    if (!p) throw new ApiError(422, "UNKNOWN_PRODUCT", `Unknown product ${i.productId}`);
    const qty = Number(i.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new ApiError(422, "INVALID_QTY", "Quantity must be 1–10");
    if (p.sizes.length && !p.sizes.includes(i.size)) throw new ApiError(422, "INVALID_SIZE", `Invalid size for ${p.name}`);
    return { productId: p.id, name: p.name, sku: p.sku, category: p.category, price: p.price, mrp: p.mrp, qty, size: i.size || null, color: i.color || null, weightKg: p.weightKg };
  });
}

export function serverSummary({ items, couponCode, paymentMethod, deliverySpeed, userOrders = 0, usage = {} }) {
  const priced = repriceItems(items);
  const summary = computeSummary({ items: priced, couponCode, paymentMethod, deliverySpeed, userOrders, usage });
  if (couponCode && !summary.couponCode) throw new ApiError(422, "COUPON_INVALID", summary.couponResult?.reason || "Coupon not applicable");
  return { items: priced, summary };
}
