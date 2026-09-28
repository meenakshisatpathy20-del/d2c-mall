/*
 * Shipments & logistics (Shiprocket): every AWB across orders with status,
 * courier, SLA, NDR (failed delivery) queue and operational actions.
 * React → Backend API → Shipment Service → Shiprocket Service → Shiprocket API
 */
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, PackageCheck, Search, Truck, Webhook } from "lucide-react";
import { useStore } from "../../lib/store";
import { couriers, getCourier, getWarehouse, warehouses } from "../../data/logistics";
import { SHIPMENT_LABEL, shipmentEta, shipmentEvents, shipmentStatus } from "../../lib/orderModel";
import { useNow } from "../../lib/services/liveSync";
import { cx, dayLabel, formatDateTime, formatTime } from "../../lib/format";
import { ShipmentEvents, ShipmentProgress } from "../order/OrderBits";
import { AdminHeader, HBars, Kpi, exportCsv } from "./AdminBits";
import { ShipmentOps } from "./AdminOrdersPage";
import "./AdminShipmentsPage.css";

const TABS = [
  ["all", "All"],
  ["to_ship", "To ship"],
  ["in_transit", "In transit"],
  ["ofd", "Out for delivery"],
  ["ndr", "NDR / failed"],
  ["delivered", "Delivered"],
];

function bucket(st) {
  if (["created", "pickup_scheduled"].includes(st)) return "to_ship";
  if (["picked_up", "in_transit", "reached_hub", "reassigned"].includes(st)) return "in_transit";
  if (st === "out_for_delivery") return "ofd";
  if (["delivery_failed", "reattempt"].includes(st)) return "ndr";
  if (st === "delivered") return "delivered";
  return "other";
}

