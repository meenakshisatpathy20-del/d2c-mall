import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./OrderSuccessPage.css";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN");

export default function OrderSuccessPage({
  order,
  onContinueShopping,
  onViewOrders,
  onTrackOrder,
}) {
  const [copied, setCopied] = useState(false);

  const orderData = useMemo(() => {
    const source = order || {};

    const items = source.items || [];

    const pricing = source.pricing || {};

    const customer =
      source.customer || source.address || {};

    const orderId =
      source.orderId ||
      source.id ||
      `D2C${Date.now()
        .toString()
        .slice(-8)}`;

    const total =
      pricing.total ??
      source.total ??
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.quantity || 1),
        0
      );

    return {
      ...source,
      orderId,
      items,
      customer,
      pricing: {
        ...pricing,
        total,
      },
      status:
        source.status || "Order Confirmed",
      paymentStatus:
        source.paymentStatus ||
        "Payment confirmation pending",
      paymentMethod:
        source.paymentMethod || "Online Payment",
      estimatedDelivery:
        source.estimatedDelivery ||
        "3–6 business days",
      shipmentId:
        source.shipmentId || null,
      awb:
        source.awb || null,
      carrier:
        source.carrier || null,
    };
  }, [order]);

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(
        orderData.orderId
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.print();
  };

  return (
    <main className="order-success-page">
      <section className="order-success-hero">
        <motion.div
          className="order-success-check"
          initial={{
            scale: 0,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 16,
          }}
        >
          <Check size={34} />
        </motion.div>

        <motion.span
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ delay: 0.15 }}
        >
          ORDER CONFIRMED
        </motion.span>

        <motion.h1
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ delay: 0.2 }}
        >
          Your order is on its way to
          becoming a reality.
        </motion.h1>

        <motion.p
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ delay: 0.25 }}
        >
          We've received your order and will
          keep you updated as it moves through
          fulfilment and delivery.
        </motion.p>

        <div className="order-number">
          <span>ORDER ID</span>

          <strong>
            {orderData.orderId}
          </strong>

          <button
            type="button"
            onClick={copyOrderId}
            aria-label="Copy order ID"
          >
            {copied ? (
              <Check size={15} />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </div>
      </section>

      <section className="order-success-layout">
        <div className="order-success-main">
          <section className="order-success-card">
            <div className="order-card-heading">
              <div>
                <span>DELIVERY</span>
                <h2>Where we're sending it</h2>
              </div>

              <MapPin size={19} />
            </div>

            <div className="order-address">
              <strong>
                {orderData.customer.fullName ||
                  "Customer"}
              </strong>

              <p>
                {orderData.customer.addressLine ||
                  orderData.customer.address ||
                  "Delivery address"}
              </p>

              <p>
                {[
                  orderData.customer.city,
                  orderData.customer.state,
                  orderData.customer.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {orderData.customer.phone && (
                <span>
                  +91{" "}
                  {orderData.customer.phone}
                </span>
              )}
            </div>
          </section>

          <section className="order-success-card">
            <div className="order-card-heading">
              <div>
                <span>ITEMS</span>
                <h2>
                  What you've ordered
                </h2>
              </div>

              <ShoppingBag size={19} />
            </div>

            <div className="order-items">
              {orderData.items.map(
                (item, index) => {
                  const image =
                    item.images?.[0] ||
                    item.image ||
                    "";

                  return (
                    <article
                      className="order-item"
                      key={[
                        item.id,
                        item.selectedSize ||
                          "default",
                        item.selectedColor ||
                          "default",
                        index,
                      ].join("__")}
                    >
                      <div className="order-item-image">
                        <img
                          src={image}
                          alt={item.name}
                        />

                        <span>
                          {item.quantity || 1}
                        </span>
                      </div>

                      <div className="order-item-info">
                        <span>
                          {item.brand}
                        </span>

                        <h3>
                          {item.name}
                        </h3>

                        {(item.selectedSize ||
                          item.selectedColor) && (
                          <small>
                            {item.selectedSize &&
                              `Size ${item.selectedSize}`}
                            {item.selectedSize &&
                              item.selectedColor &&
                              " · "}
                            {item.selectedColor &&
                              item.selectedColor}
                          </small>
                        )}
                      </div>

                      <strong>
                        ₹
                        {money(
                          Number(
                            item.price || 0
                          ) *
                            Number(
                              item.quantity || 1
                            )
                        )}
                      </strong>
                    </article>
                  );
                }
              )}
            </div>
          </section>

          <section className="order-success-card">
            <div className="order-card-heading">
              <div>
                <span>FULFILMENT</span>
                <h2>
                  Your delivery journey
                </h2>
              </div>

              <Truck size={19} />
            </div>

            <div className="order-timeline">
              <div className="order-timeline-item active">
                <div className="order-timeline-dot">
                  <Check size={11} />
                </div>

                <div>
                  <strong>
                    Order confirmed
                  </strong>

                  <span>
                    We've received your order.
                  </span>
                </div>
              </div>

              <div className="order-timeline-item">
                <div className="order-timeline-dot">
                  <Package size={11} />
                </div>

                <div>
                  <strong>
                    Preparing your order
                  </strong>

                  <span>
                    Warehouse fulfilment will
                    begin after payment and stock
                    confirmation.
                  </span>
                </div>
              </div>

              <div className="order-timeline-item">
                <div className="order-timeline-dot">
                  <Truck size={11} />
                </div>

                <div>
                  <strong>
                    Shipped & tracked
                  </strong>

                  <span>
                    Courier and AWB details will
                    appear once the shipment is
                    created.
                  </span>
                </div>
              </div>

              <div className="order-timeline-item">
                <div className="order-timeline-dot">
                  <MapPin size={11} />
                </div>

                <div>
                  <strong>
                    Delivered
                  </strong>

                  <span>
                    Estimated delivery:{" "}
                    {orderData.estimatedDelivery}
                  </span>
                </div>
              </div>
            </div>

            {(orderData.shipmentId ||
              orderData.awb ||
              orderData.carrier) && (
              <div className="shipment-details">
                {orderData.shipmentId && (
                  <div>
                    <span>
                      Shipment ID
                    </span>
                    <strong>
                      {orderData.shipmentId}
                    </strong>
                  </div>
                )}

                {orderData.awb && (
                  <div>
                    <span>AWB</span>
                    <strong>
                      {orderData.awb}
                    </strong>
                  </div>
                )}

                {orderData.carrier && (
                  <div>
                    <span>Carrier</span>
                    <strong>
                      {orderData.carrier}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="order-success-sidebar">
          <section className="order-success-card order-summary-card">
            <div className="order-card-heading">
              <div>
                <span>PAYMENT</span>
                <h2>Order summary</h2>
              </div>
            </div>

            <div className="order-payment-status">
              <div>
                <Check size={14} />
              </div>

              <div>
                <strong>
                  {orderData.paymentStatus}
                </strong>

                <span>
                  {orderData.paymentMethod}
                </span>
              </div>
            </div>

            <div className="order-price-details">
              <div>
                <span>MRP</span>

                <strong>
                  ₹
                  {money(
                    orderData.pricing.mrp
                  )}
                </strong>
              </div>

              <div>
                <span>Product discount</span>

                <strong className="positive">
                  -₹
                  {money(
                    orderData.pricing
                      .productSavings
                  )}
                </strong>
              </div>

              <div>
                <span>Shipping</span>

                <strong>
                  {orderData.pricing.shipping ===
                  0
                    ? "FREE"
                    : `₹${money(
                        orderData.pricing
                          .shipping
                      )}`}
                </strong>
              </div>

              {orderData.pricing
                .couponDiscount > 0 && (
                <div>
                  <span>
                    Coupon discount
                  </span>

                  <strong className="positive">
                    -₹
                    {money(
                      orderData.pricing
                        .couponDiscount
                    )}
                  </strong>
                </div>
              )}

              <div className="order-total">
                <span>Total paid</span>

                <strong>
                  ₹
                  {money(
                    orderData.pricing.total
                  )}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="order-invoice-button"
              onClick={handleDownloadInvoice}
            >
              <Download size={15} />
              Download invoice
            </button>
          </section>

          <section className="order-success-card order-next-card">
            <span>WHAT'S NEXT?</span>

            <h2>
              Follow your order every step
              of the way.
            </h2>

            <p>
              Once your shipment is created,
              your carrier, AWB and live tracking
              information will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                onTrackOrder?.(orderData)
              }
            >
              Track order
              <ArrowRight size={15} />
            </button>
          </section>

          <div className="order-help">
            Need help with your order?
            <button type="button">
              Contact support
            </button>
          </div>
        </aside>
      </section>

      <section className="order-success-actions">
        <button
          type="button"
          className="secondary"
          onClick={() =>
            onViewOrders?.()
          }
        >
          View all orders
        </button>

        <button
          type="button"
          onClick={onContinueShopping}
        >
          Continue shopping
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}