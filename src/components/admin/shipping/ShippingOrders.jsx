/*
 * Shipping → Orders. Same flow as the Shiprocket panel:
 * New → Ship now (pick courier) → Ready to ship → Schedule pickup → courier scans.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Download, FastForward, FileText, MapPin, Package, Printer, RotateCcw, Search, Truck, Undo2, Warehouse, X, Zap } from "lucide-react";
import { useStore } from "../../../lib/store";
import { couriers, getCourier, getWarehouse, warehouses } from "../../../data/logistics";
import { shipmentEta, shipmentStatus } from "../../../lib/orderModel";
import { BOXES, NDR_REASONS, SR_TABS, chargeableWeight, quoteForShipment, shipmentValue, srTab, volumetricWeight } from "../../../lib/shippingModel";
import {
  cancelShipmentAwb,
  changePickupWarehouse,
  generateManifest,
  markRtoReceived,
  ndrAction,
  schedulePickup,
  shipNow,
  simulateNextScan,
  updatePackage,
  useShippingSettings,
} from "../../../lib/services/shipping";
import { useNow } from "../../../lib/services/liveSync";
import { live } from "../../../lib/api";
import { cx, dayLabel, formatDateTime, formatINR } from "../../../lib/format";
import { toast } from "../../../lib/toast";
import { Drawer, Modal } from "../../common/ui";
import { ShipmentEvents, ShipmentProgress, InvoiceModal } from "../../order/OrderBits";
import { exportCsv } from "../AdminBits";
import { ManifestSheet, PrintModal, ShippingLabel, SrBadge } from "./ShipBits";

const canShip = (admin) => ["super_admin", "logistics", "warehouse_admin"].includes(admin.role);

export function useShipRows(admin, now) {
  const orders = useStore((s) => s.orders);
  return useMemo(
    () =>
      orders
        .filter((o) => !["pending_payment", "payment_failed"].includes(o.status))
        .flatMap((o) =>
          o.shipments.map((s) => {
            const st = s.cancelled ? "cancelled" : shipmentStatus(s, now);
            return { o, s, st, tab: srTab(st) };
          })
        )
        .filter((r) => !admin.warehouseId || r.s.warehouseId === admin.warehouseId)
        .sort((a, b) => (b.s.createdAt || 0) - (a.s.createdAt || 0)),
    [orders, now, admin]
  );
}

/* ---------- Ship now ---------- */

