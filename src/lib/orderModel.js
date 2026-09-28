/*
 * Pure order / shipment model helpers (no store access).
 * Shipment lifecycle mirrors Shiprocket statuses.
 */
import { getCourier, getWarehouse } from "../data/logistics";
import { randomId } from "./crypto";

export const SHIPMENT_FLOW = [
  { key: "created", label: "Shipment created", short: "Packed" },
  { key: "pickup_scheduled", label: "Pickup scheduled with courier", short: "Pickup scheduled" },
  { key: "picked_up", label: "Picked up from warehouse", short: "Picked up" },
  { key: "in_transit", label: "In transit", short: "In transit" },
  { key: "reached_hub", label: "Reached destination hub", short: "At hub" },
  { key: "out_for_delivery", label: "Out for delivery", short: "Out for delivery" },
  { key: "delivered", label: "Delivered", short: "Delivered" },
];

export const SHIPMENT_LABEL = {
  created: "Packed",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  in_transit: "In transit",
  reached_hub: "At destination hub",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  delivery_failed: "Delivery attempt failed",
  reattempt: "Re-attempt scheduled",
  rto: "Returning to origin",
  cancelled: "Cancelled",
};

export const ORDER_STATUS = {
  pending_payment: { label: "Payment pending", tone: "amber" },
  payment_failed: { label: "Payment failed", tone: "red" },
  confirmed: { label: "Confirmed", tone: "blue" },
  processing: { label: "Processing", tone: "blue" },
  shipped: { label: "Shipped", tone: "purple" },
  out_for_delivery: { label: "Out for delivery", tone: "orange" },
  delivered: { label: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", tone: "gray" },
  return_requested: { label: "Return requested", tone: "amber" },
  returned: { label: "Returned", tone: "gray" },
};

export const TONE_CLASS = {
  amber: "badge-soft-amber",
  red: "badge-soft-red",
  blue: "badge-soft-blue",
  purple: "badge-soft-purple",
  orange: "badge-soft-orange",
  green: "badge-soft-green",
  gray: "badge-soft-gray",
};

export const newAwb = (courierId) => {
  const prefix = { bluedart: "BD", delhivery: "DL", xpressbees: "XB", ekart: "EK", shadowfax: "SF", dtdc: "DT" }[courierId] || "SR";
  return `${prefix}${Math.floor(1e10 + Math.random() * 9e10)}`;
};

export function trackingUrl(courierId, awb) {
  return `https://shiprocket.co/tracking/${awb}`;
}

/**
 * Build a shipment with a scheduled plan of events.
 * `stepMs` controls how quickly the demo logistics clock advances.
 */
export function buildShipment({
  id,
  warehouseId,
  courierId,
  lineIds,
  createdAt,
  destCity,
  stepMs,
  etaDays = 3,
  failAtAttempt = false,
  stopAt = null,
}) {
  const wh = getWarehouse(warehouseId);
  const courier = getCourier(courierId);
  const plan = [];
  const locs = {
    created: wh?.short,
    pickup_scheduled: wh?.short,
    picked_up: wh?.short,
    in_transit: `${courier?.name || "Courier"} network`,
    reached_hub: `${destCity} hub`,
    out_for_delivery: destCity,
    delivered: destCity,
  };
  let t = createdAt;
  SHIPMENT_FLOW.forEach((s, i) => {
    if (stopAt && SHIPMENT_FLOW.findIndex((x) => x.key === stopAt) < i) return;
    if (s.key === "delivered" && failAtAttempt) {
      plan.push({ status: "delivery_failed", at: t + stepMs * 0.5, location: destCity, note: "Customer not reachable — courier will re-attempt" });
      plan.push({ status: "reattempt", at: t + stepMs, location: destCity, note: "Re-attempt scheduled for next working day" });
      plan.push({ status: "out_for_delivery", at: t + stepMs * 2, location: destCity, note: "Out for delivery (attempt 2)" });
      t += stepMs * 2.5;
    }
    plan.push({ status: s.key, at: i === 0 ? createdAt : t, location: locs[s.key], note: s.label });
    t += stepMs * (s.key === "in_transit" ? 2 : 1);
  });
  return {
    id: id || `SHP${randomId(8).toUpperCase()}`,
    warehouseId,
    courierId,
    awb: newAwb(courierId),
    lineIds,
    createdAt,
    etaAt: createdAt + etaDays * 86400000,
    plan,
    manualEvents: [],
    attempts: failAtAttempt ? 2 : 1,
    provider: "shiprocket",
  };
}

/** Events visible "now" = plan events that have happened + manual admin events. */
export function shipmentEvents(shipment, now = Date.now()) {
  if (!shipment) return [];
  const planned = shipment.frozen ? shipment.plan.filter((e) => e.at <= shipment.frozen) : shipment.plan.filter((e) => e.at <= now);
  return [...planned, ...(shipment.manualEvents || [])].sort((a, b) => a.at - b.at);
}

export function shipmentStatus(shipment, now = Date.now()) {
  if (shipment?.cancelled) return "cancelled";
  const ev = shipmentEvents(shipment, now).filter((e) => e.status !== "reassigned");
  return ev.length ? ev[ev.length - 1].status : "created";
}

export function nextShipmentEvent(shipment, now = Date.now()) {
  if (!shipment || shipment.cancelled || shipment.frozen) return null;
  return shipment.plan.find((e) => e.at > now) || null;
}

export function flowIndex(status) {
  const map = { delivery_failed: 5, reattempt: 5 };
  if (status in map) return map[status];
  return Math.max(0, SHIPMENT_FLOW.findIndex((s) => s.key === status));
}

/** Derive the overall order status from payment + shipments. */
export function deriveOrderStatus(order, now = Date.now()) {
  if (order.status === "cancelled" || order.status === "payment_failed" || order.status === "pending_payment") return order.status;
  if (order.returnState === "returned") return "returned";
  if (order.returnState === "requested") return "return_requested";
  if (!order.shipments?.length) return order.status || "confirmed";
  const statuses = order.shipments.filter((s) => !s.cancelled).map((s) => shipmentStatus(s, now));
  if (!statuses.length) return "cancelled";
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "out_for_delivery" || s === "delivery_failed" || s === "reattempt")) return "out_for_delivery";
  if (statuses.some((s) => ["picked_up", "in_transit", "reached_hub", "delivered"].includes(s))) return "shipped";
  if (statuses.some((s) => s === "pickup_scheduled")) return "processing";
  return "confirmed";
}

