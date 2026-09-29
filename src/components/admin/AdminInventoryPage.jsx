import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowRightLeft, Boxes, Download, History, Lock, Minus, Plus, Search, SlidersHorizontal, Unlock } from "lucide-react";
import { useStore } from "../../lib/store";
import { categories, productMap, products } from "../../data/catalog";
import { getWarehouse, warehouses } from "../../data/logistics";
import { adjustStock, releaseReservation, setThreshold, transferStock } from "../../lib/services/inventory";
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
  restock: ["Restock", "badge-soft-green"],
  adjust: ["Adjustment", "badge-soft-red"],
  "transfer-in": ["Transfer in", "badge-soft-purple"],
  "transfer-out": ["Transfer out", "badge-soft-purple"],
};

export default function AdminInventoryPage({ admin }) {
  const inventory = useStore((s) => s.inventory);
  const movements = useStore((s) => s.stockMovements);
  const reservations = useStore((s) => s.reservations);
  const [params] = useSearchParams();
  const [tab, setTab] = useState("stock");
  const [q, setQ] = useState("");
  const [wh, setWh] = useState(admin.warehouseId || "all");
  const [cat, setCat] = useState("all");
  const [lowOnly, setLowOnly] = useState(params.get("filter") === "low");
  const [adjust, setAdjust] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const canEdit = ["super_admin", "warehouse_admin"].includes(admin.role);

  const rows = useMemo(() => {
    const out = [];
    products.forEach((p) => {
      if (cat !== "all" && p.category !== cat) return;
      if (q && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q.toLowerCase())) return;
      warehouses.forEach((w) => {
        if (wh !== "all" && w.id !== wh) return;
        const r = inventory[p.id]?.[w.id];
        if (!r) return;
        const sellable = r.available - r.reserved;
        const low = sellable <= r.threshold;
        if (lowOnly && !low) return;
        out.push({ p, w, ...r, sellable, low, out: sellable <= 0 });
      });
    });
    return out;
  }, [inventory, q, wh, cat, lowOnly]);

  const totals = rows.reduce((t, r) => ({ available: t.available + r.available, reserved: t.reserved + r.reserved, sold: t.sold + r.sold, low: t.low + (r.low ? 1 : 0), out: t.out + (r.out ? 1 : 0) }), { available: 0, reserved: 0, sold: 0, low: 0, out: 0 });
  const activeRes = reservations.filter((r) => r.status === "active" && (!admin.warehouseId || r.items.some((i) => i.warehouseId === admin.warehouseId)));
  const moves = movements.filter((m) => !admin.warehouseId || m.warehouseId === admin.warehouseId);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Inventory management"
        title="Inventory"
        sub={admin.warehouseId ? `Stock at ${getWarehouse(admin.warehouseId).name}` : "Stock across all 4 fulfilment hubs"}
        actions={
          <button className="btn btn-sm btn-outline" onClick={() => exportCsv("inventory.csv", rows.map((r) => ({ sku: r.p.sku, product: r.p.name, brand: r.p.brand, warehouse: r.w.short, available: r.available, reserved: r.reserved, sellable: r.sellable, sold: r.sold, threshold: r.threshold })))}>
            <Download size={14} /> Export
          </button>
        }
      />
      <div className="adm-kpis">
        <Kpi icon={Boxes} label="Units available" value={formatNumber(totals.available)} tone="blue" />
        <Kpi icon={Lock} label="Reserved (in checkout)" value={formatNumber(totals.reserved)} tone="amber" delta={`${activeRes.length} active reservations`} />
        <Kpi icon={Boxes} label="Units sold" value={formatNumber(totals.sold)} tone="green" />
        <Kpi icon={AlertTriangle} label="Low stock rows" value={totals.low} tone="orange" />
        <Kpi icon={AlertTriangle} label="Out of stock rows" value={totals.out} tone="red" />
        <Kpi icon={History} label="Stock movements" value={moves.length} tone="purple" delta="Audit log" />
      </div>

      <div className="seg">
        <button className={cx(tab === "stock" && "active")} onClick={() => setTab("stock")}>Stock by warehouse</button>
        <button className={cx(tab === "reservations" && "active")} onClick={() => setTab("reservations")}>Reservations ({activeRes.length})</button>
        <button className={cx(tab === "moves" && "active")} onClick={() => setTab("moves")}>Movement history</button>
      </div>

      {tab === "stock" ? (
        <>
          <div className="adm-toolbar">
            <div className="input-group" style={{ flex: 1, minWidth: 220 }}>
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
            <label className="check small">
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only
            </label>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU / Product</th>
                  <th>Brand</th>
                  <th>Warehouse</th>
                  <th className="num">Available</th>
                  <th className="num">Reserved</th>
                  <th className="num">Sellable</th>
                  <th className="num">Sold</th>
                  <th className="num">Threshold</th>
                  <th>Status</th>
                  {canEdit ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r) => (
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
                    <td className="xs">{r.p.brand}</td>
                    <td className="xs">
                      <span className="row gap-4"><i className="wh-dot" style={{ background: r.w.color }} /> {r.w.short}</span>
                    </td>
                    <td className="num small">{r.available}</td>
                    <td className="num small">{r.reserved ? <span className="text-orange bold">{r.reserved}</span> : 0}</td>
                    <td className="num small bold">{r.sellable}</td>
                    <td className="num small muted">{r.sold}</td>
                    <td className="num small">{r.threshold}</td>
                    <td>
                      {r.out ? <span className="badge badge-soft-red">Out of stock</span> : r.low ? <span className="badge badge-soft-amber">Low</span> : <span className="badge badge-soft-green">Healthy</span>}
                    </td>
                    {canEdit ? (
                      <td>
                        <div className="row gap-4">
                          <button className="icon-btn sm" title="Adjust stock" onClick={() => setAdjust({ ...r, delta: 10, thr: r.threshold })}>
                            <SlidersHorizontal size={15} />
                          </button>
                          {!admin.warehouseId || admin.warehouseId === r.w.id ? (
                            <button className="icon-btn sm" title="Transfer" onClick={() => setTransfer({ ...r, to: warehouses.find((w) => w.id !== r.w.id).id, qty: Math.min(5, Math.max(r.sellable, 0)) })}>
                              <ArrowRightLeft size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 ? <p className="xs muted center" style={{ padding: 12 }}>Showing first 200 rows — refine filters to see more.</p> : null}
          </div>
        </>
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
          {!moves.length ? <p className="small muted center" style={{ padding: 24 }}>No movements yet. Place an order on the storefront to see reserve → sale entries appear here.</p> : null}
        </div>
      ) : null}

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
                if (adjust.delta) adjustStock(adjust.p.id, adjust.w.id, Number(adjust.delta), admin.name, adjust.delta > 0 ? "Inward / GRN" : "Damage / shrinkage");
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
        {adjust ? (
          <div className="col gap-16">
            <div className="soft-panel small">
              Available <b>{adjust.available}</b> · Reserved <b>{adjust.reserved}</b> · Sellable <b>{adjust.sellable}</b>
            </div>
            <div className="field">
              <label>Change quantity (+ inward / − damage)</label>
              <div className="row">
                <button className="btn btn-outline" onClick={() => setAdjust({ ...adjust, delta: Number(adjust.delta) - 1 })}><Minus size={15} /></button>
                <input className="input" type="number" value={adjust.delta} onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} style={{ textAlign: "center" }} />
                <button className="btn btn-outline" onClick={() => setAdjust({ ...adjust, delta: Number(adjust.delta) + 1 })}><Plus size={15} /></button>
              </div>
              <span className="hint">New available: {Math.max(0, adjust.available + Number(adjust.delta || 0))}</span>
            </div>
            <div className="field">
              <label>Low-stock threshold</label>
              <input className="input" type="number" min={0} value={adjust.thr} onChange={(e) => setAdjust({ ...adjust, thr: e.target.value })} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!transfer}
        onClose={() => setTransfer(null)}
        title={`Transfer ${transfer?.p.sku}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setTransfer(null)}>Cancel</button>
            <button
              className="btn btn-blue"
              onClick={() => {
                const r = transferStock(transfer.p.id, transfer.w.id, transfer.to, Number(transfer.qty), admin.name);
                if (!r.ok) return toast.error(r.reason);
                toast(`Transfer ${r.ref} created`);
                setTransfer(null);
              }}
            >
              <ArrowRightLeft size={15} /> Transfer
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
                <label>Quantity (max {transfer.sellable} unreserved)</label>
                <input className="input" type="number" min={1} max={transfer.sellable} value={transfer.qty} onChange={(e) => setTransfer({ ...transfer, qty: e.target.value })} />
              </div>
            </div>
            <p className="xs muted">Creates a transfer-out and transfer-in movement pair in the audit log.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
