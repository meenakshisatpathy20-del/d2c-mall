/*
 * Public order tracking — no login needed (like a Shiprocket tracking page,
 * in D2C Mall's own design). Search by order ID + phone, or by AWB.
 * Customers can also fix a failed delivery themselves (reschedule, update
 * address/phone, or cancel) and rate the delivery.
 * Live mode: /api/shiprocket/track-order + /api/shiprocket/ndr-response.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, CheckCircle2, Copy, MapPin, MessageCircle, Package, Phone, Search, Star, Truck, Warehouse } from "lucide-react";
import { useStore } from "../../lib/store";
import { api, live, useBackend } from "../../lib/api";
import { getCourier, getWarehouse } from "../../data/logistics";
import { flowIndex, shipmentEta, shipmentStatus } from "../../lib/orderModel";
import { findShipmentsForTracking, ndrAction, rateDelivery, useShippingSettings } from "../../lib/services/shipping";
import { checkProductDelivery } from "../../lib/delivery";
import { COD_FEE, COD_LIMIT, EXPRESS_SHIPPING, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING } from "../../lib/pricing";
import { useNow } from "../../lib/services/liveSync";
import { cx, dayLabel, formatDate, formatINR, formatTime } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Empty, Stars, useDocumentTitle } from "../common/ui";
import { ShipmentEvents, ShipmentProgress } from "./OrderBits";
import "./ShipmentTrackingPage.css";

const HEADLINE = {
  new: ["Order confirmed", "Your items are being packed at our warehouse."],
  awb_assigned: ["Packed & ready to ship", "The courier will pick it up soon."],
  pickup_scheduled: ["Pickup scheduled", "The courier is on the way to our warehouse."],
  created: ["Packed", "Waiting for courier pickup."],
  picked_up: ["Shipped", "Your package has left our warehouse."],
  in_transit: ["On the way", "Your package is moving through the courier network."],
  reached_hub: ["Reached your city", "Your package is at the local delivery hub."],
  out_for_delivery: ["Out for delivery", "Keep your phone handy — it arrives today."],
  delivered: ["Delivered", "Your package has been delivered."],
  delivery_failed: ["Delivery attempt failed", "Choose what the courier should do next."],
  reattempt: ["Re-attempt scheduled", "The courier will try delivering again."],
  rto_initiated: ["Returning to seller", "This package is on its way back to us."],
  rto_in_transit: ["Returning to seller", "This package is on its way back to us."],
  rto_delivered: ["Returned to seller", "The package is back at our warehouse."],
  rto_received: ["Returned to seller", "Any prepaid amount will be refunded."],
  cancelled: ["Cancelled", "This shipment was cancelled."],
};

const maskPhone = (p) => String(p || "").replace(/\d(?=\d{4})/g, "•");

/* ---------- failed-delivery self help ---------- */

function NdrSelfHelp({ order, shipment, onDone }) {
  const settings = useShippingSettings();
  const [mode, setMode] = useState("date");
  const [f, setF] = useState({ date: "", phone: "", line1: "", landmark: "" });
  const [busy, setBusy] = useState(false);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const max = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const attemptsLeft = Math.max(0, settings.ndrMaxAttempts + 1 - (shipment.attempts || 1));

  const submit = async () => {
    if (mode === "date" && !f.date) return toast.error("Pick a delivery date");
    if (mode === "update" && !f.phone && !f.line1 && !f.landmark) return toast.error("Add the phone, address or landmark to update");
    if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) return toast.error("Enter a valid 10-digit mobile number");
    setBusy(true);
    try {
      const action = mode === "cancel" ? "rto" : mode === "update" ? "update" : "reattempt";
      if (shipment.provider === "shiprocket-live" && live("shiprocket")) {
        await api("/shiprocket/ndr-response", { method: "POST", body: { orderId: order.id, phone: order.address.phone, awb: shipment.awb, action: mode === "cancel" ? "cancel" : action, date: f.date, newPhone: f.phone, line1: f.line1, landmark: f.landmark } });
      }
      const r = await ndrAction(order.id, shipment.id, { action, by: "customer", date: f.date, phone: f.phone, line1: f.line1, landmark: f.landmark });
      if (!r.ok) return toast.error(r.error);
      toast(mode === "cancel" ? "Okay — the order will be returned and cancelled" : "Thanks! The courier will re-attempt delivery");
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ndr-help">
      <div className="row gap-8">
        <AlertTriangle size={18} className="text-red" />
        <b>We missed you! What should the courier do?</b>
      </div>
      <p className="xs muted">{attemptsLeft ? `${attemptsLeft} delivery attempt${attemptsLeft > 1 ? "s" : ""} left before the package is returned.` : "This is the last attempt."}</p>
      <div className="seg mt-8">
        {[["date", "Deliver another day"], ["update", "Update phone / address"], ["cancel", "Cancel delivery"]].map(([k, l]) => (
          <button key={k} className={cx(mode === k && "active")} onClick={() => setMode(k)}>{l}</button>
        ))}
      </div>
      {mode !== "cancel" ? (
        <label className="col gap-4 mt-8">
          <span className="xs bold">Preferred delivery date</span>
          <input className="input" type="date" min={tomorrow} max={max} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </label>
      ) : (
        <p className="small mt-8">The package will go back to our warehouse.{order.payment.method !== "cod" ? " Your payment will be refunded once it arrives." : ""}</p>
      )}
      {mode === "update" ? (
        <div className="grid grid-2 mt-8">
          <input className="input" inputMode="numeric" maxLength={10} placeholder="Alternate mobile number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
          <input className="input" placeholder="Landmark (e.g. near City Mall)" value={f.landmark} onChange={(e) => setF({ ...f, landmark: e.target.value })} />
          <input className="input" style={{ gridColumn: "1 / -1" }} placeholder="Corrected address (house no., street, area)" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} />
        </div>
      ) : null}
      <button className={cx("btn mt-12", mode === "cancel" ? "btn-red" : "btn-blue")} disabled={busy} onClick={submit}>
        {busy ? "Sending…" : mode === "cancel" ? "Cancel delivery" : "Confirm"}
      </button>
    </div>
  );
}

