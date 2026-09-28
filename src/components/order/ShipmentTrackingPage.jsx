/*
 * Customer-facing tracking. Works for a shipment ID (from an order) or any
 * AWB number. Polls every 4s (roadmap: polling → webhooks/SSE later).
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Package, Phone, Search, Truck, Warehouse } from "lucide-react";
import { useStore } from "../../lib/store";
import { getCourier, getWarehouse } from "../../data/logistics";
import { SHIPMENT_LABEL, flowIndex, shipmentEta, shipmentStatus } from "../../lib/orderModel";
import { useNow } from "../../lib/services/liveSync";
import { dayLabel, formatTime } from "../../lib/format";
import { Breadcrumbs, Empty, useDocumentTitle } from "../common/ui";
import { ShipmentEvents, ShipmentProgress } from "./OrderBits";
import "./ShipmentTrackingPage.css";

export default function ShipmentTrackingPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const now = useNow(4000);
  const [q, setQ] = useState("");
  useDocumentTitle("Track shipment");

  let found = null;
  if (shipmentId) {
    for (const o of orders) {
      const s = o.shipments.find((x) => x.id === shipmentId || x.awb === shipmentId);
      if (s) {
        found = { order: o, shipment: s };
        break;
      }
    }
  }

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/tracking/${q.trim().toUpperCase()}`);
  };

  const status = found ? shipmentStatus(found.shipment, now) : null;
  const pct = found ? (status === "delivered" ? 100 : (flowIndex(status) / 6) * 100) : 0;
  const wh = found ? getWarehouse(found.shipment.warehouseId) : null;
  const courier = found ? getCourier(found.shipment.courierId) : null;

  return (
    <div className="page">
      <div className="container page-narrow">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Track shipment" }]} />
        <div className="track-hero">
          <span className="eyebrow light">
            <Truck size={13} /> Live shipment tracking · powered by Shiprocket
          </span>
          <h1>Where's my package?</h1>
          <form className="track-search" onSubmit={search}>
            <Search size={18} />
            <input placeholder="Enter AWB number or shipment ID" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn" type="submit">
              Track
            </button>
          </form>
        </div>

        {shipmentId && !found ? (
          <Empty icon={<Package size={34} />} title="No shipment found" text={`We couldn't find "${shipmentId}". Check the AWB number from your SMS/email or open the order from My Orders.`} action={<Link to="/orders" className="btn">My orders</Link>} />
        ) : null}

        {found ? (
          <div className="col gap-16 mt-24">
            <div className="card card-pad">
              <div className="row between wrap gap-16">
                <div>
                  <span className="xs muted">
                    AWB {found.shipment.awb} · {courier.name}
                  </span>
                  <h2 className="track-status">{SHIPMENT_LABEL[status]}</h2>
                  {status !== "delivered" ? (
                    <p className="small">
                      Expected by <b className="text-green">{dayLabel(shipmentEta(found.shipment))}</b>
                    </p>
                  ) : null}
                </div>
                <span className="xs muted row gap-6">
                  <span className="live-dot" /> Updated {formatTime(now)}
                </span>
              </div>

              <div className="route">
                <div className="route-node">
                  <span style={{ background: wh.color }}>
                    <Warehouse size={16} />
                  </span>
                  <b className="xs">{wh.short}</b>
                </div>
                <div className="route-line">
                  <motion.div className="route-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                  <motion.span className="route-truck" initial={{ left: 0 }} animate={{ left: `calc(${pct}% - 16px)` }} transition={{ duration: 0.8 }}>
                    <Truck size={16} />
                  </motion.span>
                </div>
                <div className="route-node">
                  <span className="dest">
                    <MapPin size={16} />
                  </span>
                  <b className="xs">{found.order.address.city}</b>
                </div>
              </div>
              <ShipmentProgress shipment={found.shipment} now={now} />
            </div>

            <div className="grid grid-2">
              <div className="card card-pad">
                <b className="small">Tracking history</b>
                <div className="mt-16">
                  <ShipmentEvents shipment={found.shipment} now={now} city={found.order.address.city} />
                </div>
              </div>
              <div className="col gap-16">
                <div className="card card-pad">
                  <b className="small">Delivery details</b>
                  <p className="small mt-8">
                    {found.order.address.name.split(" ")[0]} · {found.order.address.city} {found.order.address.pincode}
                  </p>
                  <p className="xs muted mt-4">For your security, the full address is shown only in your account.</p>
                  <Link to={`/orders/${found.order.id}`} className="link small mt-8">
                    View order details →
                  </Link>
                </div>
                <div className="card card-pad">
                  <b className="small">Courier partner</b>
                  <p className="small mt-8">
                    {courier.name} · rated {courier.rating}★
                  </p>
                  <p className="xs muted row gap-4 mt-4">
                    <Phone size={12} /> Delivery agent details are shared when out for delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
