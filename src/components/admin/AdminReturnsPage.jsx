import { useMemo, useState } from "react";
import { CheckCircle2, Download, FastForward, RotateCcw, Search, XCircle } from "lucide-react";
import { setState, useStore } from "../../lib/store";
import { RETURN_LABEL, returnStatus } from "../../lib/services/orders";
import { notify } from "../../lib/services/account";
import { useNow } from "../../lib/services/liveSync";
import { cx, formatDateTime, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Img } from "../common/ui";
import { AdminHeader, Kpi, exportCsv } from "./AdminBits";
import "./AdminReturnsPage.css";

function advance(ret) {
  const now = Date.now();
  setState((st) => ({
    ...st,
    returns: st.returns.map((r) => {
      if (r.id !== ret.id || !r.plan) return r;
      const idx = r.plan.findIndex((e) => e.at > now);
      if (idx < 0) return r;
      const shift = r.plan[idx].at - now;
      return { ...r, plan: r.plan.map((e, i) => (i >= idx ? { ...e, at: e.at - shift } : e)) };
    }),
  }));
}

function reject(ret, by) {
  setState((st) => ({
    ...st,
    returns: st.returns.map((r) => (r.id === ret.id ? { ...r, status: "rejected", plan: r.plan?.filter((e) => e.at <= Date.now()), timeline: [...r.timeline, { status: "rejected", at: Date.now(), note: `Rejected by ${by}: item failed quality check` }] } : r)),
    orders: st.orders.map((o) => (o.id === ret.orderId ? { ...o, returnState: null } : o)),
  }));
  notify(ret.userId, { type: "return", title: "Return request declined", body: "The item did not pass quality check. Contact support if you think this is a mistake.", link: "/returns" });
}

export default function AdminReturnsPage({ admin }) {
  const returns = useStore((s) => s.returns);
  const orders = useStore((s) => s.orders);
  const users = useStore((s) => s.users);
  const now = useNow(6000);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("open");

  const rows = useMemo(
    () =>
      returns
        .map((r) => ({ r, st: returnStatus(r, now), order: orders.find((o) => o.id === r.orderId), user: users.find((u) => u.id === r.userId) }))
        .filter(({ r, st, user }) => {
          if (filter === "open" && ["refunded", "cancelled", "rejected", "exchange_shipped"].includes(st)) return false;
          if (filter === "closed" && !["refunded", "cancelled", "rejected", "exchange_shipped"].includes(st)) return false;
          return !q || `${r.id} ${r.orderId} ${user?.name}`.toLowerCase().includes(q.toLowerCase());
        }),
    [returns, orders, users, now, q, filter]
  );

  const refundDue = returns.filter((r) => ["qc_passed", "refund_initiated"].includes(returnStatus(r, now))).reduce((t, r) => t + r.refundAmount, 0);
  const canAct = ["super_admin", "support", "logistics"].includes(admin.role);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Reverse logistics"
        title="Returns & refunds"
        actions={
          <button className="btn btn-sm btn-outline" onClick={() => exportCsv("returns.csv", rows.map(({ r, st, user }) => ({ id: r.id, order: r.orderId, customer: user?.name, type: r.type, reason: r.reason, status: st, refund: r.refundAmount, method: r.refundMethod })))}>
            <Download size={14} /> Export
          </button>
        }
      />
      <div className="adm-kpis">
        <Kpi icon={RotateCcw} label="Open returns" value={returns.filter((r) => !["refunded", "cancelled", "rejected", "exchange_shipped"].includes(returnStatus(r, now))).length} tone="orange" />
        <Kpi icon={RotateCcw} label="Awaiting pickup" value={returns.filter((r) => ["requested", "approved", "pickup_scheduled"].includes(returnStatus(r, now))).length} tone="purple" />
        <Kpi icon={CheckCircle2} label="In QC / refund" value={returns.filter((r) => ["picked_up", "qc_passed", "refund_initiated"].includes(returnStatus(r, now))).length} tone="blue" />
        <Kpi icon={CheckCircle2} label="Refund due" value={formatINR(refundDue)} tone="red" />
        <Kpi icon={CheckCircle2} label="Refunded" value={returns.filter((r) => returnStatus(r, now) === "refunded").length} tone="green" />
        <Kpi icon={RotateCcw} label="Exchanges" value={returns.filter((r) => r.type === "exchange").length} tone="amber" />
      </div>
      <div className="adm-toolbar">
        <div className="seg">
          {["open", "closed", "all"].map((f) => (
            <button key={f} className={cx(filter === f && "active")} onClick={() => setFilter(f)} style={{ textTransform: "capitalize" }}>{f}</button>
          ))}
        </div>
        <div className="input-group" style={{ flex: 1 }}>
          <span className="addon"><Search size={15} /></span>
          <input className="input" placeholder="Return ID, order ID or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="col gap-10">
        {rows.map(({ r, st, order, user }) => {
          const items = order?.items.filter((i) => r.lineIds.includes(i.lineId)) || [];
          return (
            <div key={r.id} className="adm-ret">
              <div className="row gap-10" style={{ minWidth: 0 }}>
                {items[0] ? <Img src={items[0].image} alt="" label="" style={{ width: 48, height: 56, borderRadius: 10 }} /> : null}
                <div style={{ minWidth: 0 }}>
                  <b className="small">{r.id} · {r.type === "exchange" ? "Exchange" : "Return"}</b>
                  <div className="xs muted">{user?.name} · order {r.orderId} · {formatDateTime(r.createdAt)}</div>
                  <div className="xs">{items.map((i) => i.name).join(", ")} — <i>{r.reason}</i></div>
                </div>
              </div>
              <div className="xs">
                <div>Pickup: <b>{r.pickupSlot}</b></div>
                <div>{r.type === "exchange" ? "Exchange" : `Refund ${formatINR(r.refundAmount)} → ${r.refundMethod}`}</div>
              </div>
              <span className={cx("badge", st === "refunded" || st === "exchange_shipped" ? "badge-soft-green" : st === "rejected" || st === "cancelled" ? "badge-soft-gray" : "badge-soft-amber")}>{RETURN_LABEL[st]}</span>
              {canAct && !["refunded", "cancelled", "rejected", "exchange_shipped"].includes(st) ? (
                <div className="row gap-6">
                  <button className="btn btn-xs btn-soft" onClick={() => { advance(r); toast("Return moved to next stage"); }}>
                    <FastForward size={12} /> Advance
                  </button>
                  {["picked_up", "qc_passed"].includes(st) ? (
                    <button className="btn btn-xs btn-outline text-red" onClick={() => { reject(r, admin.name); toast("Return rejected"); }}>
                      <XCircle size={12} /> Fail QC
                    </button>
                  ) : null}
                </div>
              ) : <span />}
            </div>
          );
        })}
        {!rows.length ? <p className="small muted center" style={{ padding: 24 }}>No returns in this view.</p> : null}
      </div>
    </div>
  );
}