function DeliveryFeedback({ order, shipment }) {
  const [rating, setRating] = useState(shipment.feedback?.rating || 0);
  const [comment, setComment] = useState("");
  if (shipment.feedback) {
    return <p className="small text-green row gap-6"><CheckCircle2 size={15} /> Thanks for rating your delivery {shipment.feedback.rating}★</p>;
  }
  return (
    <div className="col gap-8">
      <b className="small">How was your delivery?</b>
      <Stars value={rating} onChange={setRating} size={22} />
      {rating ? (
        <>
          <input className="input" placeholder="Anything to tell us about the courier or packaging? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn btn-sm btn-blue" style={{ alignSelf: "flex-start" }} onClick={() => { rateDelivery(order.id, shipment.id, { rating, comment }); toast("Thanks for your feedback!"); }}>Submit</button>
        </>
      ) : null}
    </div>
  );
}

/* ---------- one shipment ---------- */

function ShipmentTrack({ order, shipment, now, index, total }) {
  const status = shipmentStatus(shipment, now);
  const [title, sub] = HEADLINE[status] || [status, ""];
  const wh = getWarehouse(shipment.warehouseId);
  const courier = getCourier(shipment.courierId);
  const pct = status === "delivered" ? 100 : status.startsWith("rto") ? 100 : (flowIndex(status) / 6) * 100;
  const shareUrl = shipment.awb ? `${window.location.origin}/track?awb=${shipment.awb}` : null;
  return (
    <div className="card card-pad col gap-16">
      <div className="row between wrap gap-12">
        <div>
          <span className="xs muted">
            {total > 1 ? `Package ${index + 1} of ${total} · ` : ""}
            {shipment.awb ? `AWB ${shipment.awb} · ${shipment.liveCourier || courier?.name}` : `Order ${order.id}`}
          </span>
          <h2 className={cx("track-status", status === "delivery_failed" && "text-red", status === "delivered" && "text-green")}>{title}</h2>
          <p className="small muted">{sub}</p>
          {!["delivered", "cancelled"].includes(status) && !status.startsWith("rto") ? (
            <p className="small mt-4">Expected delivery <b className="text-green">{dayLabel(shipmentEta(shipment))}</b></p>
          ) : null}
        </div>
        <div className="col gap-6" style={{ alignItems: "flex-end" }}>
          <span className="xs muted row gap-6"><span className="live-dot" /> Updated {formatTime(now)}</span>
          {shareUrl ? (
            <button className="btn btn-xs btn-outline" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast("Tracking link copied"); }}>
              <Copy size={12} /> Share tracking
            </button>
          ) : null}
        </div>
      </div>

      <div className="route">
        <div className="route-node">
          <span style={{ background: wh.color }}><Warehouse size={16} /></span>
          <b className="xs">{wh.short}</b>
        </div>
        <div className="route-line">
          <motion.div className="route-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
          <motion.span className={cx("route-truck", status.startsWith("rto") && "back")} initial={{ left: 0 }} animate={{ left: `calc(${status.startsWith("rto") ? 0 : pct}% - ${status.startsWith("rto") ? 0 : 16}px)` }} transition={{ duration: 0.8 }}>
            <Truck size={16} />
          </motion.span>
        </div>
        <div className="route-node">
          <span className="dest"><MapPin size={16} /></span>
          <b className="xs">{order.address.city}</b>
        </div>
      </div>
      {shipment.awb ? <ShipmentProgress shipment={shipment} now={now} /> : null}

      {status === "delivery_failed" ? <NdrSelfHelp order={order} shipment={shipment} /> : null}
      {status === "delivered" ? <DeliveryFeedback order={order} shipment={shipment} /> : null}

      <div className="grid grid-2">
        <div>
          <b className="small">Tracking history</b>
          <div className="mt-12">
            <ShipmentEvents shipment={shipment} now={now} city={order.address.city} />
          </div>
        </div>
        <div className="col gap-12">
          <div className="soft-panel">
            <b className="small">Delivering to</b>
            <p className="small mt-4">{order.address.name.split(" ")[0]} · {order.address.city} {order.address.pincode}</p>
            <p className="xs muted">Phone {maskPhone(order.address.phone)} · full address visible in your account</p>
          </div>
          <div className="soft-panel">
            <b className="small">Courier partner</b>
            <p className="small mt-4">{shipment.awb ? `${shipment.liveCourier || courier?.name} · ★ ${courier?.rating}` : "Assigned when your order is packed"}</p>
            <p className="xs muted row gap-4"><Phone size={12} /> Delivery agent's number is shared when out for delivery</p>
          </div>
          <div className="soft-panel">
            <b className="small">Need help?</b>
            <p className="xs muted mt-4">Questions about this delivery? WhatsApp or call 1800-120-D2C.</p>
            <Link to="/account/help" className="link small"><MessageCircle size={13} /> Contact support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- delivery time & charge checker ---------- */

