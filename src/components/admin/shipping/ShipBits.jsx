/*
 * Shared pieces for the Shipping console: status badge, Code 128 barcode,
 * printable 4×6 shipping label and pickup manifest.
 */
import { Printer } from "lucide-react";
import { getCourier, getWarehouse } from "../../../data/logistics";
import { SR_STATUS, chargeableWeight, code128, shipmentValue, volumetricWeight } from "../../../lib/shippingModel";
import { cx, formatDate, formatDateTime, formatINR } from "../../../lib/format";
import { Modal } from "../../common/ui";

const TONES = { blue: "badge-soft-blue", purple: "badge-soft-purple", orange: "badge-soft-orange", green: "badge-soft-green", red: "badge-soft-red", amber: "badge-soft-amber", gray: "badge-soft-gray" };

export function SrBadge({ status }) {
  const m = SR_STATUS[status] || { label: status, tone: "gray" };
  return <span className={cx("badge", TONES[m.tone])}>{m.label}</span>;
}

export function Barcode({ value, height = 54, module = 1.6 }) {
  const widths = code128(value);
  const total = widths.reduce((t, w) => t + w, 0) + 20;
  let x = 10;
  return (
    <svg viewBox={`0 0 ${total} ${height}`} width={total * module} height={height} role="img" aria-label={`Barcode ${value}`} style={{ maxWidth: "100%" }}>
      <rect width={total} height={height} fill="#fff" />
      {widths.map((w, i) => {
        const bar = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill="#000" /> : null;
        x += w;
        return bar;
      })}
    </svg>
  );
}

export function ShippingLabel({ order, shipment }) {
  const wh = getWarehouse(shipment.warehouseId);
  const courier = getCourier(shipment.courierId);
  const items = order.items.filter((i) => shipment.lineIds.includes(i.lineId));
  const cod = order.payment.method === "cod";
  const value = shipmentValue(order, shipment);
  const pkg = shipment.package || {};
  return (
    <div className="sr-label">
      <div className="sr-label-row head">
        <div>
          <b className="sr-label-brand">
            <span style={{ color: "#2457ff" }}>D2C</span>
            <span style={{ color: "#ff6b00" }}>MALL</span>
          </b>
          <span className="xs">Shipping label</span>
        </div>
        <div className="right">
          <b>{shipment.liveCourier || courier?.name}</b>
          <span className="xs">{cod ? "COD" : "PREPAID"}</span>
        </div>
      </div>
      <div className="sr-label-row center">
        <Barcode value={shipment.awb} />
        <b className="sr-label-awb">AWB {shipment.awb}</b>
      </div>
      <div className="sr-label-row grid2">
        <div>
          <span className="xs muted">SHIP TO</span>
          <b>{order.address.name}</b>
          <span>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</span>
          {order.address.landmark ? <span>Landmark: {order.address.landmark}</span> : null}
          <span>{order.address.city}, {order.address.state}</span>
          <b className="sr-label-pin">{order.address.pincode}</b>
          <span>Ph: {order.address.phone}</span>
        </div>
        <div>
          <span className="xs muted">{cod ? "COLLECT CASH" : "PREPAID — DO NOT COLLECT"}</span>
          <b className="sr-label-amt">{cod ? formatINR(value + (order.shipments[0]?.id === shipment.id ? (order.pricing.shipping || 0) + (order.pricing.codFee || 0) : 0)) : "₹0"}</b>
          <span className="xs">Weight {pkg.weightKg || 0.5} kg · {pkg.l}×{pkg.b}×{pkg.h} cm</span>
          <span className="xs">Chargeable {chargeableWeight(pkg)} kg (vol. {volumetricWeight(pkg)} kg)</span>
          <span className="xs">Order {order.id}</span>
          <span className="xs">Shipment {shipment.id}</span>
          <span className="xs">Date {formatDate(shipment.shippedAt || Date.now())}</span>
        </div>
      </div>
      <div className="sr-label-row">
        <span className="xs muted">CONTENTS</span>
        {items.map((i) => (
          <span key={i.lineId} className="xs">
            {i.sku} · {i.name}{i.size ? ` (${i.size})` : ""} × {i.qty}
          </span>
        ))}
      </div>
      <div className="sr-label-row center">
        <Barcode value={order.id} height={34} module={1.2} />
      </div>
      <div className="sr-label-row">
        <span className="xs muted">RETURN ADDRESS (if undelivered)</span>
        <span className="xs">D2C Mall · {wh.name}, {wh.city} – {wh.pincode} · {wh.phone}</span>
      </div>
    </div>
  );
}

export function PrintModal({ open, onClose, title, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="mid"
      footer={
        <button className="btn btn-blue" onClick={() => window.print()}>
          <Printer size={15} /> Print / Save as PDF
        </button>
      }
    >
      <div className="print-area">{children}</div>
    </Modal>
  );
}

export function ManifestSheet({ manifest, orders }) {
  const wh = getWarehouse(manifest.warehouseId);
  const rows = manifest.refs
    .map((r) => {
      const o = orders.find((x) => x.id === r.orderId);
      const s = o?.shipments.find((x) => x.id === r.shipmentId);
      return o && s ? { o, s } : null;
    })
    .filter(Boolean);
  const byCourier = rows.reduce((m, r) => ({ ...m, [r.s.courierId]: (m[r.s.courierId] || 0) + 1 }), {});
  return (
    <div className="sr-manifest">
      <div className="row between">
        <div>
          <b style={{ fontSize: 18 }}>Pickup manifest {manifest.id}</b>
          <div className="xs muted">{wh.name} · {wh.city} – {wh.pincode}</div>
        </div>
        <div className="right xs">
          Generated {formatDateTime(manifest.createdAt)}
          <br />by {manifest.by}
        </div>
      </div>
      <div className="table-wrap mt-12">
      <table className="table sr-manifest-table">
        <thead>
          <tr>
            <th>#</th>
            <th>AWB</th>
            <th>Order</th>
            <th>Courier</th>
            <th>Destination</th>
            <th>Payment</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ o, s }, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td><b>{s.awb}</b></td>
              <td>{o.id}</td>
              <td>{getCourier(s.courierId)?.name}</td>
              <td>{o.address.city} {o.address.pincode}</td>
              <td>{o.payment.method === "cod" ? `COD ${formatINR(shipmentValue(o, s))}` : "Prepaid"}</td>
              <td>{chargeableWeight(s.package || {})} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="small mt-12">
        Total {rows.length} parcels · {Object.entries(byCourier).map(([c, n]) => `${getCourier(c)?.name}: ${n}`).join(" · ")}
      </p>
      <div className="sr-sign">
        <div>Handed over by (warehouse)<span /></div>
        <div>Received by (courier executive)<span /></div>
      </div>
    </div>
  );
}
