import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./ReturnsPage.css";

const initialReturns = [
  {
    id: "RET-20260918001",
    orderId: "D2C-20260915042",
    product: {
      id: "d2c-women-001",
      name: "Relaxed Fit Cotton Shirt",
      brand: "D2C Studio",
      image: "https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=500&q=80",
      price: 899,
      qty: 1
    },
    reason: "Size/Fit Issue",
    description: "The size is larger than expected.",
    pickupAddress: {
      name: "Priyank Raj",
      phone: "9876543210",
      address: "12 Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001"
    },
    pickupDate: "28 Sep 2026",
    refundMethod: "Original Payment Method",
    refundAmount: 899,
    status: "Pickup Scheduled",
    createdAt: "25 Sep 2026",
    timeline: [
      {
        title: "Return requested",
        date: "25 Sep 2026, 10:42 AM",
        status: "completed",
        description: "Your return request has been received."
      },
      {
        title: "Return approved",
        date: "25 Sep 2026, 11:08 AM",
        status: "completed",
        description: "The return request was approved."
      },
      {
        title: "Pickup scheduled",
        date: "28 Sep 2026",
        status: "current",
        description: "Our courier partner will collect the product."
      },
      {
        title: "Quality check",
        date: "Pending",
        status: "pending",
        description: "The returned item will be inspected."
      },
      {
        title: "Refund initiated",
        date: "Pending",
        status: "pending",
        description: "Refund will be initiated after successful quality verification."
      }
    ]
  },
  {
    id: "RET-20260912007",
    orderId: "D2C-20260910019",
    product: {
      id: "d2c-footwear-001",
      name: "Everyday Street Sneakers",
      brand: "StreetForm",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
      price: 1499,
      qty: 1
    },
    reason: "Product Not as Expected",
    description: "The product appearance differs from expectations.",
    pickupAddress: {
      name: "Priyank Raj",
      phone: "9876543210",
      address: "12 Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001"
    },
    pickupDate: "Completed",
    refundMethod: "D2C Wallet",
    refundAmount: 1499,
    status: "Refund Processing",
    createdAt: "12 Sep 2026",
    timeline: [
      {
        title: "Return requested",
        date: "12 Sep 2026",
        status: "completed",
        description: "Your return request was received."
      },
      {
        title: "Pickup completed",
        date: "15 Sep 2026",
        status: "completed",
        description: "Product was successfully collected."
      },
      {
        title: "Quality check",
        date: "17 Sep 2026",
        status: "completed",
        description: "Product passed the return quality check."
      },
      {
        title: "Refund initiated",
        date: "18 Sep 2026",
        status: "current",
        description: "Refund is being processed."
      },
      {
        title: "Refund completed",
        date: "Expected 29 Sep 2026",
        status: "pending",
        description: "Refund will be credited to your selected method."
      }
    ]
  },
  {
    id: "RET-20260901003",
    orderId: "D2C-20260829081",
    product: {
      id: "d2c-beauty-001",
      name: "Hydrating Glow Face Serum",
      brand: "GlowLab",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80",
      price: 549,
      qty: 1
    },
    reason: "Damaged Product",
    description: "The package arrived damaged.",
    pickupAddress: {
      name: "Priyank Raj",
      phone: "9876543210",
      address: "12 Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001"
    },
    pickupDate: "05 Sep 2026",
    refundMethod: "Original Payment Method",
    refundAmount: 549,
    status: "Refund Completed",
    createdAt: "01 Sep 2026",
    timeline: [
      {
        title: "Return requested",
        date: "01 Sep 2026",
        status: "completed",
        description: "Your return request was received."
      },
      {
        title: "Pickup completed",
        date: "05 Sep 2026",
        status: "completed",
        description: "Product was successfully collected."
      },
      {
        title: "Quality check",
        date: "07 Sep 2026",
        status: "completed",
        description: "Return quality verification was completed."
      },
      {
        title: "Refund initiated",
        date: "08 Sep 2026",
        status: "completed",
        description: "Refund was initiated."
      },
      {
        title: "Refund completed",
        date: "09 Sep 2026",
        status: "completed",
        description: "Refund was successfully credited."
      }
    ]
  }
];

