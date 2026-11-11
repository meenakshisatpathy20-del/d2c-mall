/*
 * Inventory — OMS style.
 * Two views of the same stock: one row per SKU (totals, expandable per
 * warehouse) or one row per SKU per warehouse. Stock buckets: On hand,
 * Reserved, Sellable, QC hold (damaged), In transit, Sold.
 * Actions: stock-in / stock-out with a reason, QC hold → pass / write-off,
 * stock transfer orders that stay "in transit" until received.
 */
import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Lock,
  PackageCheck,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
  Unlock,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { categories, productMap, products } from "../../data/catalog";
import { getWarehouse, warehouses } from "../../data/logistics";
import {
  ADJUST_REASONS,
  buckets,
  markDamaged,
  receiveTransfer,
  releaseReservation,
  resolveDamaged,
  setThreshold,
  transferStock,
  adjustStock,
} from "../../lib/services/inventory";
import { cx, formatDateTime, formatNumber, timeAgo } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Img, Modal } from "../common/ui";
import { AdminHeader, Kpi, exportCsv } from "./AdminBits";
import "./AdminInventoryPage.css";

const MOVE_LABEL = {
  reserve: ["Reserved", "badge-soft-amber"],
  release: ["Released", "badge-soft-gray"],
  expired: ["Reservation expired", "badge-soft-gray"],
  sale: ["Sold", "badge-soft-blue"],
  cancel: ["Cancelled → restock", "badge-soft-green"],
  return: ["Return → restock", "badge-soft-green"],
  rto: ["RTO → restock", "badge-soft-green"],
  restock: ["Restock", "badge-soft-green"],
  inward: ["Inward / GRN", "badge-soft-green"],
  count: ["Cycle count", "badge-soft-blue"],
  adjust: ["Stock out", "badge-soft-red"],
  "qc-hold": ["QC hold", "badge-soft-amber"],
  "qc-pass": ["QC passed", "badge-soft-green"],
  "write-off": ["Written off", "badge-soft-red"],
  "transfer-out": ["Transfer out", "badge-soft-purple"],
  "transfer-dispatched": ["In transit", "badge-soft-purple"],
  "transfer-in": ["Transfer received", "badge-soft-purple"],
  "reallocate-out": ["Reallocated out", "badge-soft-gray"],
  "reallocate-in": ["Reallocated in", "badge-soft-gray"],
};

const STATUS_FILTERS = [
  ["all", "All stock"],
  ["low", "Low stock"],
  ["out", "Out of stock"],
  ["qc", "On QC hold"],
  ["transit", "In transit"],
];

const NO_TRANSFERS = [];

function statusOf(b) {
  if (b.sellable <= 0) return "out";
  if (b.sellable <= b.threshold) return "low";
  return "healthy";
}

function StatusBadge({ status }) {
  if (status === "out") return <span className="badge badge-soft-red">Out of stock</span>;
  if (status === "low") return <span className="badge badge-soft-amber">Low</span>;
  return <span className="badge badge-soft-green">Healthy</span>;
}

const passes = (f, b, status) =>
  f === "all" || (f === "low" && status === "low") || (f === "out" && status === "out") || (f === "qc" && b.damaged > 0) || (f === "transit" && b.inTransit > 0);

