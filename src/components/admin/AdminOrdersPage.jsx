import { useEffect, useMemo, useState } from "react";
import { api, live, useBackend } from "../../lib/api";
import { Link, useSearchParams } from "react-router-dom";
import { Ban, Download, HandCoins, RotateCcw, Search, Truck, Wallet, X, XCircle } from "lucide-react";
import { COD_ADVANCE_FORFEIT_TEXT, advanceView, codAdvanceTierText, codDue, hasCodAdvance } from "../../data/codAdvance";
import { useStore } from "../../lib/store";
import { getCourier, getWarehouse, warehouses } from "../../data/logistics";
import { ORDER_STATUS, SHIPMENT_LABEL, deriveOrderStatus, shipmentStatus } from "../../lib/orderModel";
import { cancelOrder } from "../../lib/services/orders";
import { useNow } from "../../lib/services/liveSync";
import { cx, formatDateTime, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Drawer, Img, StatusPill } from "../common/ui";
import { ShipmentEvents, ShipmentProgress } from "../order/OrderBits";
import { AdminHeader, Kpi, exportCsv } from "./AdminBits";
import { scopeOrders } from "./AdminDashboard";
import "./AdminOrdersPage.css";

export function ShipmentOps({ shipment, admin }) {
  const status = shipmentStatus(shipment);
  const canOps = ["super_admin", "logistics", "warehouse_admin", "support"].includes(admin.role);
  if (!canOps || ["delivered", "cancelled"].includes(status)) return null;
  const hint = { new: "Ship now", awb_assigned: "Schedule pickup", delivery_failed: "Take NDR action", rto_delivered: "Mark RTO received" }[status];
  return (
    <div className="ship-ops">
      <Link to="/admin/shipments" className="btn btn-xs btn-soft">
        <Truck size={12} /> {hint ? `${hint} in Shipping` : "Open in Shipping"} →
      </Link>
    </div>
  );
}

const ADVANCE_TONE = { pending: "amber", paid: "blue", adjusted: "green", refunded: "gray", forfeited: "red" };
const BALANCE_LABEL = { due: "To collect at door", collected: "Collected", not_due: "Not due" };

/** Badge for the COD advance state on an order. */
export function AdvanceBadge({ view }) {
  if (!view) return null;
  return <span className={`badge badge-soft-${ADVANCE_TONE[view.status] || "gray"}`}>Advance · {view.label}</span>;
}

/** COD partial advance breakdown shown to operations in the order drawer. */
function AdvancePanel({ order, status }) {
  const view = advanceView(order, status);
  if (!view) return null;
  return (
    <div className="soft-panel adv-panel">
      <div className="row between wrap gap-6">
        <span className="label">COD partial advance</span>
        <AdvanceBadge view={view} />
      </div>
      <div className="adv-split mt-8">
        <div>
          <span className="xs muted">Order total</span>
          <b>{formatINR(order.pricing.total)}</b>
        </div>
        <div>
          <span className="xs muted">Advance (online)</span>
          <b>{formatINR(view.amount)}</b>
        </div>
        <div>
          <span className="xs muted">Balance (COD)</span>
          <b>{formatINR(view.balance ?? codDue(order))}</b>
          <span className="xs muted">{BALANCE_LABEL[view.balanceStatus]}</span>
        </div>
      </div>
      <div className="xs muted mt-8">
        {view.paidAt ? <>Paid {formatDateTime(view.paidAt)} via {view.instrument || "Online"}{view.razorpayPaymentId ? ` · ${view.razorpayPaymentId}` : ""}. </> : <>Advance not yet received — order will not ship until it is paid. </>}
        {order.codAdvanceConsent ? <>Customer accepted advance terms on {formatDateTime(order.codAdvanceConsent.at)}.</> : null}
      </div>
      {view.status === "forfeited" ? <div className="notice warn xs mt-8">Customer refused delivery — advance retained to cover two-way shipping.</div> : null}
      {view.status === "refunded" ? <div className="notice info xs mt-8">Advance refunded to the original payment method.</div> : null}
      <div className="xs muted mt-8">Policy: {codAdvanceTierText()}. {COD_ADVANCE_FORFEIT_TEXT}</div>
    </div>
  );
}