const returnReasons = [
  "Size/Fit Issue",
  "Wrong Product",
  "Damaged Product",
  "Defective Product",
  "Product Not as Expected",
  "Quality Issue",
  "Missing Item",
  "Other"
];

const statusConfig = {
  "Pickup Scheduled": {
    icon: Truck,
    className: "scheduled"
  },
  "Refund Processing": {
    icon: Clock3,
    className: "processing"
  },
  "Refund Completed": {
    icon: CheckCircle2,
    className: "completed"
  },
  Cancelled: {
    icon: XCircle,
    className: "cancelled"
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

function ReturnStatus({ status }) {
  const config = statusConfig[status] || statusConfig["Pickup Scheduled"];
  const Icon = config.icon;

  return (
    <span className={`returns-status ${config.className}`}>
      <Icon size={14} />
      {status}
    </span>
  );
}

function ReturnTimeline({ timeline }) {
  return (
    <div className="returns-timeline">
      {timeline.map((item, index) => (
        <div
          className={`returns-timeline-item ${item.status}`}
          key={`${item.title}-${index}`}
        >
          <div className="returns-timeline-marker">
            {item.status === "completed" ? (
              <CheckCircle2 size={16} />
            ) : item.status === "current" ? (
              <Clock3 size={16} />
            ) : (
              <span />
            )}
          </div>

          <div className="returns-timeline-content">
            <div className="returns-timeline-top">
              <strong>{item.title}</strong>
              <span>{item.date}</span>
            </div>
            <p>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReturnCard({ item, onOpen }) {
  return (
    <article className="return-card">
      <div className="return-card-header">
        <div>
          <span className="return-label">Return ID</span>
          <strong>{item.id}</strong>
        </div>

        <ReturnStatus status={item.status} />
      </div>

      <div className="return-card-product">
        <img src={item.product.image} alt={item.product.name} />

        <div className="return-product-info">
          <span>{item.product.brand}</span>
          <h3>{item.product.name}</h3>
          <p>Order {item.orderId}</p>
          <strong>{formatCurrency(item.refundAmount)}</strong>
        </div>

        <button
          className="return-view-button"
          type="button"
          onClick={() => onOpen(item)}
        >
          View details
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="return-card-meta">
        <div>
          <span>Reason</span>
          <strong>{item.reason}</strong>
        </div>

        <div>
          <span>Pickup</span>
          <strong>{item.pickupDate}</strong>
        </div>

        <div>
          <span>Refund</span>
          <strong>{formatCurrency(item.refundAmount)}</strong>
        </div>
      </div>
    </article>
  );
}

function ReturnRequest({ onSubmit, onBack }) {
  const [selectedProduct, setSelectedProduct] = useState(initialReturns[0].product);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [refundMethod, setRefundMethod] = useState("Original Payment Method");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason) {
      setError("Please select a return reason.");
      return;
    }

    setError("");
    setSubmitting(true);

    const payload = {
      product: selectedProduct,
      reason,
      description,
      refundMethod,
      requestedAt: new Date().toISOString()
    };

    try {
      await onSubmit?.(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="return-request-page">
      <div className="return-request-header">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <span>ORDER SUPPORT</span>
          <h1>Return a product</h1>
          <p>Tell us what went wrong and we’ll guide you through the return.</p>
        </div>
      </div>

      <form className="return-request-layout" onSubmit={handleSubmit}>
        <div className="return-request-main">
          <div className="return-form-section">
            <div className="return-section-heading">
              <span>01</span>
              <div>
                <h2>Select product</h2>
                <p>Choose the item you want to return.</p>
              </div>
            </div>

            <div className="return-product-selector">
              {initialReturns.map((item) => {
                const active = selectedProduct.id === item.product.id;

                return (
                  <button
                    className={`return-product-option ${active ? "active" : ""}`}
                    type="button"
                    key={item.product.id}
                    onClick={() => setSelectedProduct(item.product)}
                  >
                    <img src={item.product.image} alt={item.product.name} />

                    <span>
                      <strong>{item.product.name}</strong>
                      <small>{item.product.brand}</small>
                      <b>{formatCurrency(item.product.price)}</b>
                    </span>

                    <span className="return-radio">
                      {active && <span />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="return-form-section">
            <div className="return-section-heading">
              <span>02</span>
              <div>
                <h2>Why are you returning it?</h2>
                <p>Select the reason that best describes the issue.</p>
              </div>
            </div>

            <div className="return-reason-grid">
              {returnReasons.map((item) => (
                <button
                  className={reason === item ? "active" : ""}
                  type="button"
                  key={item}
                  onClick={() => setReason(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="return-field">
              <span>Additional details</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell us anything else we should know..."
                rows={5}
                maxLength={500}
              />
              <small>{description.length}/500</small>
            </label>
          </div>

          <div className="return-form-section">
            <div className="return-section-heading">
              <span>03</span>
              <div>
                <h2>Refund method</h2>
                <p>Choose where you want your refund to be credited.</p>
              </div>
            </div>

            <div className="refund-method-grid">
              {[
                {
                  title: "Original Payment Method",
                  description: "Refund to the payment method used for this order."
                },
                {
                  title: "D2C Wallet",
                  description: "Get the refund in your D2C wallet."
                }
              ].map((method) => {
                const active = refundMethod === method.title;

                return (
                  <button
                    type="button"
                    className={`refund-method ${active ? "active" : ""}`}
                    key={method.title}
                    onClick={() => setRefundMethod(method.title)}
                  >
                    <span className="refund-method-radio">
                      {active && <span />}
                    </span>

                    <span>
                      <strong>{method.title}</strong>
                      <small>{method.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="return-form-error">{error}</div>}

          <button
            className="submit-return-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit return request"}
            <ChevronRight size={18} />
          </button>
        </div>

        <aside className="return-request-sidebar">
          <div className="return-policy-card">
            <ShieldCheck size={22} />
            <h3>Easy returns</h3>
            <p>
              Return eligibility, pickup availability and refund timing will
              be checked against your order.
            </p>
          </div>

          <div className="return-summary-card">
            <span>RETURN SUMMARY</span>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
            />

            <h3>{selectedProduct.name}</h3>
            <p>{selectedProduct.brand}</p>

            <div>
              <span>Refund amount</span>
              <strong>{formatCurrency(selectedProduct.price)}</strong>
            </div>

            <div>
              <span>Refund method</span>
              <strong>{refundMethod}</strong>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}

export default function ReturnsPage({
  returns = initialReturns,
  loading = false,
  onSubmitReturn,
  onCancelReturn,
  onOpenReturn,
  onBack
}) {
  const navigate = useNavigate();
  const [activeReturn, setActiveReturn] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showRequest, setShowRequest] = useState(false);

  const safeReturns = Array.isArray(returns) ? returns : initialReturns;

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeReturns.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesSearch =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.orderId.toLowerCase().includes(query) ||
        item.product.name.toLowerCase().includes(query) ||
        item.product.brand.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [safeReturns, search, statusFilter]);

  const handleOpen = (item) => {
    setActiveReturn(item);
    onOpenReturn?.(item);
  };

  const handleSubmit = async (payload) => {
    await onSubmitReturn?.(payload);
    setShowRequest(false);
  };

  if (showRequest) {
    return (
      <ReturnRequest
        onSubmit={handleSubmit}
        onBack={() => setShowRequest(false)}
      />
    );
  }

  if (activeReturn) {
    return (
      <section className="return-details-page">
        <div className="return-details-header">
          <button type="button" onClick={() => setActiveReturn(null)}>
            <ArrowLeft size={18} />
            Back to returns
          </button>

          <div>
            <span>RETURN DETAILS</span>
            <h1>{activeReturn.id}</h1>
            <p>Order {activeReturn.orderId}</p>
          </div>

          <ReturnStatus status={activeReturn.status} />
        </div>

        <div className="return-details-layout">
          <main>
            <div className="return-detail-product">
              <img
                src={activeReturn.product.image}
                alt={activeReturn.product.name}
              />

              <div>
                <span>{activeReturn.product.brand}</span>
                <h2>{activeReturn.product.name}</h2>
                <p>Return reason: {activeReturn.reason}</p>
                <strong>{formatCurrency(activeReturn.refundAmount)}</strong>
              </div>
            </div>

            <div className="return-detail-section">
              <div className="return-detail-heading">
                <Package size={19} />
                <div>
                  <h2>Return progress</h2>
                  <p>Track every step of your return.</p>
                </div>
              </div>

              <ReturnTimeline timeline={activeReturn.timeline} />
            </div>

            <div className="return-detail-section">
              <div className="return-detail-heading">
                <Truck size={19} />
                <div>
                  <h2>Pickup information</h2>
                  <p>Details for the return pickup.</p>
                </div>
              </div>

              <div className="return-info-grid">
                <div>
                  <span>Pickup date</span>
                  <strong>{activeReturn.pickupDate}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{activeReturn.pickupAddress.phone}</strong>
                </div>

                <div className="full">
                  <span>Pickup address</span>
                  <strong>
                    {activeReturn.pickupAddress.name},{" "}
                    {activeReturn.pickupAddress.address},{" "}
                    {activeReturn.pickupAddress.city},{" "}
                    {activeReturn.pickupAddress.state} -{" "}
                    {activeReturn.pickupAddress.pincode}
                  </strong>
                </div>
              </div>
            </div>

            <div className="return-detail-section">
              <div className="return-detail-heading">
                <RotateCcw size={19} />
                <div>
                  <h2>Refund information</h2>
                  <p>How your refund will be processed.</p>
                </div>
              </div>

              <div className="return-info-grid">
                <div>
                  <span>Refund amount</span>
                  <strong>{formatCurrency(activeReturn.refundAmount)}</strong>
                </div>

                <div>
                  <span>Refund method</span>
                  <strong>{activeReturn.refundMethod}</strong>
                </div>
              </div>
            </div>
          </main>

          <aside className="return-details-sidebar">
            <div className="return-help-card">
              <ShieldCheck size={22} />
              <h3>Need help?</h3>
              <p>
                If something looks incorrect with your return, our support
                team can help.
              </p>

              <button type="button" onClick={() => navigate("/account")}>
                Contact support
              </button>
            </div>

            {activeReturn.status !== "Refund Completed" &&
              activeReturn.status !== "Cancelled" && (
                <button
                  className="cancel-return-button"
                  type="button"
                  onClick={() => onCancelReturn?.(activeReturn)}
                >
                  Cancel return request
                </button>
              )}
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="returns-page">
      <div className="returns-page-header">
        <div>
          <span>MY ORDERS</span>
          <h1>Returns & Refunds</h1>
          <p>Track your return requests and refund progress.</p>
        </div>

        <button
          className="new-return-button"
          type="button"
          onClick={() => setShowRequest(true)}
        >
          <RotateCcw size={18} />
          Start a return
        </button>
      </div>

      <div className="returns-toolbar">
        <div className="returns-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search return or order ID"
          />
        </div>

        <div className="returns-filters">
          {[
            "All",
            "Pickup Scheduled",
            "Refund Processing",
            "Refund Completed",
            "Cancelled"
          ].map((status) => (
            <button
              type="button"
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="returns-loading">
          <div />
          <div />
          <div />
        </div>
      ) : filteredReturns.length ? (
        <div className="returns-list">
          {filteredReturns.map((item) => (
            <ReturnCard
              key={item.id}
              item={item}
              onOpen={handleOpen}
            />
          ))}
        </div>
      ) : (
        <div className="returns-empty">
          <div className="returns-empty-icon">
            <RotateCcw size={28} />
          </div>
          <h2>No returns found</h2>
          <p>
            {search
              ? "Try a different return ID, order ID or product."
              : "Your return requests will appear here."}
          </p>
          <button type="button" onClick={() => setShowRequest(true)}>
            Start a return
          </button>
        </div>
      )}
    </section>
  );
}