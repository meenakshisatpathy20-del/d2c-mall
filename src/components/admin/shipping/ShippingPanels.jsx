/*
 * Shipping console panels: NDR, RTO, COD remittance, manifests,
 * rate calculator, reports and settings.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Banknote, CalendarClock, CheckCircle2, Clock, Download, FileText, IndianRupee, Percent, RotateCcw, Truck, Undo2 } from "lucide-react";
import { useStore } from "../../../lib/store";
import { couriers, getCourier, getWarehouse, warehouses } from "../../../data/logistics";
import { shipmentEta, shipmentEvents } from "../../../lib/orderModel";
import { BOXES, NDR_REASONS, chargeableWeight, quoteCouriers, remittanceRows, shipmentValue, volumetricWeight } from "../../../lib/shippingModel";
import { markRtoReceived, updateShippingSettings, useManifests, useShippingSettings } from "../../../lib/services/shipping";
import { useNow } from "../../../lib/services/liveSync";
import { cx, dayLabel, formatDate, formatDateTime, formatINR } from "../../../lib/format";
import { toast } from "../../../lib/toast";
import { Switch } from "../../common/ui";
import { HBars, Kpi, exportCsv } from "../AdminBits";
import { ManifestSheet, PrintModal, SrBadge } from "./ShipBits";
import { NdrModal, useShipRows } from "./ShippingOrders";

/* ---------- NDR ---------- */

