import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, CreditCard, FileText, HelpCircle, MapPin, Package, RefreshCcw, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck, XCircle } from "lucide-react";
import { useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { useShop } from "../../context/ShopContext";
import { productMap } from "../../data/catalog";
import { deliveredAt, deriveOrderStatus } from "../../lib/orderModel";
import { canCancel, collectPayment, returnWindowOpen } from "../../lib/services/orders";
import { useNow } from "../../lib/services/liveSync";
import { formatDate, formatDateTime, formatINR, formatTime } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Empty, Img, StatusPill, useDocumentTitle } from "../common/ui";
import { ReviewForm } from "../product/ProductReviews";
import { PAYMENT_METHODS } from "../../lib/services/payments";
import { CancelModal, InvoiceModal, ShipmentCard, ShipmentEvents, SupportModal } from "./OrderBits";
import "./OrdersPage.css";
import "./OrderDetailsPage.css";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const user = useCurrentUser();
  const order = useStore((s) => s.orders.find((o) => o.id === orderId));
  const returns = useStore((s) => s.returns);
  const now = useNow(4000);
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [invoice, setInvoice] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [support, setSupport] = useState(false);
  const [review, setReview] = useState(null);
  const [retryMethod, setRetryMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  useDocumentTitle(`Order ${orderId}`);

  if (!order || order.userId !== user.id) {
    return (
      <div className="page container">
        <Empty icon={<Package size={34} />} title="Order not found" text="This order doesn't exist or belongs to a different account." action={<Link to="/orders" className="btn">My orders</Link>} />
      </div>
    );
  }

  const status = deriveOrderStatus(order, now);
  const dAt = deliveredAt(order, now);
  const orderReturns = returns.filter((r) => r.orderId === order.id);
  const retryable = status === "payment_failed" && Date.now() - order.createdAt < 60 * 60000;

  const retry = async () => {
    setBusy(true);
    const r = await collectPayment(order.id, { user, address: order.address, paymentMethod: retryMethod });
    setBusy(false);
    if (r.ok) {
      toast("Payment successful — order confirmed!");
      navigate(`/order-success/${order.id}`);
    } else toast.error(r.error);
  };

  const buyAgain = () => {
    let n = 0;
    order.items.forEach((i) => {
      if (addToCart(productMap[i.productId], { size: i.size, color: i.color, silent: true })) n += 1;
    });
    if (n) navigate("/cart");
  };

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Orders", to: "/orders" }, { label: order.id }]} />
        <div className="od-head">
          <div>
            <div className="row gap-6 wrap">
              <h1>Order #{order.id}</h1>
              <StatusPill status={status} />
            </div>
            <p className="small muted mt-4">
              Placed on {formatDateTime(order.createdAt)} · {order.items.length} item{order.items.length > 1 ? "s" : ""} · {order.shipments.length} shipment{order.shipments.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="row gap-6 wrap">
            {!["payment_failed", "pending_payment"].includes(status) ? (
              <button className="btn btn-outline btn-sm" onClick={() => setInvoice(true)}>
                <FileText size={15} /> Invoice
              </button>
            ) : null}
            <button className="btn btn-soft btn-sm" onClick={buyAgain}>
              <ShoppingBag size={15} /> Buy again
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setSupport(true)}>
              <HelpCircle size={15} /> Need help?
            </button>
            {canCancel({ ...order, status }) ? (
              <button className="btn btn-sm btn-ghost text-red" onClick={() => setCancel(true)}>
                <XCircle size={15} /> Cancel order
              </button>
            ) : null}
          </div>
        </div>

        {status === "payment_failed" ? (
          <div className="card card-pad od-retry">
            <b className="text-red">Payment was not completed</b>
            <p className="small muted">
              {order.payment.attempts.slice(-1)[0]?.reason || "Payment failed"}. Reserved stock was released automatically. {retryable ? "Retry now — we'll re-reserve your items." : "This order has expired; please add the items to your bag again."}
            </p>
            {retryable ? (
              <div className="row gap-6 wrap mt-12">
                <select className="select" style={{ width: "auto" }} value={retryMethod} onChange={(e) => setRetryMethod(e.target.value)}>
                  {PAYMENT_METHODS.filter((m) => m.id !== "cod").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button className="btn btn-blue" onClick={retry} disabled={busy}>
                  {busy ? <span className="spinner" /> : <RefreshCcw size={15} />} Retry payment of {formatINR(order.pricing.total)}
                </button>
              </div>
            ) : (
              <button className="btn mt-12" onClick={buyAgain}>
                <ShoppingBag size={15} /> Add items to bag
              </button>
            )}
          </div>
        ) : null}

        <div className="od-grid">
          <div className="col gap-16">
            {order.shipments.length ? (
              <>
                <div className="row between">
                  <b className="row gap-6">
                    <Truck size={18} className="text-blue" /> Shipments & tracking
                  </b>
                  <span className="xs muted row gap-6">
                    <span className="live-dot" /> Live · refreshed {formatTime(now)}
                  </span>
                </div>
                {order.shipments.map((s, i) => (
                  <ShipmentCard key={s.id} order={order} shipment={s} now={now}>
                    <details className="od-events" open={i === 0}>
                      <summary className="link small">Tracking history</summary>
                      <div className="mt-12">
                        <ShipmentEvents shipment={s} now={now} city={order.address.city} />
                      </div>
                    </details>
                    <Link to={`/tracking/${s.id}`} className="link xs mt-8" style={{ display: "inline-flex" }}>
                      Open full tracking page →
                    </Link>
                  </ShipmentCard>
                ))}
              </>
            ) : null}

            <div className="card">
              <div className="card-head">
                <b>Items in this order</b>
              </div>
              {order.items.map((i) => {
                const canReturn = status === "delivered" && returnWindowOpen(order, i, dAt) && !orderReturns.some((r) => r.lineIds.includes(i.lineId) && r.status !== "cancelled");
                return (
                  <div key={i.lineId} className="od-item" id={i === order.items[0] ? "review" : undefined}>
                    <Link to={`/product/${i.productId}`}>
                      <Img src={i.image} alt="" className="od-item-img" label={i.brand} />
                    </Link>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="small">{i.brand}</b>
                      <div className="small muted">{i.name}</div>
                      <div className="xs faint">{[i.size && `Size ${i.size}`, i.color, `Qty ${i.qty}`, `SKU ${i.sku}`].filter(Boolean).join(" · ")}</div>
                      <div className="row gap-6 wrap mt-8">
                        {status === "delivered" ? (
                          <button className="btn btn-xs btn-outline" onClick={() => setReview(productMap[i.productId])}>
                            <Star size={12} /> Rate & review
                          </button>
                        ) : null}
                        {canReturn ? (
                          <Link to={`/returns?order=${order.id}&line=${i.lineId}`} className="btn btn-xs btn-outline">
                            <RotateCcw size={12} /> Return / exchange
                          </Link>
                        ) : status === "delivered" && !i.returnDays ? (
                          <span className="xs muted">Non-returnable item</span>
                        ) : null}
                        {orderReturns.some((r) => r.lineIds.includes(i.lineId) && r.status !== "cancelled") ? (
                          <Link to="/returns" className="badge badge-soft-amber">
                            Return in progress
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="right">
                      <b className="small">{formatINR(i.price * i.qty)}</b>
                      <div className="xs strike faint">{formatINR(i.mrp * i.qty)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card card-pad">
              <b className="row gap-6 mb-16">
                <Check size={16} className="text-green" /> Order timeline
              </b>
              <div className="timeline">
                {[...order.timeline].reverse().map((t, i) => (
                  <div key={`${t.status}-${t.at}`} className={`tl-item ${t.status.includes("fail") || t.status === "cancelled" ? "failed" : i === 0 ? "current" : "done"}`}>
                    <span className="tl-dot">
                      <Check size={12} />
                    </span>
                    <div>
                      <div className="tl-title">{t.note}</div>
                      <div className="tl-meta">{formatDateTime(t.at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="col gap-16">
            <div className="card card-pad">
              <b className="row gap-6">
                <MapPin size={16} className="text-blue" /> Delivery address
              </b>
              <p className="small mt-8">
                <b>{order.address.name}</b> <span className="badge badge-soft-gray">{order.address.label || order.address.type}</span>
                <br />
                {order.address.line1}, {order.address.line2}
                <br />
                {order.address.city}, {order.address.state} – {order.address.pincode}
                <br />
                Phone: {order.address.phone}
              </p>
              {dAt ? <p className="xs text-green bold mt-8">Delivered {formatDateTime(dAt)}</p> : null}
            </div>

            <div className="card card-pad">
              <b className="row gap-6">
                <CreditCard size={16} className="text-blue" /> Payment information
              </b>
              <div className="od-pay mt-12">
                <div><span>Method</span><b>{order.payment.instrument || order.payment.method.toUpperCase()}</b></div>
                <div><span>Status</span><b style={{ textTransform: "capitalize" }} className={order.payment.status === "paid" ? "text-green" : order.payment.status.includes("fail") ? "text-red" : ""}>{order.payment.status.replace(/_/g, " ")}</b></div>
                {order.payment.razorpayOrderId ? <div><span>Gateway order</span><b className="xs">{order.payment.razorpayOrderId}</b></div> : null}
                {order.payment.razorpayPaymentId ? <div><span>Payment ID</span><b className="xs">{order.payment.razorpayPaymentId}</b></div> : null}
                {order.payment.paidAt ? <div><span>Paid at</span><b className="xs">{formatDateTime(order.payment.paidAt)}</b></div> : null}
                <div><span>Attempts</span><b>{order.payment.attempts.length}</b></div>
              </div>
              {order.payment.signatureVerified ? (
                <p className="xs text-green bold mt-8 row gap-4">
                  <ShieldCheck size={13} /> Razorpay signature verified on server
                </p>
              ) : null}
              {order.payment.status === "refund_initiated" ? <div className="notice info mt-12">Refund of {formatINR(order.pricing.total)} initiated on {formatDate(order.payment.refundAt)}. Expected in 3–5 working days.</div> : null}
            </div>

            <div className="card card-pad price-details">
              <b className="small">Price breakdown</b>
              <div className="pd-row"><span>Item total (MRP)</span><span>{formatINR(order.pricing.mrpTotal)}</span></div>
              <div className="pd-row"><span>Discount</span><span className="text-green">−{formatINR(order.pricing.productDiscount)}</span></div>
              {order.pricing.couponDiscount ? <div className="pd-row"><span>Coupon {order.pricing.couponCode}</span><span className="text-green">−{formatINR(order.pricing.couponDiscount)}</span></div> : null}
              <div className="pd-row"><span>Delivery</span><span>{order.pricing.shipping ? formatINR(order.pricing.shipping) : "FREE"}</span></div>
              {order.pricing.codFee ? <div className="pd-row"><span>COD fee</span><span>{formatINR(order.pricing.codFee)}</span></div> : null}
              <div className="pd-row total"><span>Order total</span><span>{formatINR(order.pricing.total)}</span></div>
            </div>

            {orderReturns.length ? (
              <Link to="/returns" className="card card-pad row gap-6">
                <RotateCcw size={16} className="text-orange" />
                <span className="small grow">
                  {orderReturns.length} return request(s) for this order
                </span>
                →
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
      <InvoiceModal order={order} open={invoice} onClose={() => setInvoice(false)} />
      <CancelModal order={order} open={cancel} onClose={() => setCancel(false)} />
      <SupportModal order={order} user={user} open={support} onClose={() => setSupport(false)} />
      {review ? <ReviewForm product={review} open={!!review} onClose={() => setReview(null)} /> : null}
    </div>
  );
}
