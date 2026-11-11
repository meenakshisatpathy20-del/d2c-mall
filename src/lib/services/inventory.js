/*
 * Inventory service — reserve / release / commit / transfer.
 * Reservations hold stock for 15 minutes while payment is in progress and
 * are released automatically on failure, cancellation or expiry.
 *
 * Stock buckets per SKU per warehouse (OMS style):
 *   available  good stock physically in the warehouse (includes reserved)
 *   reserved   held for orders in checkout
 *   sellable   available − reserved (what the storefront can sell)
 *   damaged    QC hold — not sellable until QC passes or it is written off
 *   inTransit  coming in from another warehouse (stock transfer not yet received)
 *   on hand    available + damaged
 */
import { getState, setState } from "../store";
import { uid } from "../format";

export const RESERVATION_TTL = 15 * 60 * 1000;

export const EMPTY_BUCKETS = { available: 0, reserved: 0, sold: 0, damaged: 0, inTransit: 0, sellable: 0, onHand: 0 };

/** All buckets for one stock row (rows saved before damaged / inTransit existed default to 0). */
export function buckets(r = {}) {
  const available = r.available || 0;
  const reserved = r.reserved || 0;
  const damaged = r.damaged || 0;
  return { available, reserved, sold: r.sold || 0, damaged, inTransit: r.inTransit || 0, sellable: Math.max(available - reserved, 0), onHand: available + damaged, threshold: r.threshold ?? 5 };
}

export function stockOf(productId, inv = getState().inventory) {
  const rows = inv[productId] || {};
  return Object.values(rows).reduce((t, r) => {
    const b = buckets(r);
    return Object.fromEntries(Object.keys(EMPTY_BUCKETS).map((k) => [k, t[k] + b[k]]));
  }, { ...EMPTY_BUCKETS });
}

function move(state, entries) {
  const inventory = { ...state.inventory };
  const movements = [];
  entries.forEach(({ productId, warehouseId, delta, type, ref, by = "system", qty }) => {
    const row = { ...(inventory[productId]?.[warehouseId] || { available: 0, reserved: 0, sold: 0, damaged: 0, inTransit: 0, threshold: 5 }) };
    Object.entries(delta).forEach(([k, v]) => {
      row[k] = Math.max((row[k] || 0) + v, 0);
    });
    inventory[productId] = { ...inventory[productId], [warehouseId]: row };
    movements.push({ id: uid("mv"), at: Date.now(), productId, warehouseId, type, qty, ref, by });
  });
  return { ...state, inventory, stockMovements: [...movements, ...state.stockMovements].slice(0, 800) };
}

/**
 * Reserve stock for every allocated line. Fails atomically if any line
 * no longer has enough sellable stock at its allocated warehouse.
 */
export function reserveStock(orderId, allocations) {
  const s = getState();
  for (const a of allocations) {
    const row = s.inventory[a.productId]?.[a.warehouseId];
    if (!row || row.available - row.reserved < a.qty) {
      return { ok: false, reason: "stock", productId: a.productId };
    }
  }
  const reservation = {
    id: uid("rsv"),
    orderId,
    items: allocations,
    createdAt: Date.now(),
    expiresAt: Date.now() + RESERVATION_TTL,
    status: "active",
  };
  setState((st) => {
    const next = move(st, allocations.map((a) => ({ ...a, delta: { reserved: a.qty }, type: "reserve", ref: orderId })));
    return { ...next, reservations: [reservation, ...st.reservations] };
  });
  return { ok: true, reservation };
}

export function releaseReservation(orderId, reason = "release") {
  const r = getState().reservations.find((x) => x.orderId === orderId && x.status === "active");
  if (!r) return;
  setState((st) => {
    const next = move(st, r.items.map((a) => ({ ...a, delta: { reserved: -a.qty }, type: reason, ref: orderId })));
    return { ...next, reservations: st.reservations.map((x) => (x.id === r.id ? { ...x, status: "released", releasedAt: Date.now() } : x)) };
  });
}

/** Payment verified → reserved stock becomes sold. */
export function commitReservation(orderId) {
  const r = getState().reservations.find((x) => x.orderId === orderId && x.status === "active");
  if (!r) return;
  setState((st) => {
    const next = move(st, r.items.map((a) => ({ ...a, delta: { reserved: -a.qty, available: -a.qty, sold: a.qty }, type: "sale", ref: orderId })));
    return { ...next, reservations: st.reservations.map((x) => (x.id === r.id ? { ...x, status: "committed" } : x)) };
  });
}

/** Put stock back after cancellation / return QC. */
export function restock(items, type = "restock", ref, by) {
  setState((st) => move(st, items.map((a) => ({ ...a, delta: { available: a.qty, sold: -a.qty }, type, ref, by }))));
}

export const ADJUST_REASONS = [
  { id: "grn", label: "Inward / GRN (new stock received)", sign: 1, type: "inward" },
  { id: "count_up", label: "Cycle count — found extra", sign: 1, type: "count" },
  { id: "count_down", label: "Cycle count — found less", sign: -1, type: "count" },
  { id: "lost", label: "Lost / shrinkage", sign: -1, type: "adjust" },
];