export default function AdminInventoryPage({ admin }) {
  const inventory = useStore((s) => s.inventory);
  const movements = useStore((s) => s.stockMovements);
  const reservations = useStore((s) => s.reservations);
  // Select the raw value: returning a new [] here would re-render forever for
  // demo data saved before transfers existed.
  const savedTransfers = useStore((s) => s.transfers);
  const transfers = savedTransfers || NO_TRANSFERS;
  const [params] = useSearchParams();
  const [tab, setTab] = useState("stock");
  const [view, setView] = useState("sku");
  const [q, setQ] = useState("");
  const [wh, setWh] = useState(admin.warehouseId || "all");
  const [cat, setCat] = useState("all");
  const [filter, setFilter] = useState(params.get("filter") === "low" ? "low" : "all");
  const [open, setOpen] = useState({});
  const [adjust, setAdjust] = useState(null);
  const [qc, setQc] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const canEdit = ["super_admin", "warehouse_admin"].includes(admin.role);
  const scoped = (w) => !admin.warehouseId || admin.warehouseId === w.id;

  // One entry per SKU with its per-warehouse rows.
  const skus = useMemo(() => {
    const out = [];
    products.forEach((p) => {
      if (cat !== "all" && p.category !== cat) return;
      if (q && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return;
      const rows = warehouses
        .filter((w) => (wh === "all" || w.id === wh) && inventory[p.id]?.[w.id])
        .map((w) => {
          const b = buckets(inventory[p.id][w.id]);
          return { p, w, ...b, status: statusOf(b) };
        });
      if (!rows.length) return;
      const total = rows.reduce(
        (t, r) => ({ onHand: t.onHand + r.onHand, available: t.available + r.available, reserved: t.reserved + r.reserved, sellable: t.sellable + r.sellable, damaged: t.damaged + r.damaged, inTransit: t.inTransit + r.inTransit, sold: t.sold + r.sold, threshold: t.threshold + r.threshold }),
        { onHand: 0, available: 0, reserved: 0, sellable: 0, damaged: 0, inTransit: 0, sold: 0, threshold: 0 }
      );
      out.push({ p, rows, total: { ...total, status: statusOf(total) } });
    });
    return out;
  }, [inventory, q, wh, cat]);

  const skuList = skus.filter((s) => passes(filter, s.total, s.total.status));
  const rowList = skus.flatMap((s) => s.rows).filter((r) => passes(filter, r, r.status));

  const totals = skus.reduce(
    (t, s) => ({
      onHand: t.onHand + s.total.onHand,
      sellable: t.sellable + s.total.sellable,
      reserved: t.reserved + s.total.reserved,
      damaged: t.damaged + s.total.damaged,
      inTransit: t.inTransit + s.total.inTransit,
      low: t.low + (s.total.status === "low" ? 1 : 0),
      out: t.out + (s.total.status === "out" ? 1 : 0),
    }),
    { onHand: 0, sellable: 0, reserved: 0, damaged: 0, inTransit: 0, low: 0, out: 0 }
  );
  const activeRes = reservations.filter((r) => r.status === "active" && (!admin.warehouseId || r.items.some((i) => i.warehouseId === admin.warehouseId)));
  const myTransfers = transfers.filter((t) => !admin.warehouseId || t.from === admin.warehouseId || t.to === admin.warehouseId);
  const pendingTransfers = myTransfers.filter((t) => t.status === "in_transit");
  const moves = movements.filter((m) => !admin.warehouseId || m.warehouseId === admin.warehouseId);

  const actions = (r) =>
    canEdit && scoped(r.w) ? (
      <div className="row gap-4">
        <button className="btn btn-xs btn-outline" title="Stock in / stock out" onClick={() => setAdjust({ ...r, qty: 10, reason: "grn", note: "", thr: r.threshold })}>
          <SlidersHorizontal size={12} /> Adjust
        </button>
        <button className="btn btn-xs btn-outline" title="QC hold / damaged" onClick={() => setQc({ ...r, mode: r.damaged ? "pass" : "hold", qty: 1, note: "" })}>
          <ShieldAlert size={12} /> QC
        </button>
        <button className="btn btn-xs btn-outline" title="Stock transfer" onClick={() => setTransfer({ ...r, to: warehouses.find((w) => w.id !== r.w.id).id, qty: Math.min(5, Math.max(r.sellable, 0)) })}>
          <ArrowRightLeft size={12} /> Transfer
        </button>
      </div>
    ) : null;

  const num = (v, cls) => <td className={cx("num small", cls)}>{v ? formatNumber(v) : <span className="faint">0</span>}</td>;

  const exportRows = () =>
    exportCsv(
      "inventory.csv",
      rowList.map((r) => ({ sku: r.p.sku, product: r.p.name, brand: r.p.brand, warehouse: r.w.short, on_hand: r.onHand, reserved: r.reserved, sellable: r.sellable, qc_hold: r.damaged, in_transit: r.inTransit, sold: r.sold, threshold: r.threshold, status: r.status }))
    );

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Inventory management · OMS"
        title="Inventory"
        sub={admin.warehouseId ? `Stock at ${getWarehouse(admin.warehouseId).name}` : `${formatNumber(skus.length)} SKU${skus.length === 1 ? "" : "s"} across ${warehouses.length} fulfilment hubs`}
        actions={
          <button className="btn btn-sm btn-outline" onClick={exportRows}>
            <Download size={14} /> Export CSV
          </button>
        }
      />

      <div className="adm-kpis inv-kpis">
        <Kpi icon={Boxes} label="On hand" value={formatNumber(totals.onHand)} tone="blue" delta="Good + QC hold" />
        <Kpi icon={CheckCircle2} label="Sellable" value={formatNumber(totals.sellable)} tone="green" delta="Can be sold now" />
        <Kpi icon={Lock} label="Reserved" value={formatNumber(totals.reserved)} tone="amber" delta={`${activeRes.length} orders in checkout`} />
        <Kpi icon={ShieldAlert} label="QC hold / damaged" value={formatNumber(totals.damaged)} tone="red" delta="Not sellable" />
        <Kpi icon={Truck} label="In transit" value={formatNumber(totals.inTransit)} tone="purple" delta={`${pendingTransfers.length} transfer${pendingTransfers.length === 1 ? "" : "s"} to receive`} />
        <Kpi icon={AlertTriangle} label="Low / out of stock" value={`${totals.low} / ${totals.out}`} tone="orange" delta="SKUs" />
      </div>

      <div className="seg">
        <button className={cx(tab === "stock" && "active")} onClick={() => setTab("stock")}>Stock</button>
        <button className={cx(tab === "transfers" && "active")} onClick={() => setTab("transfers")}>Transfers ({pendingTransfers.length})</button>
        <button className={cx(tab === "reservations" && "active")} onClick={() => setTab("reservations")}>Reservations ({activeRes.length})</button>
        <button className={cx(tab === "moves" && "active")} onClick={() => setTab("moves")}>Movement history</button>
      </div>

      {tab === "stock" ? (
        <>
          <div className="adm-toolbar">
            <div className="seg inv-view">
              <button className={cx(view === "sku" && "active")} onClick={() => setView("sku")}>By SKU</button>
              <button className={cx(view === "wh" && "active")} onClick={() => setView("wh")}>By warehouse</button>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
              <span className="addon"><Search size={15} /></span>
              <input className="input" placeholder="Search SKU, product or brand" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="select" style={{ width: "auto" }} value={wh} onChange={(e) => setWh(e.target.value)} disabled={!!admin.warehouseId}>
              <option value="all">All warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.short}</option>
              ))}
            </select>
            <select className="select" style={{ width: "auto" }} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select className="select" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
              {STATUS_FILTERS.map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>

          <div className="inv-legend xs muted">
            <b>On hand</b> = good stock + QC hold · <b>Sellable</b> = good stock − reserved · <b>Reserved</b> = held for orders in checkout · <b>In transit</b> = coming from another warehouse
          </div>

          <div className="table-wrap">
            <table className="table inv-table">
              <thead>
                <tr>
                  {view === "sku" ? <th style={{ width: 28 }} /> : null}
                  <th>SKU / Product</th>
                  {view === "wh" ? <th>Warehouse</th> : null}
                  <th className="num">On hand</th>
                  <th className="num">Reserved</th>
                  <th className="num">Sellable</th>
                  <th className="num">QC hold</th>
                  <th className="num">In transit</th>
                  <th>Status</th>
                  {canEdit ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {view === "sku"
                  ? skuList.slice(0, 120).map((s) => {
                      const isOpen = !!open[s.p.id];
                      return (
                        <Fragment key={s.p.id}>
                          <tr className={cx("clickable", isOpen && "selected")} onClick={() => setOpen({ ...open, [s.p.id]: !isOpen })}>
                            <td>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                            <td>
                              <div className="row gap-10">
                                <Img src={s.p.images[0]} alt="" label="" style={{ width: 36, height: 36, borderRadius: 8 }} />
                                <div style={{ minWidth: 0 }}>
                                  <b className="xs">{s.p.sku}</b>
                                  <div className="xs muted ellipsis" style={{ maxWidth: 220 }}>{s.p.name} · {s.p.brand}</div>
                                  <span className="row gap-4 xs muted">
                                    {s.rows.map((r) => (
                                      <i key={r.w.id} className="wh-dot" title={r.w.short} style={{ background: r.w.color }} />
                                    ))}
                                    {s.rows.length} hub{s.rows.length > 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            {num(s.total.onHand, "bold")}
                            {num(s.total.reserved, s.total.reserved ? "text-orange bold" : "")}
                            {num(s.total.sellable, "bold")}
                            {num(s.total.damaged, s.total.damaged ? "text-red bold" : "")}
                            {num(s.total.inTransit, s.total.inTransit ? "text-purple bold" : "")}
                            <td><StatusBadge status={s.total.status} /></td>
                            {canEdit ? <td className="xs muted">{isOpen ? "" : "Click to manage"}</td> : null}
                          </tr>
                          {isOpen
                            ? s.rows.map((r) => (
                                <tr key={`${s.p.id}-${r.w.id}`} className="inv-sub">
                                  <td />
                                  <td>
                                    <span className="row gap-6 xs">
                                      <i className="wh-dot" style={{ background: r.w.color }} /> <b>{r.w.name}</b>
                                    </span>
                                  </td>
                                  {num(r.onHand)}
                                  {num(r.reserved, r.reserved ? "text-orange" : "")}
                                  {num(r.sellable, "bold")}
                                  {num(r.damaged, r.damaged ? "text-red" : "")}
                                  {num(r.inTransit, r.inTransit ? "text-purple" : "")}
                                  <td><StatusBadge status={r.status} /></td>
                                  {canEdit ? <td>{actions(r)}</td> : null}
                                </tr>
                              ))
                            : null}
                        </Fragment>
                      );
                    })
                  : rowList.slice(0, 200).map((r) => (
                      <tr key={`${r.p.id}-${r.w.id}`}>
                        <td>
                          <div className="row gap-10">
                            <Img src={r.p.images[0]} alt="" label="" style={{ width: 36, height: 36, borderRadius: 8 }} />
                            <div style={{ minWidth: 0 }}>
                              <b className="xs">{r.p.sku}</b>
                              <div className="xs muted ellipsis" style={{ maxWidth: 200 }}>{r.p.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="xs">
                          <span className="row gap-4"><i className="wh-dot" style={{ background: r.w.color }} /> {r.w.short}</span>
                        </td>
                        {num(r.onHand, "bold")}
                        {num(r.reserved, r.reserved ? "text-orange bold" : "")}
                        {num(r.sellable, "bold")}
                        {num(r.damaged, r.damaged ? "text-red bold" : "")}
                        {num(r.inTransit, r.inTransit ? "text-purple bold" : "")}
                        <td><StatusBadge status={r.status} /></td>
                        {canEdit ? <td>{actions(r)}</td> : null}
                      </tr>
                    ))}
              </tbody>
            </table>
            {(view === "sku" ? skuList.length : rowList.length) === 0 ? <p className="small muted center" style={{ padding: 24 }}>No stock matches these filters.</p> : null}
            {view === "sku" && skuList.length > 120 ? <p className="xs muted center" style={{ padding: 12 }}>Showing first 120 SKUs — refine filters to see more.</p> : null}
            {view === "wh" && rowList.length > 200 ? <p className="xs muted center" style={{ padding: 12 }}>Showing first 200 rows — refine filters to see more.</p> : null}
          </div>
          {view === "sku" ? <p className="xs muted">Click a SKU to see its stock in each warehouse and to adjust, move to QC hold or transfer it.</p> : null}
        </>
      ) : null}

      {tab === "transfers" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Transfer</th>
                <th>SKU</th>
                <th>From → To</th>
                <th className="num">Qty</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {myTransfers.map((t) => (
                <tr key={t.id}>
                  <td className="xs"><b>{t.id}</b><div className="muted">by {t.createdBy}</div></td>
                  <td className="xs"><b>{productMap[t.productId]?.sku}</b><div className="muted ellipsis" style={{ maxWidth: 180 }}>{productMap[t.productId]?.name}</div></td>
                  <td className="xs">{getWarehouse(t.from).short} → <b>{getWarehouse(t.to).short}</b></td>
                  <td className="num small bold">{t.qty}</td>
                  <td>{t.status === "received" ? <span className="badge badge-soft-green">Received</span> : <span className="badge badge-soft-purple">In transit</span>}</td>
                  <td className="xs">{formatDateTime(t.createdAt)}{t.receivedAt ? <div className="muted">Received {timeAgo(t.receivedAt)} · {t.receivedBy}</div> : null}</td>
                  <td>
                    {t.status === "in_transit" && canEdit && (!admin.warehouseId || admin.warehouseId === t.to) ? (
                      <button className="btn btn-xs btn-blue" onClick={() => { const r = receiveTransfer(t.id, admin.name); if (r.ok) toast(`${t.qty} units received at ${getWarehouse(t.to).short}`); else toast.error(r.reason); }}>
                        <PackageCheck size={13} /> Receive
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!myTransfers.length ? <p className="small muted center" style={{ padding: 24 }}>No stock transfers yet. Use <b>Transfer</b> on any SKU to move stock between warehouses — it stays “in transit” until the receiving warehouse clicks Receive.</p> : null}
        </div>
      ) : null}

      {tab === "reservations" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reservation</th>
                <th>Order</th>
                <th>Items</th>
                <th>Expires</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {activeRes.map((r) => (
                <tr key={r.id}>
                  <td className="xs"><b>{r.id}</b><div className="muted">{formatDateTime(r.createdAt)}</div></td>
                  <td className="small">{r.orderId}</td>
                  <td className="xs">{r.items.map((i) => `${productMap[i.productId]?.sku} ×${i.qty} @ ${getWarehouse(i.warehouseId).short}`).join(", ")}</td>
                  <td className="xs">{Math.max(0, Math.round((r.expiresAt - Date.now()) / 60000))} min</td>
                  <td>
                    {canEdit ? (
                      <button className="btn btn-xs btn-outline" onClick={() => { releaseReservation(r.orderId, "release"); toast("Reservation released"); }}>
                        <Unlock size={12} /> Release
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activeRes.length ? <p className="small muted center" style={{ padding: 24 }}>No active reservations. Stock is reserved for 15 minutes during checkout and auto-released on payment failure or timeout.</p> : null}
        </div>
      ) : null}

      {tab === "moves" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th className="num">Qty</th>
                <th>Reference</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {moves.slice(0, 150).map((m) => (
                <tr key={m.id}>
                  <td className="xs">{timeAgo(m.at)}</td>
                  <td><span className={cx("badge", MOVE_LABEL[m.type]?.[1] || "badge-soft-gray")}>{MOVE_LABEL[m.type]?.[0] || m.type}</span></td>
                  <td className="xs"><b>{productMap[m.productId]?.sku}</b></td>
                  <td className="xs">{getWarehouse(m.warehouseId)?.short}</td>
                  <td className="num small">{m.qty}</td>
                  <td className="xs muted">{m.ref}</td>
                  <td className="xs">{m.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!moves.length ? <p className="small muted center" style={{ padding: 24 }}>No movements yet. Place an order on the storefront, or adjust stock here, to see entries appear.</p> : null}
        </div>
      ) : null}

      {/* ---------- Adjust (stock in / stock out) ---------- */}
      <Modal
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title={`Adjust stock · ${adjust?.p.sku} @ ${adjust?.w.short}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAdjust(null)}>Cancel</button>
            <button
              className="btn btn-blue"
              onClick={() => {
                const qty = Math.abs(Number(adjust.qty) || 0);
                if (qty) {
                  const r = adjustStock(adjust.p.id, adjust.w.id, qty, admin.name, adjust.note || "", adjust.reason);
                  if (!r.ok) return toast.error(r.reason);
                }
                if (Number(adjust.thr) !== adjust.threshold) setThreshold(adjust.p.id, adjust.w.id, Number(adjust.thr));
                toast("Inventory updated");
                setAdjust(null);
              }}
            >
              Save
            </button>
          </>
        }
      >
        {adjust ? (() => {
          const reason = ADJUST_REASONS.find((r) => r.id === adjust.reason);
          const after = Math.max(0, adjust.available + (Math.abs(Number(adjust.qty) || 0) * (reason?.sign || 1)));
          return (
            <div className="col gap-16">
              <div className="soft-panel small">
                On hand <b>{adjust.onHand}</b> · Reserved <b>{adjust.reserved}</b> · Sellable <b>{adjust.sellable}</b> · QC hold <b>{adjust.damaged}</b>
              </div>
              <div className="field">
                <label>Reason</label>
                <select className="select" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })}>
                  {ADJUST_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.sign > 0 ? "Stock in · " : "Stock out · "}{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Quantity</label>
                  <input className="input" type="number" min={1} value={adjust.qty} onChange={(e) => setAdjust({ ...adjust, qty: e.target.value })} />
                  <span className="hint">Good stock after: {after}</span>
                </div>
                <div className="field">
                  <label>Reference (GRN / invoice no., optional)</label>
                  <input className="input" maxLength={60} value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} placeholder="e.g. GRN-1042" />
                </div>
              </div>
              <div className="field">
                <label>Low-stock threshold</label>
                <input className="input" type="number" min={0} value={adjust.thr} onChange={(e) => setAdjust({ ...adjust, thr: e.target.value })} />
                <span className="hint">The SKU shows as “Low” when sellable stock falls to this number.</span>
              </div>
            </div>
          );
        })() : null}
      </Modal>

      {/* ---------- QC hold / damaged ---------- */}
      <Modal
        open={!!qc}
        onClose={() => setQc(null)}
        title={`Quality check · ${qc?.p.sku} @ ${qc?.w.short}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setQc(null)}>Cancel</button>
            <button
              className={cx("btn", qc?.mode === "write_off" ? "btn-red" : "btn-blue")}
              onClick={() => {
                const qty = Number(qc.qty) || 0;
                const r = qc.mode === "hold" ? markDamaged(qc.p.id, qc.w.id, qty, admin.name, qc.note || "Damaged / QC hold") : resolveDamaged(qc.p.id, qc.w.id, qty, qc.mode === "pass" ? "pass" : "write_off", admin.name);
                if (!r.ok) return toast.error(r.reason);
                toast(qc.mode === "hold" ? `${qty} units moved to QC hold` : qc.mode === "pass" ? `${qty} units back to sellable stock` : `${qty} units written off`);
                setQc(null);
              }}
            >
              {qc?.mode === "hold" ? "Move to QC hold" : qc?.mode === "pass" ? "QC passed — make sellable" : "Write off"}
            </button>
          </>
        }
      >
        {qc ? (
          <div className="col gap-16">
            <div className="soft-panel small">
              Sellable <b>{qc.sellable}</b> · On QC hold <b>{qc.damaged}</b>
            </div>
            <div className="seg">
              <button className={cx(qc.mode === "hold" && "active")} onClick={() => setQc({ ...qc, mode: "hold" })}>Move to QC hold</button>
              <button className={cx(qc.mode === "pass" && "active")} disabled={!qc.damaged} onClick={() => setQc({ ...qc, mode: "pass" })}>QC passed</button>
              <button className={cx(qc.mode === "write_off" && "active")} disabled={!qc.damaged} onClick={() => setQc({ ...qc, mode: "write_off" })}>Write off</button>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Quantity (max {qc.mode === "hold" ? qc.sellable : qc.damaged})</label>
                <input className="input" type="number" min={1} value={qc.qty} onChange={(e) => setQc({ ...qc, qty: e.target.value })} />
              </div>
              {qc.mode === "hold" ? (
                <div className="field">
                  <label>Reason (optional)</label>
                  <input className="input" maxLength={60} value={qc.note} onChange={(e) => setQc({ ...qc, note: e.target.value })} placeholder="e.g. Torn packaging" />
                </div>
              ) : null}
            </div>
            <p className="xs muted">
              {qc.mode === "hold"
                ? "Units on QC hold stay in the warehouse but can't be sold until they pass inspection or are written off."
                : qc.mode === "pass"
                  ? "Inspected units go back into sellable stock."
                  : "Written-off units are removed from stock permanently."}
            </p>
          </div>
        ) : null}
      </Modal>

      {/* ---------- Transfer ---------- */}
      <Modal
        open={!!transfer}
        onClose={() => setTransfer(null)}
        title={`Stock transfer · ${transfer?.p.sku}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setTransfer(null)}>Cancel</button>
            <button
              className="btn btn-blue"
              onClick={() => {
                const r = transferStock(transfer.p.id, transfer.w.id, transfer.to, Number(transfer.qty), admin.name);
                if (!r.ok) return toast.error(r.reason);
                toast(`Transfer ${r.ref} dispatched — in transit to ${getWarehouse(transfer.to).short}`);
                setTransfer(null);
              }}
            >
              <ArrowRightLeft size={15} /> Dispatch transfer
            </button>
          </>
        }
      >
        {transfer ? (
          <div className="col gap-16">
            <div className="form-grid">
              <div className="field">
                <label>From</label>
                <input className="input" value={transfer.w.name} disabled />
              </div>
              <div className="field">
                <label>To</label>
                <select className="select" value={transfer.to} onChange={(e) => setTransfer({ ...transfer, to: e.target.value })}>
                  {warehouses.filter((w) => w.id !== transfer.w.id).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="field span-2">
                <label>Quantity (max {transfer.sellable} sellable)</label>
                <input className="input" type="number" min={1} max={transfer.sellable} value={transfer.qty} onChange={(e) => setTransfer({ ...transfer, qty: e.target.value })} />
              </div>
            </div>
            <p className="xs muted">Stock leaves {transfer.w.short} now and shows as <b>In transit</b> at the destination until it is received in the Transfers tab.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
