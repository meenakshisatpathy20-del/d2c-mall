import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Package,
  CheckCircle2,
  Clock3,
  Navigation,
  Phone,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import "./ShipmentTrackingPage.css";

const fallbackShipment = {
  orderId: "D2C-ORD-10451",
  awb: "D2CAWB839144",
  carrier: "Delhivery",
  status: "Out for Delivery",
  expectedDate: "24 Sep 2026",
  expectedWindow: "10:00 AM - 8:00 PM",
  lastUpdated: "24 Sep 2026, 9:14 AM",
  warehouse: "Delhi NCR",
  origin: "Delhi NCR",
  destination: "Ranchi, Jharkhand",
  customer: {
    name: "Priyank Raj",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834001",
  },
  timeline: [
    {
      title: "Out for delivery",
      description:
        "Your package is with the delivery executive and will reach you today.",
      location: "Ranchi Delivery Hub",
      date: "24 Sep 2026",
      time: "9:14 AM",
      completed: true,
      current: true,
    },
    {
      title: "Reached delivery hub",
      description:
        "Package reached the final delivery hub near your address.",
      location: "Ranchi Delivery Hub",
      date: "24 Sep 2026",
      time: "7:28 AM",
      completed: true,
    },
    {
      title: "In transit",
      description:
        "Package is moving towards the destination city.",
      location: "Patna Transit Hub",
      date: "23 Sep 2026",
      time: "11:46 PM",
      completed: true,
    },
    {
      title: "Shipped",
      description:
        "Package left the fulfillment warehouse.",
      location: "Delhi NCR Warehouse",
      date: "23 Sep 2026",
      time: "4:35 PM",
      completed: true,
    },
    {
      title: "Order packed",
      description:
        "Your items were packed and prepared for dispatch.",
      location: "Delhi NCR Warehouse",
      date: "23 Sep 2026",
      time: "12:12 PM",
      completed: true,
    },
    {
      title: "Order confirmed",
      description:
        "Payment received and order confirmed.",
      location: "D2C Mall",
      date: "23 Sep 2026",
      time: "10:52 AM",
      completed: true,
    },
  ],
  checkpoints: [
    {
      city: "Delhi NCR",
      label: "Origin",
      completed: true,
    },
    {
      city: "Patna",
      label: "Transit",
      completed: true,
    },
    {
      city: "Ranchi",
      label: "Destination",
      completed: true,
    },
  ],
};

const statusStyles = {
  Processing: {
    label: "Processing",
    className: "tracking-processing",
  },
  Shipped: {
    label: "In Transit",
    className: "tracking-transit",
  },
  "Out for Delivery": {
    label: "Out for Delivery",
    className: "tracking-out",
  },
  Delivered: {
    label: "Delivered",
    className: "tracking-delivered",
  },
  Cancelled: {
    label: "Cancelled",
    className: "tracking-cancelled",
  },
};

