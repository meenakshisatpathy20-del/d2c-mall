/*
 * Shipping engine (pure helpers, no store access).
 *
 * Mirrors how Shiprocket works: an order arrives as NEW, staff (or an auto-ship
 * rule) pick a courier → AWB assigned, pickup is scheduled, and from then on
 * every status comes from courier scans — staff never mark "delivered" by hand.
 *
 * Rates below are demo rate cards. In live mode the courier list, rates and
 * delivery days come from Shiprocket's serviceability API instead.
 */
import { couriers, distanceKm, getCourier, getWarehouse, lookupPincode, zoneFlags } from "../data/logistics";
import { transitDays } from "./delivery";

/* ---------- statuses ---------- */

export const SR_STATUS = {
  new: { label: "New", tone: "blue", hint: "Order received — choose courier & ship" },
  awb_assigned: { label: "Ready to ship", tone: "purple", hint: "AWB assigned — label printed, awaiting pickup schedule" },
  pickup_scheduled: { label: "Pickup scheduled", tone: "purple", hint: "Courier will collect from the warehouse" },
  picked_up: { label: "Picked up", tone: "blue" },
  in_transit: { label: "In transit", tone: "blue" },
  reached_hub: { label: "At destination hub", tone: "blue" },
  out_for_delivery: { label: "Out for delivery", tone: "orange" },
  delivered: { label: "Delivered", tone: "green" },
  delivery_failed: { label: "NDR · action needed", tone: "red" },
  reattempt: { label: "Re-attempt scheduled", tone: "amber" },
  rto_initiated: { label: "RTO initiated", tone: "red" },
  rto_in_transit: { label: "RTO in transit", tone: "red" },
  rto_delivered: { label: "RTO delivered", tone: "gray" },
  rto_received: { label: "RTO received · restocked", tone: "gray" },
  cancelled: { label: "Cancelled", tone: "gray" },
  created: { label: "Packed", tone: "blue" },
  reassigned: { label: "Courier reassigned", tone: "blue" },
};