function OrderDrawer({ order, onClose, admin, now }) {
  if (!order) return null;
  const status = deriveOrderStatus(order, now);
  return (
    <div className="adm-drawer">
      <div className="adm-drawer-head">
        <div>
          <b>Order {order.id}</b>
          <div className="xs muted">{formatDateTime(order.createdAt)}</div>
        </div>
        <div className="row gap-6">
          <StatusPill status={status} />
          <button className="icon-btn sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
      </div>
      <div className="adm-drawer-body">
        <div className="grid grid-2">
          <div className="soft-panel">
            <span className="label">Customer</span>
            <div className="small mt-4"><b>{order.customer}</b></div>
            <div className="xs muted">{order.address.phone} · {order.email || "—"}</div>
            <div className="xs muted mt-4">{order.address.line1}, {order.address.city} {order.address.pincode}</div>
          </div>
          <div className="soft-panel">
            <span className="label">Payment</span>
            <div className="small mt-4"><b>{formatINR(order.pricing.total)}</b> · {order.payment.method.toUpperCase()}</div>
            <div className="xs muted" style={{ textTransform: "capitalize" }}>{order.payment.status.replace(/_/g, " ")}</div>
            {order.payment.razorpayPaymentId ? <div className="xs muted">{order.payment.razorpayPaymentId} {order.payment.signatureVerified ? "· ✓ signature" : ""}</div> : null}
          </div>
        </div>

        <AdvancePanel order={order} status={status} />

        <div>
          <span className="label">Items</span>
          <div className="col gap-6 mt-8">
            {order.items.map((i) => (
              <div key={i.lineId} className="row gap-10">
                <Img src={i.image} alt="" label="" style={{ width: 40, height: 48, borderRadius: 8 }} />
                <div className="grow small">
                  <b>{i.name}</b>
                  <div className="xs muted">{i.sku} · {[i.size, i.color].filter(Boolean).join(" · ")} · Qty {i.qty}</div>
                </div>
                <b className="small">{formatINR(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
        </div>

        {order.shipments.map((s) => (
          <div key={s.id} className="ship-card">
            <div className="row between wrap gap-6">
              <b className="small row gap-6">
                <Truck size={15} /> {s.id} · {getWarehouse(s.warehouseId).short} → {order.address.city}
              </b>
              <span className="xs muted">{getCourier(s.courierId).name} · AWB {s.awb}</span>
            </div>
            <ShipmentProgress shipment={s} now={now} />
            <ShipmentOps order={order} shipment={s} admin={admin} />
            <details className="mt-12">
              <summary className="link xs">Event log</summary>
              <div className="mt-12">
                <ShipmentEvents shipment={s} now={now} city={order.address.city} />
              </div>
            </details>
          </div>
        ))}

        <div>
          <span className="label">Timeline</span>
          <div className="col gap-6 mt-8">
            {order.timeline.map((t) => (
              <div key={`${t.status}${t.at}`} className="xs">
                <b>{formatDateTime(t.at)}</b> — {t.note}
              </div>
            ))}
          </div>
        </div>

        {["super_admin", "support"].includes(admin.role) && !["cancelled", "delivered", "returned", "payment_failed"].includes(status) ? (
          <button
            className="btn btn-red"
            onClick={() => {
              const r = cancelOrder(order.id, "Cancelled by operations", "admin");
              r.ok ? toast("Order cancelled, stock restored, refund initiated") : toast.error(r.error);
            }}
          >
            <XCircle size={15} /> Cancel order & refund
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOrdersPage({ admin }) {
  const all = useStore((s) => s.orders);
  const now = useNow(8000);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [status, setStatus] = useState("all");
  const [pay, setPay] = useState("all");
  const [wh, setWh] = useState(admin.warehouseId || "all");
  const [openId, setOpenId] = useState(params.get("q") || null);

  const backend = useBackend();
  const serverToken = useStore((s) => s.adminSession?.serverToken);
  const [serverOrders, setServerOrders] = useState([]);
  useEffect(() => {
    if (!backend.available || !live("db") || !serverToken) return;
    api("/admin/orders?limit=100")
      .then((r) => setServerOrders((r.orders || []).map((o) => ({ ...o, fromServer: true, shipments: o.shipments || [], timeline: o.timeline || [], customer: o.customer || o.address?.name || "Customer" }))))
      .catch(() => {});
  }, [backend, serverToken]);
  const merged = useMemo(() => [...serverOrders.filter((so) => !all.some((o) => o.id === so.id)), ...all], [serverOrders, all]);
  const orders = useMemo(() => scopeOrders(merged, admin).map((o) => ({ ...o, live: deriveOrderStatus(o, now) })), [merged, admin, now]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.live !== status) return false;
      if (pay === "cod_advance" && !hasCodAdvance(o)) return false;
      if (pay === "cod" && o.payment.method !== "cod") return false;
      if (pay === "prepaid" && o.payment.method === "cod") return false;
      if (wh !== "all" && !o.shipments.some((s) => s.warehouseId === wh)) return false;
      if (!t) return true;
      return o.id.toLowerCase().includes(t) || o.customer.toLowerCase().includes(t) || o.address.phone.includes(t) || o.items.some((i) => i.sku.toLowerCase().includes(t));
    });
  }, [orders, q, status, pay, wh]);
  const open = orders.find((o) => o.id === openId);

  // COD partial-advance summary across the orders this admin can see.
  const adv = useMemo(() => {
    const r = { count: 0, collected: 0, pending: 0, balanceDue: 0, forfeited: 0, forfeitedCount: 0, refunded: 0 };
    for (const o of orders) {
      const v = advanceView(o, o.live);
      if (!v) continue;
      r.count += 1;
      if (["paid", "adjusted"].includes(v.status)) r.collected += v.amount;
      if (v.status === "pending") r.pending += 1;
      if (v.status === "forfeited") { r.forfeited += v.amount; r.forfeitedCount += 1; }
      if (v.status === "refunded") r.refunded += v.amount;
      if (v.balanceStatus === "due" && v.status !== "pending") r.balanceDue += v.balance ?? codDue(o);
    }
    return r;
  }, [orders]);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Order management"
        title="Orders"
        sub={`${list.length} of ${orders.length} orders`}
        actions={
          <button
            className="btn btn-sm btn-outline"
            onClick={() =>
              exportCsv(
                "orders.csv",
                list.map((o) => ({ order: o.id, date: new Date(o.createdAt).toISOString(), customer: o.customer, city: o.address.city, items: o.items.length, total: o.pricing.total, payment: o.payment.method, paymentStatus: o.payment.status, codAdvance: o.pricing.codAdvance || 0, advanceStatus: advanceView(o, o.live)?.status || "", codBalance: codDue(o), status: o.live }))
              )
            }
          >
            <Download size={14} /> Export CSV
          </button>
        }
      />
      {adv.count ? (
        <div className="adm-kpis adv-kpis">
          <Kpi icon={Wallet} label="COD advances collected" value={formatINR(adv.collected)} delta={`${adv.count} advance orders${adv.pending ? ` · ${adv.pending} awaiting payment` : ""}`} tone="blue" />
          <Kpi icon={HandCoins} label="Balance to collect at door" value={formatINR(adv.balanceDue)} delta="Open COD advance orders" tone="orange" />
          <Kpi icon={Ban} label="Advance forfeited" value={formatINR(adv.forfeited)} delta={`${adv.forfeitedCount} refused / RTO`} tone="purple" />
          <Kpi icon={RotateCcw} label="Advance refunded" value={formatINR(adv.refunded)} delta="Cancelled or returned" tone="green" />
        </div>
      ) : null}
      <div className="adm-toolbar">
        <div className="input-group" style={{ flex: 1, minWidth: 220 }}>
          <span className="addon"><Search size={15} /></span>
          <input className="input" placeholder="Order ID, customer, phone or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="select" style={{ width: "auto" }} value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="all">All payments</option>
          <option value="prepaid">Prepaid</option>
          <option value="cod">COD</option>
          <option value="cod_advance">COD with advance</option>
        </select>
        <select className="select" style={{ width: "auto" }} value={wh} onChange={(e) => setWh(e.target.value)} disabled={!!admin.warehouseId}>
          <option value="all">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.short}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th className="num">Total</th>
              <th>Payment</th>
              <th>Fulfilment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className={cx("clickable", openId === o.id && "selected")} onClick={() => setOpenId(o.id)}>
                <td>
                  <b className="small text-blue">{o.id}</b> {o.fromServer || o.serverSynced ? <span className="badge badge-soft-green">Server</span> : null}
                  <div className="xs muted">{formatDateTime(o.createdAt)}</div>
                </td>
                <td className="small">
                  {o.customer}
                  <div className="xs muted">{o.address.city} · {o.address.pincode}</div>
                </td>
                <td className="small">{o.items.reduce((t, i) => t + i.qty, 0)}</td>
                <td className="num small bold">{formatINR(o.pricing.total)}</td>
                <td className="xs">
                  <b>{o.payment.method.toUpperCase()}</b>
                  <div className="muted" style={{ textTransform: "capitalize" }}>{o.payment.status.replace(/_/g, " ")}</div>
                  {hasCodAdvance(o) ? (
                    <div className="mt-4">
                      <AdvanceBadge view={advanceView(o, o.live)} />
                      <div className="muted">{formatINR(o.pricing.codAdvance)} adv · {formatINR(codDue(o))} at door</div>
                    </div>
                  ) : null}
                </td>
                <td className="xs">
                  {o.shipments.map((s) => (
                    <div key={s.id}>
                      {getWarehouse(s.warehouseId).short} · {SHIPMENT_LABEL[shipmentStatus(s, now)]}
                    </div>
                  ))}
                  {!o.shipments.length ? <span className="muted">—</span> : null}
                </td>
                <td>
                  <StatusPill status={o.live} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length ? <p className="small muted center" style={{ padding: 24 }}>No orders match these filters.</p> : null}
      </div>
      <Drawer open={!!open} onClose={() => setOpenId(null)} width="min(100vw, 620px)">
        <OrderDrawer order={open} onClose={() => setOpenId(null)} admin={admin} now={now} />
      </Drawer>
    </div>
  );
}