function DeliveryCheck() {
  const inventory = useStore((s) => s.inventory);
  const products = useStore((s) => s.recentlyViewed);
  const [pin, setPin] = useState("");
  const [res, setRes] = useState(null);
  const check = (e) => {
    e.preventDefault();
    const sample = { id: products?.[0] || "men-001", weightKg: 0.5 };
    setRes({ pin, r: checkProductDelivery(pin, sample, inventory) });
  };
  return (
    <div className="card card-pad">
      <b>Check delivery time & charges</b>
      <form className="row gap-8 mt-12 wrap" onSubmit={check}>
        <input className="input" style={{ maxWidth: 220 }} inputMode="numeric" maxLength={6} placeholder="Your pincode" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} required />
        <button className="btn btn-blue">Check</button>
      </form>
      {res ? (
        res.r.ok ? (
          <div className="dcheck mt-12">
            <div><CalendarDays size={16} /> Standard delivery by <b>{formatDate(res.r.eta, { year: false })}</b> · {formatINR(STANDARD_SHIPPING)}, free above {formatINR(FREE_SHIPPING_THRESHOLD)}</div>
            {res.r.expressAvailable ? <div><Truck size={16} /> Express by <b>{formatDate(res.r.expressEta, { year: false })}</b> · {formatINR(EXPRESS_SHIPPING)}</div> : <div className="muted"><Truck size={16} /> Express not available for this pincode</div>}
            <div>{res.r.codAvailable ? <>✅ Cash on Delivery available (fee {formatINR(COD_FEE)}, orders up to {formatINR(COD_LIMIT)})</> : <>❌ Cash on Delivery not available — pay online</>}</div>
            <div className="xs muted">Ships from {res.r.shipments[0].warehouse.name} · {res.r.location.city}, {res.r.location.state}</div>
          </div>
        ) : (
          <div className="notice error mt-12">{res.r.reason}</div>
        )
      ) : null}
    </div>
  );
}

/* ---------- page ---------- */

