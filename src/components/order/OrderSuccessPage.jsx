import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CreditCard, MapPin, Package, ShieldCheck, Truck, Warehouse } from "lucide-react";
import { useStore } from "../../lib/store";
import { getWarehouse, getCourier } from "../../data/logistics";
import { dayLabel, formatDateTime, formatINR } from "../../lib/format";
import { getTrendingProducts } from "../../data/catalog";
import ProductCard from "../common/ProductCard";
import { Empty, Img, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import "./OrderSuccessPage.css";

const COLORS = ["#ff6b00", "#2457ff", "#12b76a", "#7f56d9", "#ff4056", "#f79009"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
        size: 6 + Math.random() * 8,
      })),
    []
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span key={p.id} style={{ left: `${p.left}%`, background: p.color, width: p.size, height: p.size * 0.45, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const order = useStore((s) => s.orders.find((o) => o.id === orderId));
  useDocumentTitle("Order confirmed");

  if (!order) {
    return (
      <div className="page container">
        <Empty icon={<Package size={34} />} title="Order not found" action={<Link to="/orders" className="btn">My orders</Link>} />
      </div>
    );
  }

  const cod = order.payment.method === "cod";

  return (
    <div className="page success">
      <Confetti />
      <div className="container page-narrow">
        <motion.div className="success-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.span className="success-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }}>
            <CheckCircle2 size={44} />
          </motion.span>
          <h1>Order confirmed! 🎉</h1>
          <p>
            Thank you, {order.customer.split(" ")[0]}. Your order <b>{order.id}</b> has been placed and {order.shipments.length > 1 ? `${order.shipments.length} shipments are` : "your shipment is"} being prepared.
          </p>
          <div className="success-eta">
            <Truck size={18} /> Arriving by <b>{dayLabel(order.etaAt)}</b>
          </div>
          <div className="row gap-6 wrap mt-16" style={{ justifyContent: "center" }}>
            <Link to={`/orders/${order.id}`} className="btn btn-lg">
              Track order <ArrowRight size={17} />
            </Link>
            <Link to="/shop" className="btn btn-lg btn-glass">
              Continue shopping
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-3 mt-24">
          <div className="card card-pad">
            <b className="row gap-6 small">
              <MapPin size={16} className="text-blue" /> Delivering to
            </b>
            <p className="small mt-8">
              <b>{order.address.name}</b>
              <br />
              {order.address.line1}, {order.address.city} – {order.address.pincode}
              <br />
              {order.address.phone}
            </p>
          </div>
          <div className="card card-pad">
            <b className="row gap-6 small">
              <CreditCard size={16} className="text-blue" /> Payment
            </b>
            <p className="small mt-8">
              <b>{cod ? `Pay ${formatINR(order.pricing.total)} on delivery` : `${formatINR(order.pricing.total)} paid`}</b>
              <br />
              {order.payment.instrument}
              {!cod ? (
                <>
                  <br />
                  <span className="xs text-green bold row gap-4">
                    <ShieldCheck size={12} /> Signature verified · {order.payment.razorpayPaymentId}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="card card-pad">
            <b className="row gap-6 small">
              <Warehouse size={16} className="text-blue" /> Fulfilment
            </b>
            {order.shipments.map((s) => (
              <p key={s.id} className="small mt-8">
                <b>{getWarehouse(s.warehouseId).short}</b> → {getCourier(s.courierId).name}
                <br />
                <span className="xs muted">AWB {s.awb}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="card card-pad mt-16">
          <div className="row between mb-16">
            <b>Items ({order.items.length})</b>
            <span className="xs muted">Placed {formatDateTime(order.createdAt)}</span>
          </div>
          <div className="col gap-10">
            {order.items.map((i) => (
              <div key={i.lineId} className="row gap-16">
                <Img src={i.image} alt="" className="succ-img" label="" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="small">{i.brand}</b>
                  <div className="xs muted ellipsis">{i.name}</div>
                  <div className="xs muted">{[i.size && `Size ${i.size}`, i.color, `Qty ${i.qty}`].filter(Boolean).join(" · ")}</div>
                </div>
                <b className="small">{formatINR(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div className="notice success mt-16">
            <CheckCircle2 size={16} /> Confirmation sent by email, SMS & WhatsApp. You'll get live updates as your order moves.
          </div>
        </div>

        <section className="section">
          <SectionHead title="You might also like" eyebrow="Keep exploring" />
          <Rail>
            {getTrendingProducts().map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>
      </div>
    </div>
  );
}
