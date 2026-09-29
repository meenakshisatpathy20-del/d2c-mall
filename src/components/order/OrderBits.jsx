import { useEffect, useState } from "react";
import { api, live, useBackend } from "../../lib/api";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, Copy, MapPin, PackageCheck, Printer, Truck, Warehouse } from "lucide-react";
import { getCourier, getWarehouse } from "../../data/logistics";
import { SHIPMENT_FLOW, SHIPMENT_LABEL, flowIndex, shipmentEta, shipmentEvents, shipmentStatus } from "../../lib/orderModel";
import { cancelOrder, createTicket } from "../../lib/services/orders";
import { cx, dayLabel, formatDate, formatDateTime, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Modal } from "../common/ui";

/* ---------- Shipment progress ---------- */

export function ShipmentProgress({ shipment, now, compact }) {
  const status = shipmentStatus(shipment, now);
  const idx = flowIndex(status);
  const failed = status === "delivery_failed" || status === "reattempt";
  if (shipment.cancelled) return <div className="xs muted">Shipment cancelled</div>;
  return (
    <div className={cx("sprog", compact && "compact")}>
      {SHIPMENT_FLOW.filter((s) => !compact || ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"].includes(s.key)).map((s) => {
        const i = SHIPMENT_FLOW.findIndex((x) => x.key === s.key);
        const state = i < idx || status === "delivered" ? "done" : i === idx ? (failed ? "failed" : "current") : "";
        return (
          <div key={s.key} className={cx("sprog-step", state)}>
            <span className="sprog-dot">{state === "done" ? <Check size={11} /> : state === "failed" ? "!" : null}</span>
            <span className="sprog-label">{s.short}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ShipmentCard({ order, shipment, now, children }) {
  const wh = getWarehouse(shipment.warehouseId);
  const courier = getCourier(shipment.courierId);
  const status = shipmentStatus(shipment, now);
  const events = shipmentEvents(shipment, now);
  const delivered = events.find((e) => e.status === "delivered");
  const failed = status === "delivery_failed" || status === "reattempt";
  const items = order.items.filter((i) => shipment.lineIds.includes(i.lineId));

  return (
    <div className="ship-card">
      <div className="ship-card-head">
        <div className="row gap-10 wrap">
          <span className="ship-wh" style={{ background: wh.color }}>
            <Warehouse size={15} />
          </span>
          <div>
            <b className="small">
              {shipment.cancelled ? "Cancelled" : SHIPMENT_LABEL[status] || status}
              {delivered ? ` on ${formatDate(delivered.at, { year: false })}` : ""}
            </b>
            <div className="xs muted">
              {wh.short} → {order.address.city} · {courier?.name} · AWB{" "}
              <button
                className="link xs"
                onClick={() => {
                  navigator.clipboard?.writeText(shipment.awb).catch(() => {});
                  toast("AWB copied");
                }}
              >
                {shipment.awb} <Copy size={11} />
              </button>
            </div>
          </div>
        </div>
        {!delivered && !shipment.cancelled ? (
          <span className="small">
            {failed ? "New ETA" : "ETA"} <b className={failed ? "text-orange" : "text-green"}>{dayLabel(shipmentEta(shipment))}</b>
          </span>
        ) : null}
      </div>
      {failed ? (
        <div className="notice warn mt-12">
          <AlertTriangle size={16} /> {events.filter((e) => e.status === "delivery_failed").slice(-1)[0]?.note || "Delivery attempt failed"}. The courier will re-attempt delivery. Attempt {shipment.attempts || 2} of 3.
        </div>
      ) : null}
      <ShipmentProgress shipment={shipment} now={now} />
      {children}
      <div className="ship-items">
        {items.map((i) => (
          <Link key={i.lineId} to={`/product/${i.productId}`} className="row gap-10">
            <img src={i.image} alt="" className="ship-item-img" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <span className="xs">
              <b>{i.brand}</b> · {i.name}
              <span className="muted" style={{ display: "block" }}>
                {[i.size && `Size ${i.size}`, i.color, `Qty ${i.qty}`].filter(Boolean).join(" · ")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Poll Shiprocket tracking for shipments created on the live backend. */
export function useLiveTracking(awb, enabled) {
  const status = useBackend();
  const [data, setData] = useState(null);
  const on = enabled && status.available && live("shiprocket") && !!awb;
  useEffect(() => {
    if (!on) return undefined;
    let alive = true;
    const load = () =>
      api(`/shiprocket/track?awb=${encodeURIComponent(awb)}`)
        .then((d) => alive && setData(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [awb, on]);
  return on ? data : null;
}

export function ShipmentEvents({ shipment, now, city }) {
  const liveData = useLiveTracking(shipment.awb, shipment.provider === "shiprocket-live");
  if (liveData?.events?.length) {
    return (
      <div className="timeline">
        <div className="xs text-green bold mb-8 row gap-6">
          <span className="live-dot" /> Live from {liveData.courier || "Shiprocket"} · {liveData.rawStatus}
        </div>
        {liveData.events.map((e, i) => (
          <div key={`${e.at}-${i}`} className={cx("tl-item", i === 0 ? "current" : "done")}>
            <span className="tl-dot"><Check size={12} /></span>
            <div>
              <div className="tl-title">{e.note}</div>
              <div className="tl-meta"><MapPin size={11} /> {e.location} · {e.at}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const events = [...shipmentEvents(shipment, now)].reverse();
  const next = shipment.plan.find((e) => e.at > now);
  return (
    <div className="timeline">
      {next && !shipment.cancelled && !shipment.frozen ? (
        <div className="tl-item">
          <span className="tl-dot">
            <Truck size={13} />
          </span>
          <div>
            <div className="tl-title muted">Next: {SHIPMENT_LABEL[next.status]}</div>
            <div className="tl-meta">Expected {formatDateTime(next.at)}</div>
          </div>
        </div>
      ) : null}
      {events.map((e, i) => (
        <div key={`${e.status}-${e.at}`} className={cx("tl-item", i === 0 ? (e.status === "delivery_failed" ? "failed" : e.status === "delivered" ? "done" : "current") : "done")}>
          <span className="tl-dot">{e.status === "delivered" ? <PackageCheck size={13} /> : e.status === "delivery_failed" ? "!" : <Check size={12} />}</span>
          <div>
            <div className="tl-title">{e.note || SHIPMENT_LABEL[e.status]}</div>
            <div className="tl-meta">
              <MapPin size={11} /> {e.location || city} · {formatDateTime(e.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Invoice ---------- */

export function InvoiceModal({ order, open, onClose }) {
  if (!order) return null;
  const taxable = Math.round(order.pricing.total / 1.12);
  const gst = order.pricing.total - taxable;
  const intra = ["Maharashtra", "Karnataka", "Haryana", "Rajasthan"].includes(order.address.state);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="mid"
      title={`Tax invoice · ${order.invoiceNo}`}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-blue" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </>
      }
    >
      <div className="invoice print-area">
        <div className="row between wrap gap-16">
          <div>
            <b style={{ fontSize: 20 }}>
              <span className="text-blue">D2C</span>
              <span className="text-orange">MALL</span>
            </b>
            <p className="xs muted">D2C Mall Retail Pvt. Ltd. · GSTIN 29AABCD1234E1Z5 · CIN U52390KA2024PTC000000</p>
          </div>
          <div className="right xs">
            <b>Tax Invoice</b>
            <div>Invoice #{order.invoiceNo}</div>
            <div>Order #{order.id}</div>
            <div>Date {formatDate(order.createdAt)}</div>
          </div>
        </div>
        <div className="grid grid-2 mt-16">
          <div className="soft-panel xs">
            <b>Bill to / Ship to</b>
            <div>{order.address.name}</div>
            <div>
              {order.address.line1}, {order.address.line2}
            </div>
            <div>
              {order.address.city}, {order.address.state} – {order.address.pincode}
            </div>
            <div>Ph: {order.address.phone}</div>
            {order.extras?.gstin ? <div><b>{order.extras.businessName}</b> · GSTIN {order.extras.gstin}</div> : null}
          </div>
          <div className="soft-panel xs">
            <b>Payment</b>
            <div>{order.payment.instrument}</div>
            <div>Status: {order.payment.status.replace(/_/g, " ")}</div>
            {order.payment.razorpayPaymentId ? <div>Txn: {order.payment.razorpayPaymentId}</div> : null}
            <div>Place of supply: {order.address.state}</div>
          </div>
        </div>
        <div className="table-wrap mt-16">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={i.lineId}>
                  <td className="xs">
                    <b>{i.brand}</b> {i.name}
                    <div className="faint">SKU {i.sku}</div>
                  </td>
                  <td className="xs">{i.category === "beauty" ? "3304" : i.category === "electronics" ? "8518" : i.category === "jewellery" ? "7117" : "6109"}</td>
                  <td>{i.qty}</td>
                  <td>{formatINR(i.price)}</td>
                  <td>{formatINR(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="invoice-totals">
          <div><span>Item total</span><span>{formatINR(order.pricing.itemTotal)}</span></div>
          {order.pricing.couponDiscount ? <div><span>Coupon ({order.pricing.couponCode})</span><span>−{formatINR(order.pricing.couponDiscount)}</span></div> : null}
          <div><span>Shipping</span><span>{formatINR(order.pricing.shipping)}</span></div>
          {order.pricing.codFee ? <div><span>COD fee</span><span>{formatINR(order.pricing.codFee)}</span></div> : null}
          {order.pricing.giftWrapFee ? <div><span>Gift wrap</span><span>{formatINR(order.pricing.giftWrapFee)}</span></div> : null}
          <div><span>Taxable value</span><span>{formatINR(taxable)}</span></div>
          {intra ? (
            <>
              <div><span>CGST @6%</span><span>{formatINR(gst / 2)}</span></div>
              <div><span>SGST @6%</span><span>{formatINR(gst / 2)}</span></div>
            </>
          ) : (
            <div><span>IGST @12%</span><span>{formatINR(gst)}</span></div>
          )}
          {order.pricing.coinsUsed || order.pricing.creditsUsed ? <div><span>Paid via D2C Coins / credits</span><span>{formatINR((order.pricing.coinsUsed || 0) + (order.pricing.creditsUsed || 0))}</span></div> : null}
          <div className="grand"><span>Grand total</span><span>{formatINR(order.pricing.total)}</span></div>
        </div>
        <p className="xs muted mt-16">This is a computer-generated invoice and does not require a signature. Tax rates shown are indicative for this demo.</p>
      </div>
    </Modal>
  );
}

/* ---------- Cancel ---------- */

const CANCEL_REASONS = ["Ordered by mistake", "Found a better price elsewhere", "Delivery is taking too long", "Want to change size / colour", "Want to change address", "Other"];

export function CancelModal({ order, open, onClose }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  if (!order) return null;
  const submit = () => {
    const r = cancelOrder(order.id, reason);
    if (!r.ok) {
      toast.error(r.error || "Could not cancel");
      return;
    }
    toast("Order cancelled" + (order.payment.status === "paid" ? " · refund initiated" : ""));
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel order"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Keep order</button>
          <button className="btn btn-red" onClick={submit}>Cancel order</button>
        </>
      }
    >
      <p className="small muted mb-16">Why are you cancelling order {order.id}?</p>
      <div className="col gap-6">
        {CANCEL_REASONS.map((r) => (
          <label key={r} className={cx("radio-card", reason === r && "active")}>
            <input type="radio" checked={reason === r} onChange={() => setReason(r)} /> <span className="small">{r}</span>
          </label>
        ))}
      </div>
      {order.payment.status === "paid" ? (
        <div className="notice info mt-16">
          Refund of {formatINR(order.pricing.total)} will be credited to {order.payment.instrument} in 3–5 working days.
        </div>
      ) : null}
    </Modal>
  );
}

/* ---------- Support ---------- */

const TOPICS = ["Where is my order?", "Delivery attempt failed", "Payment debited but order failed", "Return / refund status", "Wrong or damaged item", "Something else"];

export function SupportModal({ order, user, open, onClose }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [msg, setMsg] = useState("");
  const submit = () => {
    if (msg.trim().length < 10) {
      toast.error("Please describe the issue (min 10 characters)");
      return;
    }
    const t = createTicket({ userId: user.id, orderId: order?.id, subject: topic, message: msg, category: topic });
    toast(`Ticket ${t.id} created — we'll reply within 2 hours`);
    setMsg("");
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? `Help with order ${order.id}` : "Contact support"}
      footer={
        <>
          <Link to="/account/help" className="btn btn-outline" onClick={onClose}>
            Help centre
          </Link>
          <button className="btn" onClick={submit}>Submit request</button>
        </>
      }
    >
      <div className="chips wrap" style={{ flexWrap: "wrap" }}>
        {TOPICS.map((t) => (
          <button key={t} className={cx("chip", topic === t && "active")} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="field mt-16">
        <label>Describe the issue</label>
        <textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tell us what happened…" />
      </div>
      <p className="xs muted mt-8">Our team is available 8 AM – 10 PM, all days. Call 1800-120-D2C or WhatsApp +91 90000 12345.</p>
    </Modal>
  );
}