export default function AdminShipmentsPage({ admin }) {
  const orders = useStore((s) => s.orders);
  const now = useNow(6000);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [courier, setCourier] = useState("all");
  const [open, setOpen] = useState(null);

  const rows = useMemo(
    () =>
      orders
        .flatMap((o) => o.shipments.filter((s) => !s.cancelled).map((s) => ({ o, s, st: shipmentStatus(s, now) })))
        .filter((r) => !admin.warehouseId || r.s.warehouseId === admin.warehouseId)
        .sort((a, b) => b.s.createdAt - a.s.createdAt),
    [orders, now, admin]
  );
  const counts = rows.reduce((m, r) => ({ ...m, [bucket(r.st)]: (m[bucket(r.st)] || 0) + 1 }), { all: rows.length });
  const list = rows.filter((r) => (tab === "all" || bucket(r.st) === tab) && (courier === "all" || r.s.courierId === courier) && (!q || `${r.s.awb} ${r.o.id} ${r.o.customer} ${r.o.address.pincode}`.toLowerCase().includes(q.toLowerCase())));
  const late = rows.filter((r) => r.st !== "delivered" && shipmentEta(r.s) < now).length;
  const courierRows = couriers.map((c) => ({ label: c.name, value: rows.filter((r) => r.s.courierId === c.id).length })).filter((r) => r.value);
  const sel = open ? rows.find((r) => r.s.id === open) : null;

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Logistics · Shiprocket"
        title="Shipments"
        sub={`Last sync ${formatTime(now)} · polling (webhook endpoint ready at /api/shiprocket/webhook)`}
        actions={
          <button className="btn btn-sm btn-outline" onClick={() => exportCsv("shipments.csv", list.map((r) => ({ shipment: r.s.id, awb: r.s.awb, order: r.o.id, warehouse: getWarehouse(r.s.warehouseId).short, courier: getCourier(r.s.courierId).name, status: r.st, eta: new Date(shipmentEta(r.s)).toISOString(), city: r.o.address.city, pincode: r.o.address.pincode })))}>
            <Download size={14} /> Export manifest
          </button>
        }
      />
      <div className="adm-kpis">
        <Kpi icon={PackageCheck} label="To ship" value={counts.to_ship || 0} tone="purple" delta="Awaiting pickup" />
        <Kpi icon={Truck} label="In transit" value={counts.in_transit || 0} tone="blue" />
        <Kpi icon={Clock} label="Out for delivery" value={counts.ofd || 0} tone="orange" />
        <Kpi icon={AlertTriangle} label="NDR (failed)" value={counts.ndr || 0} tone="red" delta="Needs action" />
        <Kpi icon={CheckCircle2} label="Delivered" value={counts.delivered || 0} tone="green" />
        <Kpi icon={Webhook} label="Past ETA" value={late} tone="amber" delta="SLA breaches" />
      </div>

      <div className="adm-grid-2">
        <div className="col gap-10">
          <div className="tabs" style={{ background: "#fff", borderRadius: 14, padding: "0 8px", border: "1px solid var(--line)" }}>
            {TABS.map(([id, l]) => (
              <button key={id} className={cx("tab", tab === id && "active")} onClick={() => setTab(id)}>
                {l} <span className="count">{counts[id] || 0}</span>
              </button>
            ))}
          </div>
          <div className="adm-toolbar">
            <div className="input-group" style={{ flex: 1 }}>
              <span className="addon"><Search size={15} /></span>
              <input className="input" placeholder="AWB, order ID, customer or pincode" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="select" style={{ width: "auto" }} value={courier} onChange={(e) => setCourier(e.target.value)}>
              <option value="all">All couriers</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>AWB / Shipment</th>
                  <th>Route</th>
                  <th>Courier</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {list.map(({ o, s, st }) => {
                  const eta = shipmentEta(s);
                  return (
                    <tr key={s.id} className={cx("clickable", open === s.id && "selected")} onClick={() => setOpen(s.id)}>
                      <td>
                        <b className="small">{s.awb}</b>
                        <div className="xs muted">{s.id} · {o.id}</div>
                      </td>
                      <td className="xs">
                        <span className="row gap-4">
                          <i className="wh-dot" style={{ background: getWarehouse(s.warehouseId).color }} /> {getWarehouse(s.warehouseId).short} → {o.address.city}
                        </span>
                        <span className="muted">{o.address.pincode}</span>
                      </td>
                      <td className="xs">{getCourier(s.courierId).name}</td>
                      <td>
                        <span className={cx("badge", bucket(st) === "ndr" ? "badge-soft-red" : st === "delivered" ? "badge-soft-green" : bucket(st) === "ofd" ? "badge-soft-orange" : "badge-soft-blue")}>{SHIPMENT_LABEL[st] || st}</span>
                        {s.frozen ? <span className="badge badge-soft-gray" style={{ marginLeft: 4 }}>On hold</span> : null}
                      </td>
                      <td className={cx("xs", st !== "delivered" && eta < now && "text-red bold")}>{st === "delivered" ? "—" : dayLabel(eta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!list.length ? <p className="small muted center" style={{ padding: 24 }}>No shipments here.</p> : null}
          </div>
        </div>

        <div className="col gap-16">
          {sel ? (
            <div className="card card-pad sticky-card">
              <div className="row between">
                <b>AWB {sel.s.awb}</b>
                <span className="xs muted">{getCourier(sel.s.courierId).name}</span>
              </div>
              <p className="xs muted mt-4">
                {sel.o.customer} · {sel.o.address.line1}, {sel.o.address.city} {sel.o.address.pincode} · {sel.o.address.phone}
              </p>
              <ShipmentProgress shipment={sel.s} now={now} />
              <ShipmentOps order={sel.o} shipment={sel.s} admin={admin} />
              <div className="mt-16">
                <ShipmentEvents shipment={sel.s} now={now} city={sel.o.address.city} />
              </div>
              <p className="xs muted mt-12">Created {formatDateTime(sel.s.createdAt)} · attempts {sel.s.attempts || 1} · events {shipmentEvents(sel.s, now).length}</p>
            </div>
          ) : (
            <div className="card card-pad">
              <b>Select a shipment</b>
              <p className="small muted mt-4">Click a row to view the Shiprocket event log and take actions: advance status, mark failed delivery (NDR), hold, or reassign courier.</p>
            </div>
          )}
          <div className="card card-pad">
            <b>Shipments by courier</b>
            <div className="mt-16">
              <HBars rows={courierRows} />
            </div>
          </div>
          <div className="card card-pad">
            <b>Hub dispatch</b>
            <div className="mt-16">
              <HBars rows={warehouses.filter((w) => !admin.warehouseId || w.id === admin.warehouseId).map((w) => ({ label: w.short, color: w.color, value: rows.filter((r) => r.s.warehouseId === w.id && bucket(r.st) === "to_ship").length }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