function TrackingTimeline({ timeline }) {
  return (
    <div className="tracking-timeline">
      {timeline.map((event, index) => (
        <div
          className="tracking-timeline-item"
          key={`${event.title}-${event.date}-${index}`}
        >
          <div className="tracking-marker-column">
            <div
              className={`tracking-marker ${
                event.completed ? "completed" : ""
              } ${event.current ? "current" : ""}`}
            >
              {event.current ? (
                <Truck size={15} />
              ) : event.completed ? (
                <CheckCircle2 size={15} />
              ) : (
                <Clock3 size={15} />
              )}
            </div>

            {index !== timeline.length - 1 && (
              <div
                className={`tracking-line ${
                  event.completed ? "completed" : ""
                }`}
              />
            )}
          </div>

          <div
            className={`tracking-event ${
              event.current ? "current" : ""
            }`}
          >
            <div className="tracking-event-top">
              <div>
                <h3>{event.title}</h3>

                {event.current && (
                  <span className="tracking-live-badge">
                    Current status
                  </span>
                )}
              </div>

              <div className="tracking-event-date">
                <strong>{event.date}</strong>
                <span>{event.time}</span>
              </div>
            </div>

            <p>{event.description}</p>

            {event.location && (
              <div className="tracking-event-location">
                <MapPin size={12} />
                {event.location}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeliveryRoute({ checkpoints }) {
  return (
    <div className="tracking-route">
      <div className="tracking-route-line" />

      {checkpoints.map((checkpoint, index) => (
        <div
          className="tracking-route-point"
          key={`${checkpoint.city}-${index}`}
        >
          <div
            className={`tracking-route-marker ${
              checkpoint.completed ? "completed" : ""
            }`}
          >
            {checkpoint.completed ? (
              <Check size={12} />
            ) : (
              <span />
            )}
          </div>

          <strong>{checkpoint.city}</strong>
          <span>{checkpoint.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ShipmentTrackingPage({
  shipment: shipmentProp,
  loading = false,
  onBack,
  onHelp,
  onRefresh,
  onViewOrder,
  onBuyAgain,
}) {
  const shipment = shipmentProp || fallbackShipment;

  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const status =
    statusStyles[shipment.status] ||
    statusStyles.Processing;

  const timeline = Array.isArray(shipment.timeline)
    ? shipment.timeline
    : [];

  const checkpoints = Array.isArray(
    shipment.checkpoints
  )
    ? shipment.checkpoints
    : [];

  const currentEvent = useMemo(
    () =>
      timeline.find((event) => event.current) ||
      timeline.find((event) => event.completed) ||
      timeline[0],
    [timeline]
  );

  const copyAwb = async () => {
    if (!shipment.awb) return;

    try {
      await navigator.clipboard.writeText(
        shipment.awb
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);

    try {
      await onRefresh(shipment);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <main className="shipment-tracking-page">
        <div className="tracking-loading">
          <div className="tracking-loading-icon">
            <Truck size={27} />
          </div>

          <strong>Loading shipment tracking...</strong>

          <span>
            Getting the latest delivery information.
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="shipment-tracking-page">
      <header className="tracking-header">
        <button
          type="button"
          className="tracking-back"
          onClick={() => onBack?.()}
        >
          <ArrowLeft size={17} />
          <span>Back to Order</span>
        </button>

        <div className="tracking-header-actions">
          <button
            type="button"
            className="tracking-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "tracking-refresh-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            className="tracking-help"
            onClick={() => onHelp?.(shipment)}
          >
            <HelpCircle size={15} />
            Help
          </button>
        </div>
      </header>

      <section className="tracking-hero">
        <div className="tracking-hero-main">
          <div className="tracking-hero-icon">
            <Truck size={27} />
          </div>

          <div>
            <p className="tracking-eyebrow">
              LIVE SHIPMENT TRACKING
            </p>

            <div className="tracking-title-row">
              <h1>{status.label}</h1>

              <span
                className={`tracking-status ${status.className}`}
              >
                <span />
                {shipment.status}
              </span>
            </div>

            <p className="tracking-order-reference">
              Order {shipment.orderId}
            </p>
          </div>
        </div>

        <div className="tracking-hero-delivery">
          <span>Expected delivery</span>

          <strong>
            {shipment.expectedDate ||
              "Delivery date updating"}
          </strong>

          {shipment.expectedWindow && (
            <small>{shipment.expectedWindow}</small>
          )}
        </div>
      </section>

      <section className="tracking-layout">
        <div className="tracking-main">
          <section className="tracking-current-card">
            <div className="tracking-current-top">
              <div className="tracking-current-icon">
                <Navigation size={21} />
              </div>

              <div>
                <span className="tracking-current-label">
                  CURRENT UPDATE
                </span>

                <h2>
                  {currentEvent?.title ||
                    shipment.status}
                </h2>

                <p>
                  {currentEvent?.description ||
                    "Your shipment is being processed."}
                </p>
              </div>
            </div>

            <div className="tracking-current-bottom">
              <div>
                <span>LAST UPDATED</span>
                <strong>
                  {shipment.lastUpdated ||
                    "Recently updated"}
                </strong>
              </div>

              <div>
                <span>LOCATION</span>
                <strong>
                  {currentEvent?.location ||
                    shipment.destination ||
                    "In transit"}
                </strong>
              </div>
            </div>
          </section>

          <section className="tracking-route-card">
            <div className="tracking-section-heading">
              <div>
                <span>DELIVERY ROUTE</span>
                <h2>Package journey</h2>
              </div>

              <MapPin size={19} />
            </div>

            {checkpoints.length > 0 ? (
              <DeliveryRoute
                checkpoints={checkpoints}
              />
            ) : (
              <div className="tracking-no-route">
                <Package size={22} />
                <span>
                  Route information will appear as
                  your shipment moves.
                </span>
              </div>
            )}

            <div className="tracking-route-footer">
              <div>
                <span>FROM</span>
                <strong>
                  {shipment.origin ||
                    shipment.warehouse ||
                    "Fulfillment Center"}
                </strong>
              </div>

              <ChevronRight
                size={17}
                className="tracking-route-arrow"
              />

              <div>
                <span>TO</span>
                <strong>
                  {shipment.destination ||
                    shipment.customer?.city ||
                    "Delivery Address"}
                </strong>
              </div>
            </div>
          </section>

          <section className="tracking-timeline-card">
            <div className="tracking-section-heading">
              <div>
                <span>SHIPMENT HISTORY</span>
                <h2>Tracking timeline</h2>
              </div>

              <Clock3 size={19} />
            </div>

            {timeline.length > 0 ? (
              <TrackingTimeline
                timeline={timeline}
              />
            ) : (
              <div className="tracking-empty-history">
                <Clock3 size={24} />
                <strong>
                  Tracking updates are not available yet
                </strong>
                <span>
                  New updates will appear here once the
                  carrier scans the package.
                </span>
              </div>
            )}
          </section>
        </div>

        <aside className="tracking-sidebar">
          <section className="tracking-shipment-card">
            <div className="tracking-sidebar-heading">
              <Package size={17} />
              <h2>Shipment details</h2>
            </div>

            <div className="tracking-detail-row">
              <span>Carrier</span>
              <strong>
                {shipment.carrier || "Assigned"}
              </strong>
            </div>

            <div className="tracking-detail-row">
              <span>AWB / Tracking ID</span>

              <button
                type="button"
                className="tracking-awb-button"
                onClick={copyAwb}
              >
                <strong>
                  {shipment.awb || "Pending"}
                </strong>

                {copied ? (
                  <Check size={13} />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>

            <div className="tracking-detail-row">
              <span>Warehouse</span>
              <strong>
                {shipment.warehouse ||
                  "Fulfillment Center"}
              </strong>
            </div>

            <div className="tracking-detail-row">
              <span>Destination</span>
              <strong>
                {shipment.customer?.city ||
                  shipment.destination ||
                  "Your address"}
              </strong>
            </div>

            <div className="tracking-detail-row">
              <span>Expected delivery</span>
              <strong>
                {shipment.expectedDate ||
                  "Updating"}
              </strong>
            </div>
          </section>

          <section className="tracking-address-card">
            <div className="tracking-sidebar-heading">
              <MapPin size={17} />
              <h2>Delivery address</h2>
            </div>

            <div className="tracking-address">
              <strong>
                {shipment.customer?.name ||
                  "Customer"}
              </strong>

              <p>
                {shipment.customer?.city || ""}
                {shipment.customer?.state
                  ? `, ${shipment.customer.state}`
                  : ""}
                {shipment.customer?.pincode
                  ? ` - ${shipment.customer.pincode}`
                  : ""}
              </p>
            </div>

            {shipment.customer?.phone && (
              <div className="tracking-phone">
                <Phone size={13} />
                <span>
                  {shipment.customer.phone}
                </span>
              </div>
            )}
          </section>

          <section className="tracking-actions-card">
            <button
              type="button"
              onClick={() =>
                onViewOrder?.(shipment.orderId)
              }
            >
              <Package size={16} />
              View Order Details
            </button>

            <button
              type="button"
              onClick={() =>
                onHelp?.(shipment)
              }
            >
              <HelpCircle size={16} />
              Contact Support
            </button>

            {shipment.status === "Delivered" && (
              <button
                type="button"
                onClick={() =>
                  onBuyAgain?.(shipment.orderId)
                }
              >
                <RefreshCw size={16} />
                Buy Again
              </button>
            )}
          </section>

          <section className="tracking-confidence-card">
            <div className="tracking-confidence-icon">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <strong>Delivery updates</strong>

              <span>
                Tracking information is updated from
                shipment events and carrier scans.
              </span>
            </div>
          </section>
        </aside>
      </section>

      <section className="tracking-footer-note">
        <CalendarDays size={16} />

        <span>
          Estimated delivery dates can change because
          of carrier movement, local conditions or
          operational delays.
        </span>
      </section>
    </main>
  );
}