/** Console tabs, in Shiprocket order. */
export const SR_TABS = [
  ["new", "New"],
  ["ready", "Ready to ship"],
  ["pickup", "Pickup scheduled"],
  ["in_transit", "In transit"],
  ["delivered", "Delivered"],
  ["ndr", "NDR"],
  ["rto", "RTO"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

export function srTab(status) {
  if (status === "new") return "new";
  if (status === "awb_assigned") return "ready";
  if (status === "pickup_scheduled" || status === "created") return "pickup";
  if (["picked_up", "in_transit", "reached_hub", "out_for_delivery", "reassigned", "reattempt"].includes(status)) return "in_transit";
  if (status === "delivered") return "delivered";
  if (status === "delivery_failed") return "ndr";
  if (status.startsWith("rto")) return "rto";
  if (status === "cancelled") return "cancelled";
  return "in_transit";
}

export const NDR_REASONS = [
  "Customer not available at address",
  "Customer phone not reachable",
  "Address incomplete / not found",
  "Customer asked to deliver later",
  "Customer refused delivery",
  "COD amount not ready",
];

/* ---------- package & weight ---------- */

export const BOXES = [
  { id: "S", name: "Small box", l: 20, b: 15, h: 8 },
  { id: "M", name: "Medium box", l: 30, b: 25, h: 10 },
  { id: "L", name: "Large box", l: 40, b: 30, h: 15 },
  { id: "P", name: "Courier bag", l: 35, b: 28, h: 3 },
];

/** Volumetric weight in kg: L × B × H (cm) ÷ 5000. */
export const volumetricWeight = (pkg) => Math.round(((pkg.l || 0) * (pkg.b || 0) * (pkg.h || 0)) / 5000 * 100) / 100;

/** Couriers bill on the higher of dead weight and volumetric weight, in 0.5 kg slabs. */
export function chargeableWeight(pkg) {
  const w = Math.max(pkg.weightKg || 0.5, volumetricWeight(pkg));
  return Math.ceil(w * 2) / 2;
}

export function defaultPackage(items) {
  const weightKg = Math.max(0.3, Math.round(items.reduce((t, i) => t + (i.weightKg || 0.4) * (i.qty || 1), 0) * 100) / 100);
  const box = weightKg <= 0.6 ? BOXES[3] : weightKg <= 1.5 ? BOXES[1] : BOXES[2];
  return { weightKg, boxId: box.id, l: box.l, b: box.b, h: box.h };
}

/* ---------- zones & rate cards ---------- */

const METROS = ["110", "400", "560", "600", "700", "500", "411", "380", "122", "201"];

/** Approximate Shiprocket-style zones: A local · B regional · C metro-metro · D rest of India · E special. */
export function zoneFor(fromPin, toPin, km) {
  const flags = zoneFlags(toPin);
  if (flags.special || flags.remote) return { id: "E", label: "Zone E · special (J&K, North-East, islands)" };
  if (km < 60) return { id: "A", label: "Zone A · within city" };
  if (km < 500) return { id: "B", label: "Zone B · within region" };
  if (METROS.includes(fromPin.slice(0, 3)) && METROS.includes(toPin.slice(0, 3))) return { id: "C", label: "Zone C · metro to metro" };
  return { id: "D", label: "Zone D · rest of India" };
}

const ZONE_MULT = { A: 0.75, B: 0.9, C: 1, D: 1.15, E: 1.45 };

/**
 * Courier quotes for a shipment (demo rate cards).
 * @returns sorted list with freight, COD charge, total, delivery days and tags.
 */
export function quoteCouriers({ fromPin, toPin, pkg, cod = false, value = 0 }) {
  const from = lookupPincode(fromPin);
  const to = lookupPincode(toPin);
  if (!from || !to) return { ok: false, reason: "Enter valid 6-digit pickup and delivery pincodes." };
  const flags = zoneFlags(toPin);
  if (cod && flags.codBlocked) return { ok: false, reason: "COD is not available for this pincode." };
  const km = distanceKm(from, to);
  const zone = zoneFor(fromPin, toPin, km);
  const weight = chargeableWeight(pkg);
  const slabs = Math.max(1, weight / 0.5);
  const base = transitDays(km, flags.special);
  const list = couriers
    .filter((c) => !(cod && !c.cod))
    .filter((c) => !(flags.remote && c.express))
    .map((c) => {
      const freight = Math.round((c.baseRate + c.perKg * 0.5 * (slabs - 1)) * ZONE_MULT[zone.id]);
      const codCharge = cod ? Math.max(c.codMin || 35, Math.round(value * 0.018)) : 0;
      const days = Math.max(1, Math.round(base * c.speed));
      return { courierId: c.id, name: c.name, rating: c.rating, express: c.express, codSupported: c.cod, freight, codCharge, total: freight + codCharge, days, pickupBy: "Tomorrow" };
    });
  if (!list.length) return { ok: false, reason: "No courier serves this route for the selected payment mode." };
  const cheapest = Math.min(...list.map((q) => q.total));
  const fastest = Math.min(...list.map((q) => q.days));
  const bestRated = Math.max(...list.map((q) => q.rating));
  // Recommendation score (like Shiprocket's "Recommended"): balance price, speed and rating.
  const scored = list.map((q) => ({ ...q, score: (cheapest / q.total) * 40 + (fastest / q.days) * 35 + (q.rating / bestRated) * 25 }));
  const best = Math.max(...scored.map((q) => q.score));
  const tagged = scored.map((q) => ({
    ...q,
    tags: [q.score === best && "Recommended", q.total === cheapest && "Cheapest", q.days === fastest && "Fastest", q.rating === bestRated && "Best rated"].filter(Boolean),
  }));
  return { ok: true, km, zone, weight, volumetric: volumetricWeight(pkg), list: tagged.sort((a, b) => b.score - a.score) };
}

export function pickByRule(list, rule = "recommended") {
  if (!list?.length) return null;
  if (rule === "cheapest") return [...list].sort((a, b) => a.total - b.total || a.days - b.days)[0];
  if (rule === "fastest") return [...list].sort((a, b) => a.days - b.days || a.total - b.total)[0];
  if (rule === "best_rated") return [...list].sort((a, b) => b.rating - a.rating || a.total - b.total)[0];
  return [...list].sort((a, b) => b.score - a.score)[0];
}

/** Quote for an existing shipment of an order. */
export function quoteForShipment(order, shipment) {
  const wh = getWarehouse(shipment.warehouseId);
  const value = order.items.filter((i) => shipment.lineIds.includes(i.lineId)).reduce((t, i) => t + i.price * i.qty, 0);
  return quoteCouriers({ fromPin: wh.pincode, toPin: order.address.pincode, pkg: shipment.package || defaultPackage([]), cod: order.payment.method === "cod", value });
}

export const shipmentValue = (order, shipment) => order.items.filter((i) => shipment.lineIds.includes(i.lineId)).reduce((t, i) => t + i.price * i.qty, 0);

/* ---------- AWB / ids ---------- */

export function newAwbFor(courierId) {
  const prefix = { bluedart: "BD", delhivery: "DL", xpressbees: "XB", ekart: "EK", shadowfax: "SF", dtdc: "DT" }[courierId] || "SR";
  return `${prefix}${Math.floor(1e10 + Math.random() * 9e10)}`;
}

export const courierName = (id, fallback) => getCourier(id)?.name || fallback || "Courier";

/* ---------- scan plans (demo courier network) ---------- */

/**
 * Events that follow a scheduled pickup. In live mode these arrive from
 * Shiprocket's webhook instead; in demo mode they are planned ahead and
 * revealed as time passes.
 */
export function pickupPlan({ start, stepMs, origin, destCity, courierLabel, outcome = "delivered", reason, firstGap }) {
  let t = start;
  const ev = (status, location, note, gap = 1) => {
    const e = { status, at: t, location, note };
    t += stepMs * gap;
    return e;
  };
  const plan = [
    ev("pickup_scheduled", origin, "Pickup scheduled with courier", firstGap ? firstGap / stepMs : 1),
    ev("picked_up", origin, `Picked up by ${courierLabel}`),
    ev("in_transit", `${courierLabel} network`, "In transit", 2),
    ev("reached_hub", `${destCity} hub`, "Reached destination hub"),
    ev("out_for_delivery", destCity, "Out for delivery"),
  ];
  if (outcome === "delivered") plan.push(ev("delivered", destCity, "Delivered"));
  else plan.push(ev("delivery_failed", destCity, reason || NDR_REASONS[0]));
  return plan;
}

export function reattemptPlan({ requestedAt, start, stepMs, destCity, attempt, outcome = "delivered", note }) {
  return [
    { status: "reattempt", at: requestedAt || start, location: destCity, note: note || "Re-attempt scheduled" },
    { status: "out_for_delivery", at: start + stepMs, location: destCity, note: `Out for delivery (attempt ${attempt})` },
    outcome === "delivered"
      ? { status: "delivered", at: start + stepMs * 2, location: destCity, note: "Delivered" }
      : { status: "delivery_failed", at: start + stepMs * 2, location: destCity, note: NDR_REASONS[0] },
  ];
}

export function rtoPlan({ start, stepMs, destCity, origin, note }) {
  return [
    { status: "rto_initiated", at: start, location: destCity, note: note || "Return to origin initiated" },
    { status: "rto_in_transit", at: start + stepMs, location: "In transit to seller", note: "RTO in transit" },
    { status: "rto_delivered", at: start + stepMs * 3, location: origin, note: "Delivered back to warehouse" },
  ];
}

/* ---------- COD remittance ---------- */

/**
 * COD collected by couriers is remitted to the seller in cycles.
 * Each delivered COD shipment becomes due `cycleDays` after delivery.
 */
export function remittanceRows(orders, now, cycleDays, shipmentEventsFn) {
  const rows = [];
  orders.forEach((o) => {
    if (o.payment.method !== "cod") return;
    o.shipments.forEach((s) => {
      if (s.cancelled) return;
      const del = shipmentEventsFn(s, now).find((e) => e.status === "delivered");
      if (!del) return;
      const amount = shipmentValue(o, s) + (o.shipments[0] === s ? (o.pricing.shipping || 0) + (o.pricing.codFee || 0) : 0);
      const dueAt = del.at + cycleDays * 86400000;
      const remitted = dueAt <= now;
      rows.push({
        orderId: o.id,
        shipmentId: s.id,
        awb: s.awb,
        courierId: s.courierId,
        customer: o.customer,
        deliveredAt: del.at,
        amount,
        dueAt,
        status: remitted ? "remitted" : "pending",
        utr: remitted ? `UTR${String(Math.abs(hash(s.id))).padStart(10, "0").slice(0, 12)}` : null,
      });
    });
  });
  return rows.sort((a, b) => b.deliveredAt - a.deliveredAt);
}

function hash(str) {
  let h = 7;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

/* ---------- Code 128 (B) barcode for labels ---------- */

const C128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

/** Returns bar/space widths for a scannable Code 128-B barcode. */
export function code128(text) {
  const codes = [104];
  for (const ch of String(text)) {
    const c = ch.charCodeAt(0) - 32;
    codes.push(c >= 0 && c < 95 ? c : 0);
  }
  const check = codes.reduce((t, c, i) => t + c * (i === 0 ? 1 : i), 0) % 103;
  codes.push(check, 106);
  return codes.map((c) => C128[c]).join("").split("").map(Number);
}

export { getWarehouse };
