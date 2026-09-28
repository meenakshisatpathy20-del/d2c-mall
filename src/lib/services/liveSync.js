/*
 * Polling sync (roadmap: start with polling, move to webhooks/SSE later).
 * Runs every few seconds:
 *  - releases expired stock reservations (abandoned checkouts)
 *  - turns new shipment events into customer notifications
 *  - settles completed returns (restock + refund bookkeeping)
 */
import { useEffect, useState } from "react";
import { getState, setState } from "../store";
import { productMap } from "../../data/catalog";
import { shipmentEvents } from "../orderModel";
import { notify } from "./account";
import { sweepExpiredReservations, restock } from "./inventory";
import { returnStatus } from "./orders";
import { formatINR } from "../format";

const NOTIFY = {
  picked_up: (o) => ({ title: "Your order has been shipped 🚚", body: `Order ${o.id} is on its way.` }),
  out_for_delivery: (o) => ({ title: "Out for delivery today", body: `Keep your phone handy — order ${o.id} arrives today.` }),
  delivered: (o) => ({ title: "Delivered ✅", body: `Order ${o.id} was delivered. Tell us what you think!` }),
  delivery_failed: (o) => ({ title: "Delivery attempt failed", body: `We couldn't deliver order ${o.id}. We'll try again.` }),
};

export function runSync() {
  sweepExpiredReservations();
  const s = getState();
  const now = Date.now();
  let changed = false;

  const orders = s.orders.map((o) => {
    if (!o.shipments?.length) return o;
    let touched = false;
    const shipments = o.shipments.map((sh) => {
      if (sh.notifiedAt === undefined) {
        touched = true;
        return { ...sh, notifiedAt: now };
      }
      const fresh = shipmentEvents(sh, now).filter((e) => e.at > sh.notifiedAt && e.at <= now);
      if (!fresh.length) return sh;
      fresh.forEach((e) => {
        const msg = NOTIFY[e.status]?.(o);
        if (msg) notify(o.userId, { type: "shipment", ...msg, link: `/orders/${o.id}`, channels: ["push", "sms", "whatsapp"] });
      });
      touched = true;
      return { ...sh, notifiedAt: now };
    });
    if (!touched) return o;
    changed = true;
    return { ...o, shipments };
  });

  let returns = s.returns;
  const settled = [];
  returns = returns.map((r) => {
    if (r.settled) return r;
    const st = returnStatus(r, now);
    if (st === "refunded" || st === "exchange_shipped") {
      settled.push(r);
      return { ...r, status: st, settled: true };
    }
    return r.status !== st ? { ...r, status: st } : r;
  });

  if (changed || settled.length || returns !== s.returns) {
    setState((st) => ({
      ...st,
      orders: (changed ? orders : st.orders).map((o) => {
        const done = settled.find((r) => r.orderId === o.id && r.type === "return");
        return done ? { ...o, returnState: "returned" } : o.returnState === "requested" && settled.find((r) => r.orderId === o.id) ? { ...o, returnState: null } : o;
      }),
      returns,
    }));
  }

  settled.forEach((r) => {
    const order = getState().orders.find((o) => o.id === r.orderId);
    if (!order) return;
    if (r.type === "return") {
      const allocs = (order.allocations || []).filter((a) => r.lineIds.includes(a.lineId));
      if (allocs.length) restock(allocs, "return", r.id);
      notify(r.userId, { type: "refund", title: "Refund completed 💸", body: `${formatINR(r.refundAmount)} refunded to your ${r.refundMethod === "credits" ? "D2C credits" : r.refundMethod === "bank" ? "bank account" : "original payment method"}.`, link: "/returns", channels: ["email", "sms"] });
    } else {
      const item = order.items.find((i) => r.lineIds.includes(i.lineId));
      notify(r.userId, { type: "return", title: "Replacement shipped", body: `Your exchange for ${productMap[item?.productId]?.name || "your item"} is on its way.`, link: "/returns" });
    }
  });
}

export function useLiveSync(intervalMs = 8000) {
  useEffect(() => {
    runSync();
    const t = setInterval(runSync, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
}

/** Re-render a component periodically so time-based statuses refresh. */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
