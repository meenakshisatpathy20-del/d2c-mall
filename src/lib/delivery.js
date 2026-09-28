/*
 * Serviceability, warehouse allocation and ETA engine.
 *
 * Allocation considers: destination pincode, available (unreserved) stock
 * per warehouse, distance, warehouse SLA/cut-off, courier coverage and
 * expected delivery time. It prefers the fewest shipments, then the fastest
 * delivery, then the shortest distance.
 */
import { couriers, distanceKm, lookupPincode, warehouses, zoneFlags } from "../data/logistics";

const DAY = 86400000;

export function transitDays(km, special) {
  let d;
  if (km < 60) d = 1;
  else if (km < 400) d = 2;
  else if (km < 1000) d = 3;
  else if (km < 1800) d = 4;
  else d = 5;
  return d + (special ? 2 : 0);
}

function pastCutoff(wh, now = new Date()) {
  const [time, meridian] = wh.cutoff.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (meridian === "PM" && h !== 12) h += 12;
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}

export function courierQuotes(km, weightKg, flags, codRequired) {
  const base = transitDays(km, flags.special);
  return couriers
    .filter((c) => !(codRequired && !c.cod))
    .filter((c) => !(flags.remote && c.express))
    .map((c) => {
      const days = Math.max(1, Math.round(base * c.speed));
      const rate = Math.round(c.baseRate + c.perKg * Math.max(weightKg, 0.5) + (km > 1000 ? 25 : 0));
      return { ...c, days, rate };
    })
    .sort((a, b) => a.days - b.days || a.rate - b.rate);
}

function available(inv, productId, whId) {
  const s = inv?.[productId]?.[whId];
  return s ? s.available - s.reserved : 0;
}

/**
 * @param {string} pincode
 * @param {{productId:string, qty:number, weightKg?:number}[]} items
 * @param {object} inventory  store.inventory
 */
export function planFulfilment(pincode, items, inventory) {
  const loc = lookupPincode(pincode);
  if (!loc) return { ok: false, reason: "Enter a valid 6-digit Indian pincode." };
  if (pincode.startsWith("99")) return { ok: false, reason: "We don't deliver to this pincode yet." };

  const flags = zoneFlags(pincode);
  const now = new Date();
  const ranked = warehouses
    .map((w) => {
      const km = distanceKm(loc, w);
      const cut = pastCutoff(w, now);
      const days = transitDays(km, flags.special) + (cut ? 1 : 0);
      return { warehouse: w, km, days, pastCutoff: cut };
    })
    .sort((a, b) => a.days - b.days || a.km - b.km);

  if (!items?.length) {
    const best = ranked[0];
    return finalize(loc, flags, [{ ...best, items: [] }], now);
  }

  // 1) single warehouse that can ship everything
  const single = ranked.find((r) =>
    items.every((i) => available(inventory, i.productId, r.warehouse.id) >= i.qty)
  );
  if (single) return finalize(loc, flags, [{ ...single, items }], now);

  // 2) split shipments — nearest warehouse with stock per item
  const groups = new Map();
  const unfulfilled = [];
  items.forEach((i) => {
    const r = ranked.find((x) => available(inventory, i.productId, x.warehouse.id) >= i.qty);
    if (!r) {
      unfulfilled.push(i);
      return;
    }
    if (!groups.has(r.warehouse.id)) groups.set(r.warehouse.id, { ...r, items: [] });
    groups.get(r.warehouse.id).items.push(i);
  });

  if (unfulfilled.length) {
    return {
      ok: false,
      location: loc,
      reason: "Some items are out of stock across all warehouses.",
      unfulfilled,
    };
  }
  return finalize(loc, flags, [...groups.values()], now);
}

function finalize(loc, flags, groups, now) {
  const shipments = groups.map((g) => {
    const weight = g.items.reduce((t, i) => t + (i.weightKg || 0.5) * i.qty, 0) || 0.5;
    const quotes = courierQuotes(g.km, weight, flags, false);
    const recommended = quotes.find((q) => q.id === "delhivery") || quotes[0];
    return {
      warehouseId: g.warehouse.id,
      warehouse: g.warehouse,
      km: g.km,
      days: g.days,
      pastCutoff: g.pastCutoff,
      items: g.items,
      weightKg: weight,
      couriers: quotes,
      courierId: recommended?.id,
    };
  });

  const maxDays = Math.max(...shipments.map((s) => s.days));
  const minDays = Math.max(1, maxDays - 1);
  const expressDays = Math.max(1, Math.ceil(maxDays * 0.55));
  const expressAvailable = !flags.remote && shipments.every((s) => s.km < 1500);
  const farthest = Math.max(...shipments.map((s) => s.km));

  let confidence = 98 - Math.round(farthest / 180) - (flags.special ? 9 : 0) - (shipments.length > 1 ? 4 : 0);
  confidence = Math.max(72, Math.min(99, confidence));

  return {
    ok: true,
    location: loc,
    shipments,
    split: shipments.length > 1,
    etaDays: maxDays,
    eta: now.getTime() + maxDays * DAY,
    etaRange: [now.getTime() + minDays * DAY, now.getTime() + maxDays * DAY],
    expressAvailable,
    expressEta: now.getTime() + expressDays * DAY,
    expressDays,
    codAvailable: !flags.codBlocked,
    confidence,
    confidenceLabel: confidence >= 92 ? "Very high" : confidence >= 84 ? "High" : "Moderate",
    remote: flags.remote,
  };
}

/** Quick single-product check used on the PDP & cards. */
export function checkProductDelivery(pincode, product, inventory) {
  return planFulfilment(pincode, [{ productId: product.id, qty: 1, weightKg: product.weightKg }], inventory);
}
