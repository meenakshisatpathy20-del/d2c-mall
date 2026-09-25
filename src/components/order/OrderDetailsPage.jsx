import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  MapPin,
  CreditCard,
  Download,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Box,
  Navigation,
  Receipt,
  Phone,
  Copy,
  Check,
  Star,
} from "lucide-react";
import "./OrderDetailsPage.css";

const fallbackOrder = {
  id: "D2C-ORD-10482",
  date: "23 Sep 2026",
  status: "Delivered",
  paymentStatus: "Paid",
  paymentMethod: "UPI",
  total: 1898,
  subtotal: 1898,
  discount: 0,
  shipping: 0,
  deliveryDate: "26 Sep 2026",
  address: {
    name: "Priyank Raj",
    phone: "9876543210",
    line: "Bhubaneswar Road",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834001",
  },
  shipment: {
    awb: "D2CAWB839201",
    carrier: "Shiprocket",
    warehouse: "Bengaluru",
    status: "Delivered",
    origin: "Bengaluru, Karnataka",
    destination: "Ranchi, Jharkhand",
    eta: "26 Sep 2026",
    lastUpdated: "26 Sep 2026, 4:42 PM",
  },
  items: [
    {
      id: "d2c-women-001",
      name: "Relaxed Fit Cotton Shirt",
      brand: "D2C Studio",
      image: "",
      price: 899,
      mrp: 1799,
      quantity: 1,
      size: "M",
      color: "White",
      status: "Delivered",
    },
    {
      id: "d2c-beauty-001",
      name: "Hydrating Glow Face Serum",
      brand: "GlowLab",
      image: "",
      price: 999,
      mrp: 1299,
      quantity: 1,
      status: "Delivered",
    },
  ],
  timeline: [
    {
      title: "Delivered",
      text: "Package delivered successfully",
      date: "26 Sep",
      time: "4:42 PM",
      completed: true,
    },
    {
      title: "Out for delivery",
      text: "Package reached the final delivery hub",
      date: "26 Sep",
      time: "9:14 AM",
      completed: true,
    },
    {
      title: "Shipped",
      text: "Package left Bengaluru warehouse",
      date: "24 Sep",
      time: "7:32 PM",
      completed: true,
    },
    {
      title: "Order packed",
      text: "Items packed and ready for dispatch",
      date: "24 Sep",
      time: "1:18 PM",
      completed: true,
    },
    {
      title: "Order confirmed",
      text: "Payment received and order confirmed",
      date: "23 Sep",
      time: "11:06 AM",
      completed: true,
    },
  ],
};

