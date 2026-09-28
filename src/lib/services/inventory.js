/*
 * Inventory service — reserve / release / commit / transfer.
 * Reservations hold stock for 15 minutes while payment is in progress and
 * are released automatically on failure, cancellation or expiry.
 */
import { getState, setState } from "../store";
import { uid } from "../format";

export const RESERVATION_TTL = 15 * 60 * 1000;

export function stockOf(productId, inv = getState().inventory) {
  const rows = inv[productId] || {};
  return Object.values(rows).reduce(
    (t, r) => ({
      available: t.available + r.available,
      reserved: t.reserved + r.reserved,
      sold: t.sold + r.sold,
      sellable: t.sellable + Math.max(r.available - r.reserved, 0),
    }),
    { available: 0, reserved: 0, sold: 0, sellable: 0 }
  );
}

function move(state, entries) {
  const inventory = { ...state.inventory };
  const movements = [];
  entries.forEach(({ productId, warehouseId, delta, type, ref, by = "system", qty }) => {
    const row = { ...(inventory[productId]?.[warehouseId] || { available: 0, reserved: 0, sold: 0, threshold: 5 }) };
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

export function adjustStock(productId, warehouseId, qty, by, note = "Manual adjustment") {
  setState((st) => move(st, [{ productId, warehouseId, qty, delta: { available: qty }, type: qty >= 0 ? "restock" : "adjust", ref: note, by }]));
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

export function transferStock(productId, from, to, qty, by) {
  const row = getState().inventory[productId]?.[from];
  if (!row || row.available - row.reserved < qty) return { ok: false, reason: "Not enough unreserved stock at source warehouse." };
  const ref = uid("TRF").toUpperCase();
  setState((st) =>
    move(st, [
      { productId, warehouseId: from, qty, delta: { available: -qty }, type: "transfer-out", ref, by },
      { productId, warehouseId: to, qty, delta: { available: qty }, type: "transfer-in", ref, by },
    ])
  );
  return { ok: true, ref };
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
