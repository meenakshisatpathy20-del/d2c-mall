import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, CheckCircle2, CreditCard, IndianRupee, Package, RotateCcw, ShoppingCart, Store, Truck, XCircle } from "lucide-react";
import { useStore } from "../../lib/store";
import { productMap } from "../../data/catalog";
import { warehouses } from "../../data/logistics";
import { ORDER_STATUS, deriveOrderStatus, shipmentEvents } from "../../lib/orderModel";
import { paymentMode } from "../../lib/services/payments";
import { compact, formatDateTime, formatINR } from "../../lib/format";
import { StatusPill } from "../common/ui";
import { AdminHeader, BarChart, HBars, Kpi } from "./AdminBits";

const DAY = 86400000;

export function scopeOrders(orders, admin) {
  if (!admin?.warehouseId) return orders;
  return orders.filter((o) => o.shipments.some((s) => s.warehouseId === admin.warehouseId) || o.allocations?.some((a) => a.warehouseId === admin.warehouseId));
}

export default function AdminDashboard({ admin }) {
  const allOrders = useStore((s) => s.orders);
  const inventory = useStore((s) => s.inventory);
  const returns = useStore((s) => s.returns);
  const apps = useStore((s) => s.franchiseApps);
  const orders = useMemo(() => scopeOrders(allOrders, admin), [allOrders, admin]);
  const now = Date.now();

  const stats = useMemo(() => {
    const live = orders.map((o) => ({ ...o, live: deriveOrderStatus(o, now) }));
    const valid = live.filter((o) => !["cancelled", "payment_failed", "pending_payment"].includes(o.live));
    const today = valid.filter((o) => now - o.createdAt < DAY);
    const week = valid.filter((o) => now - o.createdAt < 7 * DAY);
    const gmvWeek = week.reduce((t, o) => t + o.pricing.total, 0);
    const byStatus = {};
    live.forEach((o) => (byStatus[o.live] = (byStatus[o.live] || 0) + 1));
    const series = Array.from({ length: 14 }, (_, i) => {
      const start = new Date(now - (13 - i) * DAY);
      start.setHours(0, 0, 0, 0);
      const end = start.getTime() + DAY;
      const count = valid.filter((o) => o.createdAt >= start.getTime() && o.createdAt < end).length;
      return { label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), short: start.toLocaleDateString("en-IN", { day: "numeric" }), value: count };
    });
    const ndr = live.flatMap((o) => o.shipments.filter((s) => ["delivery_failed", "reattempt"].includes(shipmentEvents(s, now).slice(-1)[0]?.status))).length;
    const pendingDispatch = live.filter((o) => ["confirmed", "processing"].includes(o.live)).length;
    return { live, valid, today, week, gmvWeek, aov: week.length ? gmvWeek / week.length : 0, byStatus, series, ndr, pendingDispatch, failedPayments: live.filter((o) => o.live === "payment_failed").length };
  }, [orders, now]);

  const lowStock = useMemo(() => {
    const rows = [];
    Object.entries(inventory).forEach(([pid, whs]) =>
      Object.entries(whs).forEach(([wid, r]) => {
        if (admin.warehouseId && wid !== admin.warehouseId) return;
        const sellable = r.available - r.reserved;
        if (sellable <= r.threshold && r.available > 0) rows.push({ pid, wid, sellable, threshold: r.threshold });
      })
    );
    return rows.sort((a, b) => a.sellable - b.sellable);
  }, [inventory, admin]);

  const whLoad = warehouses
    .filter((w) => !admin.warehouseId || w.id === admin.warehouseId)
    .map((w) => ({
      label: w.short,
      color: w.color,
      value: stats.live.reduce((t, o) => t + o.shipments.filter((s) => s.warehouseId === w.id && !["delivered", "cancelled"].includes(shipmentEvents(s, now).slice(-1)[0]?.status)).length, 0),
    }));

  const statusRows = Object.entries(stats.byStatus)
    .map(([k, v]) => ({ label: ORDER_STATUS[k]?.label || k, value: v }))
    .sort((a, b) => b.value - a.value);

  const topProducts = useMemo(() => {
    const m = {};
    stats.valid.forEach((o) => o.items.forEach((i) => (m[i.productId] = (m[i.productId] || 0) + i.qty)));
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, q]) => ({ p: productMap[pid], q }));
  }, [stats.valid]);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Operations overview"
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${admin.name.split(" ")[0]}`}
        sub={admin.warehouseId ? "Showing data for your warehouse only" : "Live view across all warehouses, orders and channels"}
        actions={
          <>
            <Link to="/admin/orders" className="btn btn-sm btn-blue">
              <Package size={14} /> Manage orders
            </Link>
            <Link to="/admin/inventory" className="btn btn-sm btn-outline">
              <Boxes size={14} /> Inventory
            </Link>
          </>
        }
      />

      <div className="adm-kpis">
        <Kpi icon={IndianRupee} label="GMV · last 7 days" value={formatINR(stats.gmvWeek)} delta={`${stats.week.length} orders`} tone="blue" />
        <Kpi icon={ShoppingCart} label="Orders today" value={stats.today.length} delta={`AOV ${formatINR(stats.aov)}`} tone="orange" />
        <Kpi icon={Package} label="Pending dispatch" value={stats.pendingDispatch} delta="Confirmed & processing" tone="purple" />
        <Kpi icon={AlertTriangle} label="Delivery exceptions (NDR)" value={stats.ndr} delta="Failed attempts to action" tone="red" />
        <Kpi icon={Boxes} label="Low-stock SKUs" value={lowStock.length} delta="At or below threshold" tone="amber" />
        <Kpi icon={RotateCcw} label="Open returns" value={returns.filter((r) => !["refunded", "cancelled", "exchange_shipped"].includes(r.status)).length} delta="Pickup · QC · refund" tone="green" />
      </div>

      <div className="adm-grid-2">
        <div className="card card-pad">
          <div className="row between mb-16">
            <b>Orders · last 14 days</b>
            <span className="xs muted">Excludes cancelled & failed payments</span>
          </div>
          <BarChart data={stats.series} label="Orders per day over the last 14 days" />
        </div>
        <div className="card card-pad">
          <b>Orders by status</b>
          <div className="mt-16">
            <HBars rows={statusRows} />
          </div>
        </div>
      </div>

      <div className="adm-grid-3">
        <div className="card card-pad">
          <b>Active shipments by warehouse</b>
          <div className="mt-16">
            <HBars rows={whLoad} />
          </div>
        </div>
        <div className="card card-pad">
          <div className="row between mb-16">
            <b>Low-stock alerts</b>
            <Link to="/admin/inventory?filter=low" className="link xs">View all</Link>
          </div>
          <div className="col gap-6">
            {lowStock.slice(0, 6).map((r) => (
              <div key={`${r.pid}-${r.wid}`} className="row gap-10 small">
                <AlertTriangle size={14} className={r.sellable <= 2 ? "text-red" : "text-orange"} />
                <span className="grow ellipsis">{productMap[r.pid]?.name}</span>
                <span className="xs muted">{warehouses.find((w) => w.id === r.wid)?.short}</span>
                <b className={r.sellable <= 2 ? "text-red" : "text-orange"}>{r.sellable}</b>
              </div>
            ))}
            {!lowStock.length ? <p className="small muted">All SKUs above threshold 🎉</p> : null}
          </div>
        </div>
        <div className="card card-pad">
          <b>System status</b>
          <div className="col gap-10 mt-16">
            {[
              ["Storefront", true, "Operational"],
              ["Razorpay payments", true, paymentMode() === "live" ? "Live mode" : "Sandbox mode"],
              ["Shiprocket logistics", true, "Polling every 10s"],
              ["Notifications (Email/SMS/WA)", true, "Queued via API"],
              ["Payment failures (24h)", stats.failedPayments < 3, `${stats.failedPayments} failed`],
            ].map(([n, ok, s]) => (
              <div key={n} className="row gap-10 small">
                {ok ? <CheckCircle2 size={16} className="text-green" /> : <XCircle size={16} className="text-red" />}
                <span className="grow">{n}</span>
                <span className="xs muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-grid-2">
        <div className="card">
          <div className="card-head">
            <b>Recent orders</b>
            <Link to="/admin/orders" className="link xs">All orders</Link>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.live.slice(0, 7).map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/admin/orders?q=${o.id}`} className="link small">{o.id}</Link>
                      <div className="xs muted">{formatDateTime(o.createdAt)}</div>
                    </td>
                    <td className="small">{o.customer}</td>
                    <td className="small bold">{formatINR(o.pricing.total)}</td>
                    <td className="xs">
                      <CreditCard size={12} /> {o.payment.method.toUpperCase()}
                    </td>
                    <td>
                      <StatusPill status={o.live} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col gap-16">
          <div className="card card-pad">
            <b>Top products (units)</b>
            <div className="col gap-10 mt-12">
              {topProducts.map(({ p, q }, i) => (
                <div key={p.id} className="row gap-10 small">
                  <b className="faint" style={{ width: 16 }}>{i + 1}</b>
                  <span className="grow ellipsis">{p.name}</span>
                  <span className="xs muted">{p.brand}</span>
                  <b>{q}</b>
                </div>
              ))}
            </div>
          </div>
          {admin.permissions.includes("franchise") ? (
            <Link to="/admin/franchise" className="card card-pad row gap-10">
              <Store size={20} className="text-orange" />
              <div className="grow">
                <b className="small">Franchise pipeline</b>
                <div className="xs muted">
                  {apps.filter((a) => a.status === "submitted").length} new · {apps.filter((a) => a.status === "site_verification").length} site visits · {apps.filter((a) => a.status === "approved").length} approved
                </div>
              </div>
              <span className="xs link">Review →</span>
            </Link>
          ) : null}
          <div className="card card-pad row gap-10">
            <Truck size={20} className="text-blue" />
            <div className="grow">
              <b className="small">Customers served</b>
              <div className="xs muted">{compact(new Set(orders.map((o) => o.userId)).size)} customers · {compact(orders.length)} orders in system</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