export function NdrPanel({ admin }) {
  const now = useNow(5000);
  const rows = useShipRows(admin, now);
  const [open, setOpen] = useState(null);
  const ndr = rows.filter((r) => r.st === "delivery_failed");
  const history = rows.filter((r) => r.s.ndr?.history?.length);
  const reasons = NDR_REASONS.map((label) => ({ label, value: rows.filter((r) => shipmentEvents(r.s, now).some((e) => e.status === "delivery_failed" && e.note === label)).length })).filter((x) => x.value);
  const customerReplied = (r) => r.s.ndr?.history?.some((h) => h.by === "customer");
  const key = (r) => `${r.o.id}|${r.s.id}`;
  return (
    <div className="col gap-16">
      <div className="adm-kpis">
        <Kpi icon={AlertTriangle} label="Action required" value={ndr.length} tone="red" delta="Failed deliveries" />
        <Kpi icon={CheckCircle2} label="Customer responded" value={ndr.filter(customerReplied).length} tone="green" />
        <Kpi icon={RotateCcw} label="Re-attempts requested" value={history.reduce((t, r) => t + r.s.ndr.history.filter((h) => h.action !== "rto").length, 0)} tone="blue" />
        <Kpi icon={Undo2} label="Moved to RTO" value={history.filter((r) => r.s.ndr.history.some((h) => h.action === "rto")).length} tone="amber" />
      </div>
      <div className="adm-grid-2">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>AWB / order</th><th>Customer</th><th>Reason</th><th>Attempts</th><th>Customer response</th><th /></tr>
            </thead>
            <tbody>
              {ndr.map((r) => {
                const fail = shipmentEvents(r.s, now).filter((e) => e.status === "delivery_failed").slice(-1)[0];
                const resp = r.s.ndr?.history?.filter((h) => h.by === "customer").slice(-1)[0];
                return (
                  <tr key={key(r)}>
                    <td><b className="small">{r.s.awb}</b><div className="xs muted">{r.o.id} · {getCourier(r.s.courierId)?.name}</div></td>
                    <td className="xs">{r.o.address.name}<div className="muted">{r.o.address.phone} · {r.o.address.city}</div></td>
                    <td className="xs">{fail?.note}<div className="muted">{fail ? formatDateTime(fail.at) : ""}</div></td>
                    <td className="xs">{r.s.attempts || 1}</td>
                    <td className="xs">{resp ? <span className="badge badge-soft-green">{resp.action}{resp.date ? ` · ${resp.date}` : ""}</span> : <span className="muted">Awaiting</span>}</td>
                    <td><button className="btn btn-xs btn-red" onClick={() => setOpen(key(r))}>Take action</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!ndr.length ? <p className="small muted center" style={{ padding: 24 }}>No failed deliveries need action. 🎉</p> : null}
        </div>
        <div className="col gap-16">
          <div className="card card-pad">
            <b>NDR reasons</b>
            <div className="mt-12">{reasons.length ? <HBars rows={reasons} /> : <p className="xs muted">No failed deliveries recorded yet.</p>}</div>
          </div>
          <div className="card card-pad">
            <b>How NDR works</b>
            <ol className="small sr-steps">
              <li>Courier can't deliver → shipment moves to <b>NDR</b> and the customer gets an SMS/WhatsApp link.</li>
              <li>Customer picks a new date or fixes the address/phone on the tracking page — or staff act here.</li>
              <li>Courier re-attempts. After the maximum attempts (Settings), the parcel goes back as <b>RTO</b>.</li>
            </ol>
          </div>
        </div>
      </div>
      {open ? <NdrModal row={rows.find((r) => key(r) === open)} admin={admin} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

/* ---------- RTO ---------- */

export function RtoPanel({ admin }) {
  const now = useNow(5000);
  const rows = useShipRows(admin, now).filter((r) => r.st.startsWith("rto"));
  const value = rows.reduce((t, r) => t + shipmentValue(r.o, r.s), 0);
  return (
    <div className="col gap-16">
      <div className="adm-kpis">
        <Kpi icon={Truck} label="RTO in transit" value={rows.filter((r) => ["rto_initiated", "rto_in_transit"].includes(r.st)).length} tone="amber" />
        <Kpi icon={Undo2} label="Back at warehouse" value={rows.filter((r) => r.st === "rto_delivered").length} tone="red" delta="Confirm & restock" />
        <Kpi icon={CheckCircle2} label="Restocked" value={rows.filter((r) => r.st === "rto_received").length} tone="green" />
        <Kpi icon={IndianRupee} label="Value in RTO" value={formatINR(value)} tone="purple" />
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>AWB / order</th><th>Returning to</th><th>Reason</th><th>Value</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const why = r.s.ndr?.history?.find((h) => h.action === "rto");
              return (
                <tr key={r.s.id}>
                  <td><b className="small">{r.s.awb}</b><div className="xs muted">{r.o.id}</div></td>
                  <td className="xs">{getWarehouse(r.s.warehouseId).name}</td>
                  <td className="xs">{why ? `${why.by}${why.note ? ` · ${why.note}` : ""}` : "Undelivered"}</td>
                  <td className="xs">{formatINR(shipmentValue(r.o, r.s))} · {r.o.payment.method === "cod" ? "COD" : "Prepaid (refund on receipt)"}</td>
                  <td><SrBadge status={r.st} /></td>
                  <td>
                    {r.st === "rto_delivered" ? (
                      <button className="btn btn-xs btn-blue" onClick={() => { const x = markRtoReceived(r.o.id, r.s.id, admin.name); x.ok ? toast(`Restocked${x.refund ? ` · refund ${formatINR(x.refund)} initiated` : ""}`) : toast.error(x.error); }}>Mark received & restock</button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length ? <p className="small muted center" style={{ padding: 24 }}>No RTO shipments.</p> : null}
      </div>
    </div>
  );
}

/* ---------- COD remittance ---------- */

export function RemittancePanel({ admin }) {
  const now = useNow(10000);
  const settings = useShippingSettings();
  const orders = useStore((s) => s.orders);
  const scoped = admin.warehouseId ? orders.map((o) => ({ ...o, shipments: o.shipments.filter((s) => s.warehouseId === admin.warehouseId) })) : orders;
  const rows = remittanceRows(scoped, now, settings.remittanceCycleDays, shipmentEvents);
  const pending = rows.filter((r) => r.status === "pending");
  const remitted = rows.filter((r) => r.status === "remitted");
  const nextDue = pending.length ? Math.min(...pending.map((r) => r.dueAt)) : null;
  const [f, setF] = useState("all");
  const list = rows.filter((r) => f === "all" || r.status === f);
  return (
    <div className="col gap-16">
      <div className="adm-kpis">
        <Kpi icon={Banknote} label="COD to be remitted" value={formatINR(pending.reduce((t, r) => t + r.amount, 0))} tone="amber" delta={`${pending.length} shipments`} />
        <Kpi icon={CalendarClock} label="Next remittance" value={nextDue ? formatDate(nextDue, { year: false }) : "—"} tone="blue" delta={`Cycle: delivery + ${settings.remittanceCycleDays} days`} />
        <Kpi icon={CheckCircle2} label="Remitted (total)" value={formatINR(remitted.reduce((t, r) => t + r.amount, 0))} tone="green" delta={`${remitted.length} shipments`} />
        <Kpi icon={IndianRupee} label="COD delivered" value={rows.length} tone="purple" />
      </div>
      <div className="adm-toolbar">
        <div className="seg">
          {[["all", "All"], ["pending", "Pending"], ["remitted", "Remitted"]].map(([k, l]) => (
            <button key={k} className={cx(f === k && "active")} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <span className="grow" />
        <button className="btn btn-sm btn-outline" onClick={() => exportCsv("cod-remittance.csv", list.map((r) => ({ order: r.orderId, awb: r.awb, courier: getCourier(r.courierId)?.name, delivered: new Date(r.deliveredAt).toISOString(), amount: r.amount, due: new Date(r.dueAt).toISOString(), status: r.status, utr: r.utr || "" })))}>
          <Download size={14} /> Export
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Order / AWB</th><th>Courier</th><th>Delivered</th><th>COD amount</th><th>Remittance date</th><th>Status</th><th>UTR / bank ref</th></tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.shipmentId}>
                <td><b className="small">{r.orderId}</b><div className="xs muted">{r.awb}</div></td>
                <td className="xs">{getCourier(r.courierId)?.name}</td>
                <td className="xs">{formatDate(r.deliveredAt)}</td>
                <td><b>{formatINR(r.amount)}</b></td>
                <td className="xs">{formatDate(r.dueAt)}</td>
                <td><span className={cx("badge", r.status === "remitted" ? "badge-soft-green" : "badge-soft-amber")}>{r.status === "remitted" ? "Remitted" : "Pending"}</span></td>
                <td className="xs">{r.utr || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length ? <p className="small muted center" style={{ padding: 24 }}>No COD shipments delivered yet.</p> : null}
      </div>
      <p className="xs muted">In live mode, remittance dates and UTRs come from Shiprocket's COD remittance reports; the cycle here is configurable in Settings.</p>
    </div>
  );
}

/* ---------- manifests ---------- */

export function ManifestPanel({ admin }) {
  const manifests = useManifests().filter((m) => !admin.warehouseId || m.warehouseId === admin.warehouseId);
  const orders = useStore((s) => s.orders);
  const [open, setOpen] = useState(null);
  return (
    <div className="col gap-12">
      <p className="small muted">Select shipments in <b>Ready to ship</b> or <b>Pickup scheduled</b> and click <b>Generate manifest</b>. The courier executive signs the printed manifest at pickup.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Manifest</th><th>Warehouse</th><th>Parcels</th><th>Created</th><th>By</th><th /></tr></thead>
          <tbody>
            {manifests.map((m) => (
              <tr key={m.id}>
                <td><b className="small">{m.id}</b></td>
                <td className="xs">{getWarehouse(m.warehouseId).short}</td>
                <td className="xs">{m.refs.length}</td>
                <td className="xs">{formatDateTime(m.createdAt)}</td>
                <td className="xs">{m.by}</td>
                <td><button className="btn btn-xs btn-outline" onClick={() => setOpen(m)}><FileText size={12} /> View / print</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!manifests.length ? <p className="small muted center" style={{ padding: 24 }}>No manifests yet.</p> : null}
      </div>
      <PrintModal open={!!open} onClose={() => setOpen(null)} title="Pickup manifest">
        {open ? <ManifestSheet manifest={open} orders={orders} /> : null}
      </PrintModal>
    </div>
  );
}

/* ---------- rate calculator (also used on the storefront) ---------- */

export function RateCalculator({ compact, defaultFrom = "421302" }) {
  const [f, setF] = useState({ from: defaultFrom, to: "", weightKg: 0.5, l: 30, b: 25, h: 10, cod: false, value: 999 });
  const [res, setRes] = useState(null);
  const calc = (e) => {
    e?.preventDefault();
    setRes(quoteCouriers({ fromPin: f.from, toPin: f.to, pkg: f, cod: f.cod, value: Number(f.value) || 0 }));
  };
  return (
    <div className="col gap-12">
      <form className="sr-calc" onSubmit={calc}>
        {!compact ? (
          <label><span className="xs muted">Pickup pincode</span>
            <select className="select" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })}>
              {warehouses.map((w) => <option key={w.id} value={w.pincode}>{w.short} · {w.pincode}</option>)}
            </select>
          </label>
        ) : null}
        <label><span className="xs muted">Delivery pincode</span><input className="input" inputMode="numeric" maxLength={6} placeholder="e.g. 831001" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value.replace(/\D/g, "") })} required /></label>
        <label><span className="xs muted">Weight (kg)</span><input className="input" type="number" step="0.1" min="0.1" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: Number(e.target.value) })} /></label>
        {!compact ? (
          <label><span className="xs muted">Box</span>
            <select className="select" onChange={(e) => { const b = BOXES.find((x) => x.id === e.target.value); setF({ ...f, l: b.l, b: b.b, h: b.h }); }} defaultValue="M">
              {BOXES.map((b) => <option key={b.id} value={b.id}>{b.name} · {b.l}×{b.b}×{b.h}</option>)}
            </select>
          </label>
        ) : null}
        <label><span className="xs muted">Payment</span>
          <select className="select" value={f.cod ? "cod" : "prepaid"} onChange={(e) => setF({ ...f, cod: e.target.value === "cod" })}>
            <option value="prepaid">Prepaid</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </label>
        {f.cod ? <label><span className="xs muted">Order value (₹)</span><input className="input" type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label> : null}
        <button className="btn btn-blue">Calculate</button>
      </form>
      {res && !res.ok ? <div className="notice error">{res.reason}</div> : null}
      {res?.ok ? (
        <>
          <p className="xs muted">{res.zone.label} · {res.km} km · chargeable weight {res.weight} kg (volumetric {volumetricWeight(f)} kg)</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Courier</th><th>Delivery</th><th>Freight</th>{f.cod ? <th>COD charge</th> : null}<th>Total</th><th /></tr></thead>
              <tbody>
                {res.list.map((c) => (
                  <tr key={c.courierId}>
                    <td><b className="small">{c.name}</b><div className="xs muted">★ {c.rating}</div></td>
                    <td className="xs">{c.days} day{c.days > 1 ? "s" : ""}</td>
                    <td className="xs">{formatINR(c.freight)}</td>
                    {f.cod ? <td className="xs">{formatINR(c.codCharge)}</td> : null}
                    <td><b>{formatINR(c.total)}</b></td>
                    <td className="xs">{c.tags.map((t) => <span key={t} className="badge badge-soft-blue" style={{ marginRight: 4 }}>{t}</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ---------- reports ---------- */

export function ReportsPanel({ admin }) {
  const now = useNow(15000);
  const rows = useShipRows(admin, now).filter((r) => r.s.awb && !r.s.cancelled);
  const stats = useMemo(() => {
    const delivered = rows.filter((r) => r.st === "delivered");
    const onTime = delivered.filter((r) => (shipmentEvents(r.s, now).find((e) => e.status === "delivered")?.at || 0) <= shipmentEta(r.s) + 3600000);
    const ndrEver = rows.filter((r) => shipmentEvents(r.s, now).some((e) => e.status === "delivery_failed"));
    const rto = rows.filter((r) => r.st.startsWith("rto"));
    const cost = rows.filter((r) => r.s.charges).map((r) => r.s.charges.total);
    const perCourier = couriers.map((c) => {
      const mine = rows.filter((r) => r.s.courierId === c.id);
      const d = mine.filter((r) => r.st === "delivered");
      return {
        c,
        total: mine.length,
        delivered: d.length,
        ndr: mine.filter((r) => shipmentEvents(r.s, now).some((e) => e.status === "delivery_failed")).length,
        rto: mine.filter((r) => r.st.startsWith("rto")).length,
        onTime: d.length ? Math.round((d.filter((r) => (shipmentEvents(r.s, now).find((e) => e.status === "delivered")?.at || 0) <= shipmentEta(r.s) + 3600000).length / d.length) * 100) : null,
      };
    }).filter((x) => x.total);
    const zones = ["A", "B", "C", "D", "E"].map((z) => ({ label: `Zone ${z}`, value: rows.filter((r) => r.s.charges?.zone === z).length })).filter((x) => x.value);
    return { delivered, onTime, ndrEver, rto, cost, perCourier, zones };
  }, [rows, now]);
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  return (
    <div className="col gap-16">
      <div className="adm-kpis">
        <Kpi icon={Truck} label="Shipments" value={rows.length} tone="blue" />
        <Kpi icon={CheckCircle2} label="Delivered" value={stats.delivered.length} tone="green" />
        <Kpi icon={Clock} label="On-time delivery" value={pct(stats.onTime.length, stats.delivered.length)} tone="purple" />
        <Kpi icon={AlertTriangle} label="NDR rate" value={pct(stats.ndrEver.length, rows.length)} tone="amber" />
        <Kpi icon={Undo2} label="RTO rate" value={pct(stats.rto.length, rows.length)} tone="red" />
        <Kpi icon={Percent} label="Avg shipping cost" value={stats.cost.length ? formatINR(Math.round(stats.cost.reduce((t, x) => t + x, 0) / stats.cost.length)) : "—"} tone="orange" delta="per shipment" />
      </div>
      <div className="adm-grid-2">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Courier</th><th>Shipments</th><th>Delivered</th><th>On-time</th><th>NDR</th><th>RTO</th></tr></thead>
            <tbody>
              {stats.perCourier.map((x) => (
                <tr key={x.c.id}>
                  <td><b className="small">{x.c.name}</b></td>
                  <td className="xs">{x.total}</td>
                  <td className="xs">{x.delivered}</td>
                  <td className="xs">{x.onTime === null ? "—" : `${x.onTime}%`}</td>
                  <td className="xs">{x.ndr}</td>
                  <td className="xs">{x.rto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card card-pad">
          <b>Shipments by zone</b>
          <div className="mt-12">{stats.zones.length ? <HBars rows={stats.zones} /> : <p className="xs muted">Zones appear once shipments are shipped from this console.</p>}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- settings ---------- */

export function SettingsPanel({ admin }) {
  const s = useShippingSettings();
  const [blocked, setBlocked] = useState(s.codBlockedPincodes.join(", "));
  const editable = ["super_admin", "logistics"].includes(admin.role);
  const set = (patch) => {
    if (!editable) return toast.error("Only Super Admin or Logistics can change shipping settings");
    updateShippingSettings(patch);
    toast("Shipping settings saved");
  };
  return (
    <div className="sr-settings">
      <div className="card card-pad col gap-12">
        <b>Automation</b>
        <Switch on={s.autoShip} onChange={(v) => set({ autoShip: v })} label="Auto-ship new orders (assign courier & AWB automatically)" />
        <Switch on={s.autoPickup} onChange={(v) => set({ autoPickup: v })} label="Schedule pickup automatically after Ship now" />
        <label className="col gap-4">
          <span className="small bold">Courier selection rule</span>
          <select className="select" value={s.courierRule} onChange={(e) => set({ courierRule: e.target.value })}>
            <option value="recommended">Recommended (balance of price, speed, rating)</option>
            <option value="cheapest">Cheapest</option>
            <option value="fastest">Fastest</option>
            <option value="best_rated">Best rated</option>
          </select>
        </label>
        <label className="col gap-4">
          <span className="small bold">Pickup slot</span>
          <input className="input" value={s.pickupSlot} onChange={(e) => set({ pickupSlot: e.target.value })} />
        </label>
      </div>
      <div className="card card-pad col gap-12">
        <b>COD & NDR rules</b>
        <label className="col gap-4">
          <span className="small bold">Maximum COD order value (₹)</span>
          <input className="input" type="number" value={s.codMaxValue} onChange={(e) => set({ codMaxValue: Number(e.target.value) || 0 })} />
        </label>
        <label className="col gap-4">
          <span className="small bold">COD blocked pincodes (comma separated)</span>
          <input className="input" value={blocked} onChange={(e) => setBlocked(e.target.value)} onBlur={() => set({ codBlockedPincodes: blocked.split(/[\s,]+/).filter((p) => /^\d{6}$/.test(p)) })} />
        </label>
        <label className="col gap-4">
          <span className="small bold">Re-attempts before return to origin</span>
          <select className="select" value={s.ndrMaxAttempts} onChange={(e) => set({ ndrMaxAttempts: Number(e.target.value) })}>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="col gap-4">
          <span className="small bold">COD remittance cycle (days after delivery)</span>
          <input className="input" type="number" min="1" value={s.remittanceCycleDays} onChange={(e) => set({ remittanceCycleDays: Number(e.target.value) || 7 })} />
        </label>
      </div>
      <div className="card card-pad col gap-12">
        <b>Pickup addresses</b>
        {warehouses.map((w) => (
          <div key={w.id} className="row between soft-panel">
            <span className="small"><i className="wh-dot" style={{ background: w.color }} /> <b>{w.name}</b><span className="xs muted" style={{ display: "block" }}>{w.city} – {w.pincode} · cut-off {w.cutoff} · {w.manager}</span></span>
            <span className="badge badge-soft-green">Verified</span>
          </div>
        ))}
        <p className="xs muted">Each warehouse must exist in Shiprocket → Settings → Pickup addresses with the same name (env SR_PICKUP_*).</p>
      </div>
      <div className="card card-pad col gap-12">
        <b>Demo simulator</b>
        <label className="col gap-4">
          <span className="small bold">Share of demo shipments that fail first delivery (NDR)</span>
          <select className="select" value={s.demoNdrRate} onChange={(e) => set({ demoNdrRate: Number(e.target.value) })}>
            {[0, 0.1, 0.2, 0.35, 0.5].map((n) => <option key={n} value={n}>{Math.round(n * 100)}%</option>)}
          </select>
        </label>
        <p className="xs muted">Used only in demo mode. With Shiprocket connected, every status comes from real courier scans.</p>
      </div>
    </div>
  );
}

export { chargeableWeight, dayLabel };
