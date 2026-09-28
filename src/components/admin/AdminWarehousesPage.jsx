import { useMemo } from "react";
import { AlertTriangle, Boxes, Clock, MapPin, Phone, Truck, User, Warehouse } from "lucide-react";
import { useStore } from "../../lib/store";
import { warehouses } from "../../data/logistics";
import { shipmentStatus } from "../../lib/orderModel";
import { formatNumber } from "../../lib/format";
import { GlobeScene } from "../common/ThreeSafe";
import { AdminHeader, HBars } from "./AdminBits";
import "./AdminWarehousesPage.css";

export default function AdminWarehousesPage({ admin }) {
  const inventory = useStore((s) => s.inventory);
  const orders = useStore((s) => s.orders);

  const stats = useMemo(
    () =>
      warehouses.map((w) => {
        let units = 0;
        let reserved = 0;
        let skus = 0;
        let low = 0;
        let sold = 0;
        Object.values(inventory).forEach((rows) => {
          const r = rows[w.id];
          if (!r) return;
          units += r.available;
          reserved += r.reserved;
          sold += r.sold;
          if (r.available > 0) skus += 1;
          if (r.available - r.reserved <= r.threshold) low += 1;
        });
        const ships = orders.flatMap((o) => o.shipments.filter((s) => s.warehouseId === w.id && !s.cancelled));
        const pending = ships.filter((s) => ["created", "pickup_scheduled"].includes(shipmentStatus(s))).length;
        const inTransit = ships.filter((s) => !["created", "pickup_scheduled", "delivered"].includes(shipmentStatus(s))).length;
        const delivered = ships.filter((s) => shipmentStatus(s) === "delivered").length;
        return { w, units, reserved, skus, low, sold, pending, inTransit, delivered, util: Math.min(96, Math.round(((units * 1.6 + sold * 0.4) / w.capacity) * 100) + 38) };
      }),
    [inventory, orders]
  );
  const visible = stats.filter((s) => !admin.warehouseId || s.w.id === admin.warehouseId);

  return (
    <div className="col gap-16">
      <AdminHeader eyebrow="Multi-warehouse network" title="Warehouses" sub="Allocation uses pincode distance, live stock, reservations, SLA and courier serviceability" />
      <div className="wh-hero">
        <div className="wh-hero-map">
          <GlobeScene intensity={stats.map((s) => s.pending / 5 + 0.3)} />
        </div>
        <div className="wh-hero-side">
          <b>Network load</b>
          <p className="xs muted mt-4">Shipments awaiting pickup per hub</p>
          <div className="mt-16">
            <HBars rows={stats.map((s) => ({ label: s.w.short, color: s.w.color, value: s.pending }))} />
          </div>
          <b className="mt-24" style={{ display: "block" }}>Capacity utilisation</b>
          <div className="mt-12">
            <HBars rows={stats.map((s) => ({ label: s.w.short, color: s.w.color, value: s.util }))} format={(v) => `${v}%`} />
          </div>
        </div>
      </div>
      <div className="wh-grid">
        {visible.map((s) => (
          <div key={s.w.id} className="wh-card" style={{ "--wc": s.w.color }}>
            <div className="row between">
              <span className="row gap-10">
                <span className="wh-icon"><Warehouse size={18} /></span>
                <span>
                  <b>{s.w.name}</b>
                  <span className="xs muted" style={{ display: "block" }}>{s.w.id} · {s.w.city} {s.w.pincode}</span>
                </span>
              </span>
              <span className="badge badge-soft-green">Operational</span>
            </div>
            <div className="wh-stats">
              <div><Boxes size={14} /><b>{formatNumber(s.units)}</b><span>units</span></div>
              <div><Boxes size={14} /><b>{s.skus}</b><span>live SKUs</span></div>
              <div><AlertTriangle size={14} /><b>{s.low}</b><span>low stock</span></div>
              <div><Truck size={14} /><b>{s.pending}</b><span>to dispatch</span></div>
              <div><Truck size={14} /><b>{s.inTransit}</b><span>in transit</span></div>
              <div><Truck size={14} /><b>{s.delivered}</b><span>delivered</span></div>
            </div>
            <div className="progress mt-12">
              <span style={{ width: `${s.util}%`, background: s.w.color }} />
            </div>
            <div className="row between xs muted mt-4">
              <span>Utilisation {s.util}%</span>
              <span>{formatNumber(s.w.capacity)} sq ft</span>
            </div>
            <div className="wh-meta">
              <span><Clock size={13} /> Dispatch SLA {s.w.slaHours}h · cut-off {s.w.cutoff}</span>
              <span><User size={13} /> {s.w.manager}</span>
              <span><Phone size={13} /> {s.w.phone}</span>
              <span><MapPin size={13} /> {s.w.lat.toFixed(2)}, {s.w.lng.toFixed(2)}</span>
              <span>Reserved now: <b>{s.reserved}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