const statusSteps = [
  "Order confirmed",
  "Order packed",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

const statusIndex = {
  Processing: 1,
  Shipped: 3,
  "Out for Delivery": 4,
  Delivered: 5,
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const resolveImage = (item) =>
  item?.image ||
  item?.images?.[0] ||
  item?.thumbnail ||
  "";

function ProductImage({ item }) {
  const image = resolveImage(item);

  if (image) {
    return (
      <img
        src={image}
        alt={item.name}
        className="order-details-product-image"
      />
    );
  }

  return (
    <div className="order-details-product-placeholder">
      <Package size={25} />
    </div>
  );
}

function DeliveryTimeline({ order }) {
  const timeline = Array.isArray(order.timeline)
    ? order.timeline
    : [];

  if (timeline.length > 0) {
    return (
      <div className="order-details-timeline">
        {timeline.map((event, index) => (
          <div
            className="order-details-timeline-item"
            key={`${event.title}-${index}`}
          >
            <div
              className={`order-details-timeline-marker ${
                event.completed ? "completed" : ""
              }`}
            >
              {event.completed ? (
                <CheckCircle2 size={15} />
              ) : (
                <Clock3 size={15} />
              )}
            </div>

            {index !== timeline.length - 1 && (
              <div
                className={`order-details-timeline-line ${
                  event.completed ? "completed" : ""
                }`}
              />
            )}

            <div className="order-details-timeline-content">
              <div className="order-details-timeline-main">
                <strong>{event.title}</strong>

                <span>
                  {event.date} · {event.time}
                </span>
              </div>

              <p>{event.text}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const currentIndex =
    statusIndex[order.status] || 1;

  return (
    <div className="order-details-timeline">
      {statusSteps.map((step, index) => {
        const completed = index + 1 <= currentIndex;

        return (
          <div
            className="order-details-timeline-item"
            key={step}
          >
            <div
              className={`order-details-timeline-marker ${
                completed ? "completed" : ""
              }`}
            >
              {completed ? (
                <CheckCircle2 size={15} />
              ) : (
                <Clock3 size={15} />
              )}
            </div>

            {index !== statusSteps.length - 1 && (
              <div
                className={`order-details-timeline-line ${
                  completed ? "completed" : ""
                }`}
              />
            )}

            <div className="order-details-timeline-content">
              <div className="order-details-timeline-main">
                <strong>{step}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, value, children }) {
  return (
    <div className="order-details-info-row">
      <span>{label}</span>
      {children || <strong>{value}</strong>}
    </div>
  );
}

export default function OrderDetailsPage({
  order: orderProp,
  onBack,
  onTrackOrder,
  onReturn,
  onBuyAgain,
  onReview,
  onDownloadInvoice,
  onHelp,
}) {
  const order = orderProp || fallbackOrder;

  const [copied, setCopied] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [expandedItems, setExpandedItems] = useState(true);

  const subtotal = useMemo(() => {
    if (order.subtotal !== undefined) {
      return Number(order.subtotal);
    }

    return (order.items || []).reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 1),
      0
    );
  }, [order]);

  const discount = Number(
    order.discount || 0
  );

  const shipping = Number(
    order.shipping || 0
  );

  const grandTotal =
    Number(order.total) ||
    subtotal - discount + shipping;

  const copyAwb = async () => {
    if (!order.shipment?.awb) return;

    try {
      await navigator.clipboard.writeText(
        order.shipment.awb
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleInvoice = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice(order);
      return;
    }

    window.print();
  };

  const isReturnEligible =
    order.status === "Delivered";

  const canTrack =
    order.status === "Processing" ||
    order.status === "Shipped" ||
    order.status === "Out for Delivery" ||
    order.status === "Delivered";

  return (
    <main className="order-details-page">
      <header className="order-details-header">
        <button
          type="button"
          className="order-details-back"
          onClick={() => onBack?.()}
        >
          <ArrowLeft size={17} />
          <span>Back to Orders</span>
        </button>

        <div className="order-details-header-actions">
          <button
            type="button"
            className="order-details-help"
            onClick={() => onHelp?.(order)}
          >
            <HelpCircle size={16} />
            Help
          </button>

          <button
            type="button"
            className="order-details-invoice"
            onClick={handleInvoice}
          >
            <Download size={16} />
            Invoice
          </button>
        </div>
      </header>

      <section className="order-details-hero">
        <div>
          <p className="order-details-eyebrow">
            ORDER DETAILS
          </p>

          <div className="order-details-title-row">
            <h1>{order.id}</h1>

            <span
              className={`order-details-status ${
                order.status === "Delivered"
                  ? "success"
                  : order.status === "Cancelled"
                    ? "danger"
                    : "progress"
              }`}
            >
              {order.status === "Delivered" ? (
                <CheckCircle2 size={14} />
              ) : order.status === "Cancelled" ? (
                <Clock3 size={14} />
              ) : (
                <Truck size={14} />
              )}
              {order.status}
            </span>
          </div>

          <p className="order-details-subtitle">
            Placed on {order.date}
            {order.paymentMethod
              ? ` · ${order.paymentMethod}`
              : ""}
          </p>
        </div>

        <div className="order-details-hero-actions">
          {canTrack && (
            <button
              type="button"
              className="order-details-track-btn"
              onClick={() => onTrackOrder?.(order)}
            >
              <Navigation size={16} />
              Track Shipment
            </button>
          )}

          {isReturnEligible && (
            <button
              type="button"
              className="order-details-return-btn"
              onClick={() => onReturn?.(order)}
            >
              <RotateCcw size={16} />
              Return
            </button>
          )}
        </div>
      </section>

      <section className="order-details-layout">
        <div className="order-details-main">
          <section className="order-details-card">
            <div className="order-details-card-header">
              <div>
                <span className="order-details-card-eyebrow">
                  ITEMS
                </span>
                <h2>
                  {order.items?.length || 0}{" "}
                  {order.items?.length === 1
                    ? "Product"
                    : "Products"}
                </h2>
              </div>

              <button
                type="button"
                className="order-details-collapse"
                onClick={() =>
                  setExpandedItems(
                    (current) => !current
                  )
                }
              >
                {expandedItems ? (
                  <ChevronUp size={17} />
                ) : (
                  <ChevronDown size={17} />
                )}
              </button>
            </div>

            {expandedItems && (
              <div className="order-details-products">
                {(order.items || []).map(
                  (item, index) => {
                    const itemTotal =
                      Number(item.price || 0) *
                      Number(item.quantity || 1);

                    const itemDiscount =
                      item.mrp &&
                      Number(item.mrp) >
                        Number(item.price)
                        ? Number(item.mrp) -
                          Number(item.price)
                        : 0;

                    return (
                      <div
                        className="order-details-product"
                        key={
                          item.id ||
                          `${item.name}-${index}`
                        }
                      >
                        <ProductImage item={item} />

                        <div className="order-details-product-info">
                          <span className="order-details-product-brand">
                            {item.brand}
                          </span>

                          <h3>{item.name}</h3>

                          <div className="order-details-product-meta">
                            {item.size && (
                              <span>
                                Size: {item.size}
                              </span>
                            )}

                            {item.color && (
                              <span>
                                Color: {item.color}
                              </span>
                            )}

                            <span>
                              Qty:{" "}
                              {item.quantity || 1}
                            </span>
                          </div>

                          <div className="order-details-product-status">
                            <CheckCircle2 size={13} />
                            {item.status ||
                              order.status}
                          </div>
                        </div>

                        <div className="order-details-product-price">
                          <strong>
                            {formatPrice(itemTotal)}
                          </strong>

                          {item.mrp &&
                            Number(item.mrp) >
                              Number(item.price) && (
                              <span>
                                MRP{" "}
                                {formatPrice(
                                  Number(item.mrp) *
                                    Number(
                                      item.quantity || 1
                                    )
                                )}
                              </span>
                            )}

                          {itemDiscount > 0 && (
                            <small>
                              Saved{" "}
                              {formatPrice(
                                itemDiscount *
                                  Number(
                                    item.quantity || 1
                                  )
                              )}
                            </small>
                          )}
                        </div>

                        {order.status ===
                          "Delivered" && (
                          <button
                            type="button"
                            className="order-details-review-btn"
                            onClick={() =>
                              onReview?.({
                                order,
                                item,
                              })
                            }
                          >
                            <Star size={14} />
                            Review
                          </button>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}

            <div className="order-details-item-footer">
              <ShieldCheck size={16} />
              <span>
                Products sold through D2C Mall are
                covered by applicable return and
                authenticity policies.
              </span>
            </div>
          </section>

          <section className="order-details-card">
            <div className="order-details-card-header">
              <div>
                <span className="order-details-card-eyebrow">
                  DELIVERY
                </span>
                <h2>Shipment tracking</h2>
              </div>

              {canTrack && (
                <button
                  type="button"
                  className="order-details-small-action"
                  onClick={() =>
                    onTrackOrder?.(order)
                  }
                >
                  Full Tracking
                  <ChevronDown size={14} />
                </button>
              )}
            </div>

            <div className="order-details-shipment-summary">
              <div className="order-details-shipment-icon">
                <Truck size={21} />
              </div>

              <div>
                <strong>
                  {order.shipment?.status ||
                    order.status}
                </strong>

                <span>
                  {order.shipment?.carrier ||
                    "Shipment carrier assigned"}
                </span>
              </div>

              {order.shipment?.awb && (
                <button
                  type="button"
                  className="order-details-awb"
                  onClick={copyAwb}
                >
                  <span>
                    AWB {order.shipment.awb}
                  </span>

                  {copied ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>

            <div className="order-details-route">
              <div>
                <span>FROM</span>
                <strong>
                  {order.shipment?.origin ||
                    order.shipment?.warehouse ||
                    "Warehouse"}
                </strong>
              </div>

              <div className="order-details-route-line">
                <div />
                <Truck size={16} />
                <div />
              </div>

              <div className="order-details-route-destination">
                <span>TO</span>
                <strong>
                  {order.shipment?.destination ||
                    order.address?.city ||
                    "Delivery Address"}
                </strong>
              </div>
            </div>

            <div className="order-details-timeline-wrapper">
              <button
                type="button"
                className="order-details-timeline-toggle"
                onClick={() =>
                  setShowTimeline(
                    (current) => !current
                  )
                }
              >
                <span>Delivery Timeline</span>

                {showTimeline ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {showTimeline && (
                <DeliveryTimeline order={order} />
              )}
            </div>
          </section>

          <section className="order-details-card">
            <div className="order-details-card-header">
              <div>
                <span className="order-details-card-eyebrow">
                  DELIVERY ADDRESS
                </span>
                <h2>Where we're delivering</h2>
              </div>

              <MapPin
                size={19}
                className="order-details-blue-icon"
              />
            </div>

            <div className="order-details-address">
              <div className="order-details-address-icon">
                <MapPin size={18} />
              </div>

              <div>
                <strong>
                  {order.address?.name}
                </strong>

                {order.address?.phone && (
                  <span className="order-details-address-phone">
                    <Phone size={12} />
                    {order.address.phone}
                  </span>
                )}

                <p>
                  {order.address?.line}
                  <br />
                  {order.address?.city},{" "}
                  {order.address?.state}{" "}
                  {order.address?.pincode}
                </p>
              </div>
            </div>
          </section>

          <section className="order-details-card">
            <div className="order-details-card-header">
              <div>
                <span className="order-details-card-eyebrow">
                  PAYMENT
                </span>
                <h2>Payment information</h2>
              </div>

              <CreditCard
                size={19}
                className="order-details-green-icon"
              />
            </div>

            <div className="order-details-payment-grid">
              <div>
                <span>Method</span>
                <strong>
                  {order.paymentMethod ||
                    "Online Payment"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className="payment-success">
                  <CheckCircle2 size={14} />
                  {order.paymentStatus || "Paid"}
                </strong>
              </div>

              <div>
                <span>Order value</span>
                <strong>
                  {formatPrice(grandTotal)}
                </strong>
              </div>
            </div>
          </section>

          <section className="order-details-support">
            <div className="order-details-support-icon">
              <HelpCircle size={19} />
            </div>

            <div>
              <strong>Need help with this order?</strong>
              <span>
                Get assistance with delivery, payment,
                returns or refunds.
              </span>
            </div>

            <button
              type="button"
              onClick={() => onHelp?.(order)}
            >
              Contact Support
            </button>
          </section>
        </div>

        <aside className="order-details-sidebar">
          <section className="order-details-price-card">
            <div className="order-details-price-heading">
              <Receipt size={18} />
              <h2>Order Summary</h2>
            </div>

            <div className="order-details-price-lines">
              <InfoRow
                label="Item total"
                value={formatPrice(subtotal)}
              />

              {discount > 0 && (
                <InfoRow label="Discount">
                  <strong className="order-details-discount">
                    -{formatPrice(discount)}
                  </strong>
                </InfoRow>
              )}

              <InfoRow
                label="Shipping"
                value={
                  shipping > 0
                    ? formatPrice(shipping)
                    : "FREE"
                }
              />

              <div className="order-details-total-divider" />

              <div className="order-details-grand-total">
                <span>Grand Total</span>
                <strong>
                  {formatPrice(grandTotal)}
                </strong>
              </div>
            </div>

            <div className="order-details-payment-note">
              <CheckCircle2 size={15} />
              Payment{" "}
              {order.paymentStatus?.toLowerCase() ||
                "completed"}
            </div>
          </section>

          <section className="order-details-shipment-card">
            <div className="order-details-sidebar-title">
              <Box size={17} />
              <h2>Shipment</h2>
            </div>

            <InfoRow
              label="Carrier"
              value={
                order.shipment?.carrier ||
                "Assigned at dispatch"
              }
            />

            <InfoRow
              label="Warehouse"
              value={
                order.shipment?.warehouse ||
                "Fulfillment center"
              }
            />

            <InfoRow
              label="AWB"
              value={
                order.shipment?.awb ||
                "Will appear after dispatch"
              }
            />

            <InfoRow
              label="Expected"
              value={
                order.shipment?.eta ||
                order.deliveryDate ||
                "To be updated"
              }
            />

            {order.shipment?.lastUpdated && (
              <p className="order-details-last-updated">
                Last updated{" "}
                {order.shipment.lastUpdated}
              </p>
            )}
          </section>

          <section className="order-details-actions-card">
            <button
              type="button"
              onClick={handleInvoice}
            >
              <Download size={16} />
              Download Invoice
            </button>

            {order.status === "Delivered" && (
              <button
                type="button"
                onClick={() => onBuyAgain?.(order)}
              >
                <RefreshCw size={16} />
                Buy Again
              </button>
            )}

            {isReturnEligible && (
              <button
                type="button"
                onClick={() => onReturn?.(order)}
              >
                <RotateCcw size={16} />
                Return or Replace
              </button>
            )}

            <button
              type="button"
              onClick={() => onHelp?.(order)}
            >
              <HelpCircle size={16} />
              Get Help
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}