/** Current ETA: the later of the promised date and the planned delivery event (after re-attempts). */
export function shipmentEta(shipment) {
  const planned = shipment?.plan?.filter((e) => e.status === "delivered").slice(-1)[0]?.at || 0;
  return Math.max(shipment?.etaAt || 0, planned);
}

export function orderEta(order) {
  const etas = (order.shipments || []).filter((s) => !s.cancelled).map(shipmentEta);
  return etas.length ? Math.max(...etas) : order.etaAt;
}

export function deliveredAt(order, now = Date.now()) {
  const times = (order.shipments || []).map((s) => shipmentEvents(s, now).find((e) => e.status === "delivered")?.at).filter(Boolean);
  return times.length === order.shipments?.length ? Math.max(...times) : null;
}

export function orderTab(status) {
  if (["confirmed", "processing", "pending_payment"].includes(status)) return "processing";
  if (status === "shipped") return "shipped";
  if (status === "out_for_delivery") return "out_for_delivery";
  if (status === "delivered") return "delivered";
  if (["cancelled", "payment_failed"].includes(status)) return "cancelled";
  if (["returned", "return_requested"].includes(status)) return "returned";
  return "processing";
}

export const newOrderId = () => {
  const d = new Date();
  return `OD${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}${Math.floor(10000 + Math.random() * 89999)}`;
};

export const newInvoiceNo = (orderId) => `INV/${new Date().getFullYear()}/${orderId.slice(-7)}`;