/** Stock-in / stock-out with a reason (OMS "inventory adjustment"). */
export function adjustStock(productId, warehouseId, qty, by, note = "Manual adjustment", reasonId) {
  const reason = ADJUST_REASONS.find((r) => r.id === reasonId);
  const signed = reason ? Math.abs(qty) * reason.sign : qty;
  if (signed < 0) {
    const b = buckets(getState().inventory[productId]?.[warehouseId]);
    if (b.sellable < -signed) return { ok: false, reason: `Only ${b.sellable} sellable units can be removed (the rest are reserved for orders).` };
  }
  const type = reason ? reason.type : signed >= 0 ? "restock" : "adjust";
  setState((st) => move(st, [{ productId, warehouseId, qty: signed, delta: { available: signed }, type, ref: reason ? reason.label.split(" (")[0] + (note && note !== "Manual adjustment" ? ` · ${note}` : "") : note, by }]));
  return { ok: true };
}

/** Move sellable units to QC hold (damaged / under inspection). */
export function markDamaged(productId, warehouseId, qty, by, note = "QC hold") {
  const b = buckets(getState().inventory[productId]?.[warehouseId]);
  if (qty < 1) return { ok: false, reason: "Enter a quantity." };
  if (b.sellable < qty) return { ok: false, reason: `Only ${b.sellable} sellable units can be moved to QC hold.` };
  setState((st) => move(st, [{ productId, warehouseId, qty, delta: { available: -qty, damaged: qty }, type: "qc-hold", ref: note, by }]));
  return { ok: true };
}

/** Resolve QC hold: "pass" puts units back in sellable stock, "write_off" removes them. */
export function resolveDamaged(productId, warehouseId, qty, outcome, by) {
  const b = buckets(getState().inventory[productId]?.[warehouseId]);
  if (qty < 1 || qty > b.damaged) return { ok: false, reason: `Only ${b.damaged} units are on QC hold.` };
  const delta = outcome === "pass" ? { damaged: -qty, available: qty } : { damaged: -qty };
  setState((st) => move(st, [{ productId, warehouseId, qty, delta, type: outcome === "pass" ? "qc-pass" : "write-off", ref: outcome === "pass" ? "QC passed → sellable" : "Written off", by }]));
  return { ok: true };
}

export function setThreshold(productId, warehouseId, threshold) {
  setState((st) => ({
    ...st,
    inventory: {
      ...st.inventory,
      [productId]: { ...st.inventory[productId], [warehouseId]: { ...st.inventory[productId][warehouseId], threshold } },
    },
  }));
}

/**
 * Stock transfer order (STO): stock leaves the source now and shows as
 * "in transit" at the destination until that warehouse receives it.
 */
export function transferStock(productId, from, to, qty, by) {
  const row = getState().inventory[productId]?.[from];
  if (!qty || qty < 1) return { ok: false, reason: "Enter a quantity." };
  if (!row || row.available - row.reserved < qty) return { ok: false, reason: "Not enough unreserved stock at source warehouse." };
  const ref = `STO-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const transfer = { id: ref, productId, from, to, qty, status: "in_transit", createdAt: Date.now(), createdBy: by };
  setState((st) => {
    const next = move(st, [
      { productId, warehouseId: from, qty, delta: { available: -qty }, type: "transfer-out", ref, by },
      { productId, warehouseId: to, qty, delta: { inTransit: qty }, type: "transfer-dispatched", ref, by },
    ]);
    return { ...next, transfers: [transfer, ...(st.transfers || [])].slice(0, 300) };
  });
  return { ok: true, ref };
}

/** Destination warehouse confirms the transfer arrived → in transit becomes available. */
export function receiveTransfer(transferId, by) {
  const t = (getState().transfers || []).find((x) => x.id === transferId);
  if (!t || t.status !== "in_transit") return { ok: false, reason: "Transfer already received." };
  setState((st) => {
    const next = move(st, [{ productId: t.productId, warehouseId: t.to, qty: t.qty, delta: { inTransit: -t.qty, available: t.qty }, type: "transfer-in", ref: t.id, by }]);
    return { ...next, transfers: (st.transfers || []).map((x) => (x.id === t.id ? { ...x, status: "received", receivedAt: Date.now(), receivedBy: by } : x)) };
  });
  return { ok: true };
}

/** Release reservations whose payment window lapsed (abandoned checkouts). */
export function sweepExpiredReservations() {
  const expired = getState().reservations.filter((r) => r.status === "active" && r.expiresAt < Date.now());
  expired.forEach((r) => {
    releaseReservation(r.orderId, "expired");
    setState((st) => ({
      ...st,
      orders: st.orders.map((o) =>
        o.id === r.orderId && o.status === "pending_payment"
          ? { ...o, status: "payment_failed", timeline: [...o.timeline, { status: "expired", at: Date.now(), note: "Payment window expired — stock released" }] }
          : o
      ),
    }));
  });
  return expired.length;
}

/**
 * Move already-sold stock of some order lines to another warehouse
 * (used when staff change the pickup warehouse before shipping).
 */
export function reallocate(allocs, toWarehouseId, ref, by) {
  const short = allocs.find((a) => {
    const row = getState().inventory[a.productId]?.[toWarehouseId];
    return !row || row.available - row.reserved < a.qty;
  });
  if (short) return { ok: false, reason: "Not enough stock at the selected warehouse." };
  setState((st) =>
    move(st, allocs.flatMap((a) => [
      { productId: a.productId, warehouseId: a.warehouseId, qty: a.qty, delta: { available: a.qty, sold: -a.qty }, type: "reallocate-out", ref, by },
      { productId: a.productId, warehouseId: toWarehouseId, qty: a.qty, delta: { available: -a.qty, sold: a.qty }, type: "reallocate-in", ref, by },
    ]))
  );
  return { ok: true };
}