export function ShipNowModal({ row, onClose, admin }) {
  const settings = useShippingSettings();
  const [busy, setBusy] = useState(false);
  const [pkg, setPkg] = useState(row?.s.package || {});
  const [wh, setWh] = useState(row?.s.warehouseId);
  const draft = row ? { ...row.s, package: pkg, warehouseId: wh } : null;
  const q = row ? quoteForShipment(row.o, draft) : null;
  const [pick, setPick] = useState(null);
  if (!row) return null;
  const chosen = pick || q?.list?.[0]?.courierId;

  const confirm = async () => {
    setBusy(true);
    try {
      if (wh !== row.s.warehouseId) {
        const r = changePickupWarehouse(row.o.id, row.s.id, wh, admin.name);
        if (!r.ok) return toast.error(r.reason || r.error);
      }
      updatePackage(row.o.id, row.s.id, pkg);
      const r = await shipNow(row.o.id, row.s.id, { courierId: chosen, by: admin.name });
      if (!r.ok) return toast.error(r.error);
      toast(`AWB ${r.awb} assigned · ${r.courier}${settings.autoPickup ? " · pickup scheduled" : ""}`);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const setBox = (id) => {
    const b = BOXES.find((x) => x.id === id);
    setPkg({ ...pkg, boxId: id, l: b.l, b: b.b, h: b.h });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Ship now · ${row.o.id}`}
      size="wide"
      footer={
        <>
          <span className="small muted grow">
            {q?.ok ? `${q.zone.label} · ${q.km} km · chargeable ${q.weight} kg` : q?.reason}
          </span>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-blue" disabled={busy || !q?.ok} onClick={confirm}>
            <Zap size={15} /> {busy ? "Assigning AWB…" : "Ship now"}
          </button>
        </>
      }
    >
      <div className="sr-ship">
        <div className="col gap-12">
          <div className="soft-panel">
            <b className="small">Deliver to</b>
            <p className="small">{row.o.address.name} · {row.o.address.city} {row.o.address.pincode}</p>
            <p className="xs muted">{row.o.payment.method === "cod" ? `COD · collect ${formatINR(shipmentValue(row.o, row.s))}` : "Prepaid"} · {row.o.items.filter((i) => row.s.lineIds.includes(i.lineId)).length} item(s)</p>
          </div>
          <label className="small bold">Pickup warehouse</label>
          <select className="select" value={wh} onChange={(e) => setWh(e.target.value)} disabled={!!admin.warehouseId}>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}{w.id === row.s.warehouseId ? " (auto-allocated)" : ""}</option>
            ))}
          </select>
          <label className="small bold">Package</label>
          <div className="chips">
            {BOXES.map((b) => (
              <button key={b.id} className={cx("chip", pkg.boxId === b.id && "active-blue")} onClick={() => setBox(b.id)}>{b.name}</button>
            ))}
          </div>
          <div className="sr-dims">
            {[["weightKg", "Weight (kg)"], ["l", "L (cm)"], ["b", "B (cm)"], ["h", "H (cm)"]].map(([k, l]) => (
              <label key={k}>
                <span className="xs muted">{l}</span>
                <input className="input" type="number" min="0.1" step={k === "weightKg" ? 0.1 : 1} value={pkg[k] ?? ""} onChange={(e) => setPkg({ ...pkg, [k]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
          <p className="xs muted">
            Volumetric {volumetricWeight(pkg)} kg (L×B×H ÷ 5000) · billed on {chargeableWeight(pkg)} kg — the higher of dead and volumetric weight.
          </p>
        </div>
        <div className="col gap-8">
          <div className="row between">
            <b className="small">Select courier</b>
            <span className="xs muted">Rule: {settings.courierRule.replace("_", " ")}{live("shiprocket") ? " · live rates" : " · demo rate card"}</span>
          </div>
          {q?.ok ? (
            q.list.map((c) => (
              <label key={c.courierId} className={cx("sr-courier", chosen === c.courierId && "on")}>
                <input type="radio" name="courier" checked={chosen === c.courierId} onChange={() => setPick(c.courierId)} />
                <div className="grow">
                  <div className="row gap-6 wrap">
                    <b>{c.name}</b>
                    {c.tags.map((t) => (
                      <span key={t} className={cx("badge", t === "Recommended" ? "badge-soft-blue" : t === "Cheapest" ? "badge-soft-green" : t === "Fastest" ? "badge-soft-orange" : "badge-soft-purple")}>{t}</span>
                    ))}
                  </div>
                  <span className="xs muted">★ {c.rating} · delivers in {c.days} day{c.days > 1 ? "s" : ""} · pickup {c.pickupBy}{c.express ? " · air" : " · surface"}</span>
                </div>
                <div className="right">
                  <b>{formatINR(c.total)}</b>
                  <span className="xs muted" style={{ display: "block" }}>{c.codCharge ? `incl. COD ${formatINR(c.codCharge)}` : "freight"}</span>
                </div>
              </label>
            ))
          ) : (
            <div className="notice error">{q?.reason}</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- NDR action ---------- */

export function NdrModal({ row, onClose, admin }) {
  const settings = useShippingSettings();
  const [mode, setMode] = useState("reattempt");
  const [f, setF] = useState({ date: "", phone: "", line1: "", landmark: "", note: "" });
  if (!row) return null;
  const lastFail = [...(row.s.plan || []), ...(row.s.manualEvents || [])].filter((e) => e.status === "delivery_failed").sort((a, b) => b.at - a.at)[0];
  const submit = async () => {
    const r = await ndrAction(row.o.id, row.s.id, { action: mode, by: admin.name, ...f });
    if (!r.ok) return toast.error(r.error);
    toast(mode === "rto" ? "Return to origin initiated" : "Re-attempt requested with courier");
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`NDR · AWB ${row.s.awb}`}
      size="mid"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className={cx("btn", mode === "rto" ? "btn-red" : "btn-blue")} onClick={submit}>{mode === "rto" ? "Return to origin" : "Request re-attempt"}</button>
        </>
      }
    >
      <div className="col gap-12">
        <div className="notice warn">
          <b>{lastFail?.note || "Delivery failed"}</b> · attempt {row.s.attempts || 1} of {settings.ndrMaxAttempts + 1} · {lastFail ? formatDateTime(lastFail.at) : ""}
        </div>
        {row.s.ndr?.history?.length ? (
          <div className="soft-panel xs">
            {row.s.ndr.history.map((h) => (
              <div key={h.at}>{formatDateTime(h.at)} · <b>{h.by}</b>: {h.action}{h.date ? ` on ${h.date}` : ""}{h.phone ? ` · phone ${h.phone}` : ""}{h.line1 ? ` · ${h.line1}` : ""}</div>
            ))}
          </div>
        ) : (
          <p className="xs muted">No customer response yet — the customer received an SMS/WhatsApp link to reschedule or update their address.</p>
        )}
        <div className="seg">
          {[["reattempt", "Re-attempt"], ["update", "Update address / phone"], ["rto", "Return to origin"]].map(([k, l]) => (
            <button key={k} className={cx(mode === k && "active")} onClick={() => setMode(k)}>{l}</button>
          ))}
        </div>
        {mode !== "rto" ? (
          <label className="col gap-4">
            <span className="small bold">Re-attempt date</span>
            <input className="input" type="date" value={f.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </label>
        ) : null}
        {mode === "update" ? (
          <div className="grid grid-2">
            <input className="input" placeholder="Alternate phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className="input" placeholder="Landmark" value={f.landmark} onChange={(e) => setF({ ...f, landmark: e.target.value })} />
            <input className="input" style={{ gridColumn: "1 / -1" }} placeholder="Corrected address line" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} />
          </div>
        ) : null}
        <input className="input" placeholder="Note for courier (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </div>
    </Modal>
  );
}

/* ---------- detail drawer ---------- */

function ShipmentDrawer({ row, onClose, admin, now, onShip, onNdr, onLabel }) {
  const [invoice, setInvoice] = useState(false);
  if (!row) return null;
  const { o, s, st } = row;
  const wh = getWarehouse(s.warehouseId);
  const isDemo = s.provider !== "shiprocket-live";
  const next = s.plan?.find((e) => e.at > now);
  return (
    <Drawer open onClose={onClose} width={560}>
      <div className="adm-drawer">
        <div className="adm-drawer-head">
          <div>
            <b>{s.awb ? `AWB ${s.awb}` : `Shipment ${s.id}`}</b>
            <div className="xs muted">{o.id} · {formatDateTime(o.createdAt)}</div>
          </div>
          <div className="row gap-6">
            <SrBadge status={st} />
            <button className="icon-btn sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <div className="adm-drawer-body">
          {s.awb ? <ShipmentProgress shipment={s} now={now} /> : null}
          <div className="kv">
            <span>Customer</span><b>{o.address.name} · {o.address.phone}</b>
            <span>Deliver to</span><b>{o.address.line1}, {o.address.city} {o.address.pincode}</b>
            <span>Pickup</span><b>{wh.name}</b>
            <span>Courier</span><b>{s.awb ? s.liveCourier || getCourier(s.courierId)?.name : `Suggested: ${getCourier(s.courierId)?.name}`}</b>
            <span>Payment</span><b>{o.payment.method === "cod" ? `COD · ${formatINR(shipmentValue(o, s))}` : `Prepaid · ${formatINR(shipmentValue(o, s))}`}</b>
            <span>Package</span><b>{s.package?.weightKg || "—"} kg · {s.package?.l}×{s.package?.b}×{s.package?.h} cm · chargeable {chargeableWeight(s.package || {})} kg</b>
            {s.charges ? (<><span>Shipping cost</span><b>{formatINR(s.charges.total)} (freight {formatINR(s.charges.freight)}{s.charges.cod ? ` + COD ${formatINR(s.charges.cod)}` : ""}) · Zone {s.charges.zone}</b></>) : null}
            <span>Expected delivery</span><b>{dayLabel(shipmentEta(s))}</b>
            {s.manifestId ? (<><span>Manifest</span><b>{s.manifestId}</b></>) : null}
            {s.shippedBy ? (<><span>Shipped by</span><b>{s.shippedBy}</b></>) : null}
          </div>
          {canShip(admin) || admin.role === "support" ? (
            <div className="row gap-6 wrap">
              {st === "new" && canShip(admin) ? <button className="btn btn-sm btn-blue" onClick={() => onShip(row)}><Zap size={14} /> Ship now</button> : null}
              {st === "awb_assigned" && canShip(admin) ? <button className="btn btn-sm btn-blue" onClick={async () => { const r = await schedulePickup(o.id, s.id, { by: admin.name }); r.ok ? toast("Pickup scheduled") : toast.error(r.error); }}><Truck size={14} /> Schedule pickup</button> : null}
              {s.awb ? <button className="btn btn-sm btn-outline" onClick={() => onLabel(row)}><Printer size={14} /> Label</button> : null}
              <button className="btn btn-sm btn-outline" onClick={() => setInvoice(true)}><FileText size={14} /> Invoice</button>
              {st === "delivery_failed" ? <button className="btn btn-sm btn-red" onClick={() => onNdr(row)}><AlertTriangle size={14} /> Take NDR action</button> : null}
              {st === "rto_delivered" && canShip(admin) ? <button className="btn btn-sm btn-blue" onClick={() => { const r = markRtoReceived(o.id, s.id, admin.name); r.ok ? toast(`Restocked${r.refund ? ` · refund ${formatINR(r.refund)} initiated` : ""}`) : toast.error(r.error); }}><Undo2 size={14} /> Mark received & restock</button> : null}
              {["awb_assigned", "pickup_scheduled"].includes(st) && canShip(admin) ? <button className="btn btn-sm btn-outline" onClick={async () => { const r = await cancelShipmentAwb(o.id, s.id, admin.name); r.ok ? toast("AWB cancelled · moved back to New") : toast.error(r.error); }}><RotateCcw size={14} /> Cancel shipment</button> : null}
            </div>
          ) : null}
          {isDemo && next && s.awb && canShip(admin) ? (
            <div className="sr-demo">
              <span className="xs">
                <b>Demo mode:</b> courier scans arrive every few minutes. Next: <b>{next.note}</b> at {formatDateTime(next.at)}.
              </span>
              <button className="btn btn-xs btn-soft" onClick={() => { simulateNextScan(o.id, s.id); toast("Next courier scan simulated"); }}>
                <FastForward size={12} /> Simulate next scan
              </button>
            </div>
          ) : null}
          <div>
            <b className="small">Tracking history</b>
            <div className="mt-8">
              <ShipmentEvents shipment={s} now={now} city={o.address.city} />
            </div>
          </div>
        </div>
      </div>
      <InvoiceModal order={o} open={invoice} onClose={() => setInvoice(false)} />
    </Drawer>
  );
}

/* ---------- page ---------- */

export default function ShippingOrders({ admin }) {
  const now = useNow(5000);
  const rows = useShipRows(admin, now);
  const orders = useStore((s) => s.orders);
  const [tab, setTab] = useState("new");
  const [q, setQ] = useState("");
  const [f, setF] = useState({ wh: "all", courier: "all", pay: "all" });
  const [sel, setSel] = useState([]);
  const [open, setOpen] = useState(null);
  const [ship, setShip] = useState(null);
  const [ndr, setNdr] = useState(null);
  const [labels, setLabels] = useState(null);
  const [manifest, setManifest] = useState(null);

  const counts = rows.reduce((m, r) => ({ ...m, [r.tab]: (m[r.tab] || 0) + 1 }), { all: rows.length });
  const list = rows.filter(
    (r) =>
      (tab === "all" || r.tab === tab) &&
      (f.wh === "all" || r.s.warehouseId === f.wh) &&
      (f.courier === "all" || r.s.courierId === f.courier) &&
      (f.pay === "all" || (f.pay === "cod") === (r.o.payment.method === "cod")) &&
      (!q || `${r.s.awb || ""} ${r.o.id} ${r.o.customer} ${r.o.address.phone} ${r.o.address.pincode}`.toLowerCase().includes(q.toLowerCase()))
  );
  const key = (r) => `${r.o.id}|${r.s.id}`;
  const selected = list.filter((r) => sel.includes(key(r)));
  const find = (k) => rows.find((r) => key(r) === k);
  const openRow = open ? find(open) : null;

  const bulkShip = async () => {
    let ok = 0;
    for (const r of selected.filter((x) => x.st === "new")) {
      const res = await shipNow(r.o.id, r.s.id, { by: admin.name });
      if (res.ok) ok += 1;
      else toast.error(`${r.o.id}: ${res.error}`);
    }
    if (ok) toast(`${ok} shipment(s) shipped with the ${"auto"} courier rule`);
    setSel([]);
  };
  const bulkPickup = async () => {
    let ok = 0;
    for (const r of selected.filter((x) => x.st === "awb_assigned")) if ((await schedulePickup(r.o.id, r.s.id, { by: admin.name })).ok) ok += 1;
    toast(ok ? `Pickup scheduled for ${ok} shipment(s)` : "Select shipments in Ready to ship");
    setSel([]);
  };
  const bulkManifest = () => {
    const eligible = selected.filter((r) => r.s.awb && ["awb_assigned", "pickup_scheduled"].includes(r.st));
    if (!eligible.length) return toast.error("Select shipments that are ready or scheduled for pickup");
    const byWh = eligible.reduce((m, r) => ({ ...m, [r.s.warehouseId]: [...(m[r.s.warehouseId] || []), { orderId: r.o.id, shipmentId: r.s.id }] }), {});
    const made = Object.entries(byWh).map(([w, refs]) => generateManifest(w, refs, admin.name));
    setManifest(made[0]);
    toast(`${made.length} manifest(s) generated`);
    setSel([]);
  };

  const action = (r) => {
    if (r.st === "new") return canShip(admin) ? <button className="btn btn-xs btn-blue" onClick={(e) => { e.stopPropagation(); setShip(r); }}>Ship now</button> : null;
    if (r.st === "awb_assigned") return canShip(admin) ? <button className="btn btn-xs btn-blue" onClick={async (e) => { e.stopPropagation(); const x = await schedulePickup(r.o.id, r.s.id, { by: admin.name }); x.ok ? toast("Pickup scheduled") : toast.error(x.error); }}>Schedule pickup</button> : null;
    if (r.st === "pickup_scheduled") return <button className="btn btn-xs btn-outline" onClick={(e) => { e.stopPropagation(); setLabels([r]); }}>Label</button>;
    if (r.st === "delivery_failed") return <button className="btn btn-xs btn-red" onClick={(e) => { e.stopPropagation(); setNdr(r); }}>Take action</button>;
    if (r.st === "rto_delivered") return canShip(admin) ? <button className="btn btn-xs btn-blue" onClick={(e) => { e.stopPropagation(); const x = markRtoReceived(r.o.id, r.s.id, admin.name); x.ok ? toast("Received & restocked") : toast.error(x.error); }}>Mark received</button> : null;
    return <button className="btn btn-xs btn-outline" onClick={(e) => { e.stopPropagation(); setOpen(key(r)); }}>Track</button>;
  };

  return (
    <div className="col gap-12">
      <div className="sr-tabs">
        {SR_TABS.map(([id, l]) => (
          <button key={id} className={cx("sr-tab", tab === id && "active", id === "ndr" && counts.ndr && "alert")} onClick={() => { setTab(id); setSel([]); }}>
            {l} <span>{counts[id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <div className="input-group" style={{ flex: 1, minWidth: 220 }}>
          <span className="addon"><Search size={15} /></span>
          <input className="input" placeholder="AWB, order ID, customer, phone or pincode" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!admin.warehouseId ? (
          <select className="select" style={{ width: "auto" }} value={f.wh} onChange={(e) => setF({ ...f, wh: e.target.value })}>
            <option value="all">All pickup addresses</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.short}</option>)}
          </select>
        ) : null}
        <select className="select" style={{ width: "auto" }} value={f.courier} onChange={(e) => setF({ ...f, courier: e.target.value })}>
          <option value="all">All couriers</option>
          {couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value })}>
          <option value="all">COD & prepaid</option>
          <option value="cod">COD</option>
          <option value="prepaid">Prepaid</option>
        </select>
        <button className="btn btn-sm btn-outline" onClick={() => exportCsv(`shipping-${tab}.csv`, list.map((r) => ({ order: r.o.id, shipment: r.s.id, awb: r.s.awb || "", status: r.st, warehouse: getWarehouse(r.s.warehouseId).short, courier: getCourier(r.s.courierId)?.name, payment: r.o.payment.method, value: shipmentValue(r.o, r.s), city: r.o.address.city, pincode: r.o.address.pincode, weightKg: r.s.package?.weightKg || "", cost: r.s.charges?.total || "" })))}>
          <Download size={14} /> Export
        </button>
      </div>

      {selected.length ? (
        <div className="sr-bulk">
          <b className="small">{selected.length} selected</b>
          {canShip(admin) ? <button className="btn btn-xs btn-blue" onClick={bulkShip}><Zap size={12} /> Ship selected</button> : null}
          {canShip(admin) ? <button className="btn btn-xs btn-soft" onClick={bulkPickup}><Truck size={12} /> Schedule pickup</button> : null}
          <button className="btn btn-xs btn-soft" onClick={() => { const l = selected.filter((r) => r.s.awb); l.length ? setLabels(l) : toast.error("Selected shipments have no AWB yet"); }}><Printer size={12} /> Print labels</button>
          {canShip(admin) ? <button className="btn btn-xs btn-soft" onClick={bulkManifest}><FileText size={12} /> Generate manifest</button> : null}
          <button className="btn btn-xs btn-ghost" onClick={() => setSel([])}>Clear</button>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="table sr-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>
                <input type="checkbox" checked={!!list.length && selected.length === list.length} onChange={(e) => setSel(e.target.checked ? list.map(key) : [])} aria-label="Select all" />
              </th>
              <th>Order details</th>
              <th>Product</th>
              <th>Package</th>
              <th>Payment</th>
              <th>Pickup address</th>
              <th>Shipping details</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const items = r.o.items.filter((i) => r.s.lineIds.includes(i.lineId));
              const wh = getWarehouse(r.s.warehouseId);
              const k = key(r);
              return (
                <tr key={k} className={cx("clickable", open === k && "selected")} onClick={() => setOpen(k)}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.includes(k)} onChange={(e) => setSel(e.target.checked ? [...sel, k] : sel.filter((x) => x !== k))} aria-label="Select" />
                  </td>
                  <td>
                    <b className="small">{r.o.id}</b>
                    <div className="xs muted">{formatDateTime(r.o.createdAt)}</div>
                    <div className="xs">{r.o.customer}</div>
                  </td>
                  <td className="xs">
                    {items[0]?.name}{items[0]?.size ? ` (${items[0].size})` : ""} × {items[0]?.qty}
                    {items.length > 1 ? <div className="muted">+{items.length - 1} more</div> : null}
                  </td>
                  <td className="xs">
                    {r.s.package?.weightKg ?? "—"} kg
                    <div className="muted">{r.s.package?.l}×{r.s.package?.b}×{r.s.package?.h} cm</div>
                  </td>
                  <td className="xs">
                    <b>{formatINR(shipmentValue(r.o, r.s))}</b>
                    <div><span className={cx("badge", r.o.payment.method === "cod" ? "badge-soft-amber" : "badge-soft-green")}>{r.o.payment.method === "cod" ? "COD" : "Prepaid"}</span></div>
                  </td>
                  <td className="xs">
                    <span className="row gap-4"><i className="wh-dot" style={{ background: wh.color }} /> {wh.short}</span>
                    <span className="muted">→ {r.o.address.city} {r.o.address.pincode}</span>
                  </td>
                  <td className="xs">
                    {r.s.awb ? (
                      <>
                        <b>{r.s.liveCourier || getCourier(r.s.courierId)?.name}</b>
                        <div className="muted">AWB {r.s.awb}</div>
                      </>
                    ) : (
                      <span className="muted">Suggested: {getCourier(r.s.courierId)?.name}</span>
                    )}
                  </td>
                  <td><SrBadge status={r.st} /></td>
                  <td onClick={(e) => e.stopPropagation()}>{action(r)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length ? (
          <div className="center" style={{ padding: 32 }}>
            <Package size={28} className="muted" />
            <p className="small muted mt-8">No shipments in this tab.</p>
          </div>
        ) : null}
      </div>

      <p className="xs muted row gap-6">
        <MapPin size={12} /> Warehouse is auto-allocated (stock → distance → delivery time → courier coverage). Change it before shipping from <b>Ship now</b>.
        <Warehouse size={12} /> Statuses after pickup come from courier scans only.
      </p>

      <ShipmentDrawer row={openRow} onClose={() => setOpen(null)} admin={admin} now={now} onShip={(r) => { setOpen(null); setShip(r); }} onNdr={(r) => { setOpen(null); setNdr(r); }} onLabel={(r) => { setOpen(null); setLabels([r]); }} />
      {ship ? <ShipNowModal row={find(key(ship))} admin={admin} onClose={() => setShip(null)} /> : null}
      {ndr ? <NdrModal row={find(key(ndr))} admin={admin} onClose={() => setNdr(null)} /> : null}
      <PrintModal open={!!labels} onClose={() => setLabels(null)} title={`Shipping label${labels?.length > 1 ? `s (${labels.length})` : ""}`}>
        {labels?.map((r) => <ShippingLabel key={key(r)} order={r.o} shipment={find(key(r))?.s || r.s} />)}
      </PrintModal>
      <PrintModal open={!!manifest} onClose={() => setManifest(null)} title="Pickup manifest">
        {manifest ? <ManifestSheet manifest={manifest} orders={orders} /> : null}
      </PrintModal>
    </div>
  );
}

export { NDR_REASONS };