export default function ShipmentTrackingPage() {
  const { shipmentId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const now = useNow(4000);
  const orders = useStore((s) => s.orders);
  useBackend();
  useDocumentTitle("Track your order");

  const awbParam = params.get("awb") || "";
  const orderParam = params.get("order") || "";
  const phoneParam = params.get("phone") || "";
  const [mode, setMode] = useState(awbParam ? "awb" : "order");
  const [f, setF] = useState({ awb: awbParam, order: orderParam, phone: phoneParam });
  const [liveResult, setLiveResult] = useState(null);

  useEffect(() => {
    if (shipmentId) navigate(`/track?awb=${encodeURIComponent(shipmentId)}`, { replace: true });
  }, [shipmentId, navigate]);

  const result = useMemo(() => {
    if (awbParam) return findShipmentsForTracking({ awb: awbParam });
    if (orderParam && phoneParam) return findShipmentsForTracking({ orderId: orderParam, phone: phoneParam });
    return null;
  }, [awbParam, orderParam, phoneParam, orders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live mode: orders that only exist on the server are looked up via the API.
  useEffect(() => {
    let off = false;
    if (result && !result.ok && orderParam && phoneParam && live("shiprocket") && live("db")) {
      api(`/shiprocket/track-order?orderId=${encodeURIComponent(orderParam)}&phone=${encodeURIComponent(phoneParam)}`)
        .then((r) => !off && setLiveResult(r))
        .catch(() => !off && setLiveResult(null));
    }
    return () => {
      off = true;
    };
  }, [result, orderParam, phoneParam]);

  const search = (e) => {
    e.preventDefault();
    setLiveResult(null);
    if (mode === "awb") {
      if (!f.awb.trim()) return toast.error("Enter your AWB / tracking number");
      setParams({ awb: f.awb.trim().toUpperCase() });
    } else {
      if (!f.order.trim() || f.phone.replace(/\D/g, "").length !== 10) return toast.error("Enter your order ID and 10-digit mobile number");
      setParams({ order: f.order.trim().toUpperCase(), phone: f.phone.replace(/\D/g, "") });
    }
  };

  return (
    <div className="page">
      <div className="container page-narrow">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Track order" }]} />
        <div className="track-hero">
          <span className="eyebrow light"><Truck size={13} /> Live order tracking · no login needed</span>
          <h1>Where's my order?</h1>
          <div className="track-modes">
            <button className={cx(mode === "order" && "active")} onClick={() => setMode("order")}>Order ID + phone</button>
            <button className={cx(mode === "awb" && "active")} onClick={() => setMode("awb")}>AWB / tracking number</button>
          </div>
          <form className="track-search" onSubmit={search}>
            <Search size={18} />
            {mode === "awb" ? (
              <input placeholder="Enter AWB number from SMS / email" value={f.awb} onChange={(e) => setF({ ...f, awb: e.target.value })} />
            ) : (
              <>
                <input placeholder="Order ID (e.g. OD26092409917)" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} />
                <input className="track-phone" inputMode="numeric" maxLength={10} placeholder="Mobile number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
              </>
            )}
            <button className="btn" type="submit">Track</button>
          </form>
          {!live("shiprocket") ? <p className="xs track-demo">Demo: try order <b>OD26092409917</b> with mobile <b>9123456780</b>.</p> : null}
        </div>

        {result && !result.ok && !liveResult ? (
          <Empty icon={<Package size={34} />} title="We couldn't find that" text={result.error} action={<Link to="/orders" className="btn">My orders</Link>} />
        ) : null}

        {result?.ok ? (
          <div className="col gap-16 mt-24">
            <div className="row between wrap">
              <span className="small muted">Order <b>{result.order.id}</b> · placed {formatDate(result.order.createdAt)} · {result.order.items.length} item(s)</span>
              <Link to={`/orders/${result.order.id}`} className="link small">View full order →</Link>
            </div>
            {result.shipments.map((s, i) => (
              <ShipmentTrack key={s.id} order={result.order} shipment={result.order.shipments.find((x) => x.id === s.id) || s} now={now} index={i} total={result.shipments.length} />
            ))}
          </div>
        ) : null}

        {liveResult ? (
          <div className="col gap-16 mt-24">
            {liveResult.shipments.map((s, i) => (
              <div key={s.awb || i} className="card card-pad">
                <span className="xs muted">{s.awb ? `AWB ${s.awb} · ${s.courier}` : "Being packed"}</span>
                <h2 className="track-status">{HEADLINE[s.status]?.[0] || s.status}</h2>
                {s.etd ? <p className="small">Expected by <b className="text-green">{s.etd}</b></p> : null}
                <div className="timeline mt-16">
                  {s.events.map((e, k) => (
                    <div key={k} className={`tl-item ${k === 0 ? "current" : "done"}`}>
                      <span className="tl-dot" />
                      <div>
                        <div className="tl-title">{e.note}</div>
                        <div className="tl-meta">{e.location} · {e.at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!result ? (
          <div className="track-how mt-24">
            {[
              [Package, "Packed", "We pack your order at the nearest warehouse"],
              [Truck, "Shipped", "A courier partner picks it up — you get the AWB by SMS"],
              [MapPin, "Out for delivery", "Track live, or reschedule if you won't be home"],
              [Star, "Delivered", "Rate the delivery and tell us how we did"],
            ].map(([Icon, t, d]) => (
              <div key={t} className="card card-pad">
                <Icon size={20} className="text-blue" />
                <b className="small">{t}</b>
                <span className="xs muted">{d}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-24">
          <DeliveryCheck />
        </div>
      </div>
    </div>
  );
}
