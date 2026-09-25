import { useMemo, useState } from "react";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock3,
  XCircle,
  RotateCcw,
  MapPin,
  ChevronRight,
  ShoppingBag,
  Download,
  RefreshCw,
  Star,
  CalendarDays,
  CreditCard,
  CircleHelp,
} from "lucide-react";
import "./OrdersPage.css";

const defaultOrders = [
  {
    id: "D2C-ORD-10482",
    date: "23 Sep 2026",
    status: "Delivered",
    paymentStatus: "Paid",
    paymentMethod: "UPI",
    total: 1898,
    itemCount: 2,
    deliveryDate: "26 Sep 2026",
    address: {
      name: "Priyank Raj",
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
    },
    items: [
      {
        id: "d2c-women-001",
        name: "Relaxed Fit Cotton Shirt",
        brand: "D2C Studio",
        image: "",
        price: 899,
        quantity: 1,
        size: "M",
        color: "White",
      },
      {
        id: "d2c-beauty-001",
        name: "Hydrating Glow Face Serum",
        brand: "GlowLab",
        image: "",
        price: 999,
        quantity: 1,
      },
    ],
  },
  {
    id: "D2C-ORD-10451",
    date: "21 Sep 2026",
    status: "Out for Delivery",
    paymentStatus: "Paid",
    paymentMethod: "Card",
    total: 2499,
    itemCount: 1,
    deliveryDate: "24 Sep 2026",
    address: {
      name: "Priyank Raj",
      line: "Main Road",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834001",
    },
    shipment: {
      awb: "D2CAWB839144",
      carrier: "Delhivery",
      warehouse: "Delhi NCR",
      status: "Out for Delivery",
    },
    items: [
      {
        id: "d2c-electronics-001",
        name: "Wireless Noise-Cancelling Headphones",
        brand: "SoundCore D2C",
        image: "",
        price: 2499,
        quantity: 1,
      },
    ],
  },
  {
    id: "D2C-ORD-10397",
    date: "18 Sep 2026",
    status: "Shipped",
    paymentStatus: "Paid",
    paymentMethod: "UPI",
    total: 1499,
    itemCount: 1,
    deliveryDate: "25 Sep 2026",
    address: {
      name: "Priyank Raj",
      line: "Lalpur",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834001",
    },
    shipment: {
      awb: "D2CAWB838912",
      carrier: "Blue Dart",
      warehouse: "Mumbai Bhiwandi",
      status: "Shipped",
    },
    items: [
      {
        id: "d2c-footwear-001",
        name: "Everyday Street Sneakers",
        brand: "StreetForm",
        image: "",
        price: 1499,
        quantity: 1,
        size: "8",
        color: "White",
      },
    ],
  },
  {
    id: "D2C-ORD-10341",
    date: "15 Sep 2026",
    status: "Processing",
    paymentStatus: "Paid",
    paymentMethod: "Net Banking",
    total: 2398,
    itemCount: 2,
    deliveryDate: "27 Sep 2026",
    address: {
      name: "Priyank Raj",
      line: "Harmu Road",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834001",
    },
    shipment: {
      awb: "",
      carrier: "Shiprocket",
      warehouse: "Jaipur",
      status: "Processing",
    },
    items: [
      {
        id: "d2c-jewellery-001",
        name: "Minimal Gold-Tone Necklace",
        brand: "Lustre",
        image: "",
        price: 799,
        quantity: 1,
      },
      {
        id: "d2c-home-001",
        name: "Modern Accent Table Lamp",
        brand: "CasaForm",
        image: "",
        price: 1599,
        quantity: 1,
      },
    ],
  },
  {
    id: "D2C-ORD-10284",
    date: "10 Sep 2026",
    status: "Returned",
    paymentStatus: "Refunded",
    paymentMethod: "UPI",
    total: 1299,
    itemCount: 1,
    deliveryDate: "13 Sep 2026",
    address: {
      name: "Priyank Raj",
      line: "Morabadi",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834008",
    },
    shipment: {
      awb: "D2CAWB837611",
      carrier: "Delhivery",
      warehouse: "Delhi NCR",
      status: "Returned",
    },
    items: [
      {
        id: "d2c-women-002",
        name: "Flowy Printed Midi Dress",
        brand: "D2C Edit",
        image: "",
        price: 1299,
        quantity: 1,
        size: "M",
        color: "Blue",
      },
    ],
  },
  {
    id: "D2C-ORD-10211",
    date: "05 Sep 2026",
    status: "Cancelled",
    paymentStatus: "Refunded",
    paymentMethod: "COD",
    total: 799,
    itemCount: 1,
    deliveryDate: "",
    address: {
      name: "Priyank Raj",
      line: "Kanke Road",
      city: "Ranchi",
      state: "Jharkhand",
      pincode: "834008",
    },
    shipment: {
      awb: "",
      carrier: "",
      warehouse: "Bengaluru",
      status: "Cancelled",
    },
    items: [
      {
        id: "d2c-jewellery-001",
        name: "Minimal Gold-Tone Necklace",
        brand: "Lustre",
        image: "",
        price: 799,
        quantity: 1,
      },
    ],
  },
];

const tabs = [
  { key: "All", label: "All Orders" },
  { key: "Processing", label: "Processing" },
  { key: "Shipped", label: "Shipped" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Returned", label: "Returned" },
];

const statusConfig = {
  Processing: {
    icon: Clock3,
    className: "order-status-processing",
  },
  Shipped: {
    icon: Truck,
    className: "order-status-shipped",
  },
  "Out for Delivery": {
    icon: Truck,
    className: "order-status-out",
  },
  Delivered: {
    icon: CheckCircle2,
    className: "order-status-delivered",
  },
  Cancelled: {
    icon: XCircle,
    className: "order-status-cancelled",
  },
  Returned: {
    icon: RotateCcw,
    className: "order-status-returned",
  },
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const resolveImage = (item) =>
  item?.image ||
  item?.images?.[0] ||
  item?.thumbnail ||
  "";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.Processing;
  const Icon = config.icon;

  return (
    <span className={`order-status-badge ${config.className}`}>
      <Icon size={14} />
      {status}
    </span>
  );
}

function ProductImage({ item }) {
  const image = resolveImage(item);

  if (image) {
    return (
      <img
        src={image}
        alt={item.name}
        className="order-product-image"
      />
    );
  }

  return (
    <div className="order-product-placeholder">
      <ShoppingBag size={24} />
    </div>
  );
}

function OrderCard({
  order,
  onViewDetails,
  onTrackOrder,
  onBuyAgain,
  onReturn,
  onReview,
}) {
  const canReview = order.status === "Delivered";
  const canReturn =
    order.status === "Delivered" &&
    order.date !== "05 Sep 2026";

  return (
    <article className="order-card">
      <div className="order-card-top">
        <div>
          <div className="order-card-label">Order ID</div>
          <div className="order-id">{order.id}</div>
        </div>

        <div className="order-card-date">
          <CalendarDays size={15} />
          <span>{order.date}</span>
        </div>
      </div>

      <div className="order-card-meta">
        <StatusBadge status={order.status} />

        <span className="order-payment-status">
          <CreditCard size={13} />
          {order.paymentStatus}
        </span>

        <span className="order-item-count">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="order-items">
        {order.items.slice(0, 3).map((item) => (
          <div className="order-item" key={`${order.id}-${item.id}`}>
            <ProductImage item={item} />

            <div className="order-item-info">
              <div className="order-item-brand">{item.brand}</div>
              <div className="order-item-name">{item.name}</div>

              <div className="order-item-variants">
                {item.size && <span>Size: {item.size}</span>}
                {item.color && <span>Color: {item.color}</span>}
                <span>Qty: {item.quantity}</span>
              </div>
            </div>

            <div className="order-item-price">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}

        {order.items.length > 3 && (
          <div className="order-more-items">
            +{order.items.length - 3} more items
          </div>
        )}
      </div>

      <div className="order-delivery-strip">
        <div className="order-delivery-icon">
          {order.status === "Delivered" ? (
            <CheckCircle2 size={17} />
          ) : order.status === "Cancelled" ? (
            <XCircle size={17} />
          ) : (
            <Truck size={17} />
          )}
        </div>

        <div>
          <div className="order-delivery-title">
            {order.status === "Delivered"
              ? `Delivered on ${order.deliveryDate}`
              : order.status === "Cancelled"
                ? "This order was cancelled"
                : order.deliveryDate
                  ? `Expected delivery by ${order.deliveryDate}`
                  : "Delivery information unavailable"}
          </div>

          {order.shipment.awb && (
            <div className="order-delivery-subtitle">
              AWB {order.shipment.awb} · {order.shipment.carrier}
            </div>
          )}
        </div>
      </div>

      <div className="order-card-bottom">
        <div>
          <span className="order-total-label">Order total</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>

        <div className="order-actions">
          <button
            type="button"
            className="order-secondary-btn"
            onClick={() => onViewDetails?.(order)}
          >
            View Details
            <ChevronRight size={15} />
          </button>

          {(order.status === "Processing" ||
            order.status === "Shipped" ||
            order.status === "Out for Delivery") && (
            <button
              type="button"
              className="order-primary-btn"
              onClick={() => onTrackOrder?.(order)}
            >
              Track Order
              <Truck size={15} />
            </button>
          )}

          {canReview && (
            <button
              type="button"
              className="order-outline-btn"
              onClick={() => onReview?.(order)}
            >
              <Star size={15} />
              Review
            </button>
          )}

          {canReturn && (
            <button
              type="button"
              className="order-outline-btn order-return-btn"
              onClick={() => onReturn?.(order)}
            >
              <RotateCcw size={15} />
              Return
            </button>
          )}

          {(order.status === "Delivered" ||
            order.status === "Returned" ||
            order.status === "Cancelled") && (
            <button
              type="button"
              className="order-secondary-btn"
              onClick={() => onBuyAgain?.(order)}
            >
              <RefreshCw size={15} />
              Buy Again
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyOrders({ activeTab, onShop }) {
  return (
    <div className="orders-empty">
      <div className="orders-empty-icon">
        <Package size={34} />
      </div>

      <h3>
        {activeTab === "All"
          ? "You haven't placed any orders yet"
          : `No ${activeTab.toLowerCase()} orders`}
      </h3>

      <p>
        {activeTab === "All"
          ? "Your orders will appear here once you shop something from D2C Mall."
          : "Try another order filter to see your purchases."}
      </p>

      {activeTab === "All" && (
        <button type="button" onClick={onShop}>
          Start Shopping
        </button>
      )}
    </div>
  );
}

export default function OrdersPage({
  orders: ordersProp,
  loading = false,
  onViewDetails,
  onTrackOrder,
  onBuyAgain,
  onReturn,
  onReview,
  onShop,
  onDownloadInvoice,
}) {
  const orders = Array.isArray(ordersProp)
    ? ordersProp
    : defaultOrders;

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const counts = useMemo(() => {
    return tabs.reduce(
      (result, tab) => {
        result[tab.key] =
          tab.key === "All"
            ? orders.length
            : orders.filter(
                (order) => order.status === tab.key
              ).length;

        return result;
      },
      {}
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const matchesTab =
        activeTab === "All" ||
        order.status === activeTab;

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      return [
        order.id,
        order.status,
        order.paymentStatus,
        order.paymentMethod,
        order.shipment?.awb,
        order.shipment?.carrier,
        ...order.items.map((item) => item.name),
        ...order.items.map((item) => item.brand),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch)
        );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-high") {
        return Number(b.total) - Number(a.total);
      }

      if (sort === "price-low") {
        return Number(a.total) - Number(b.total);
      }

      return 0;
    });
  }, [orders, activeTab, search, sort]);

  const totalSpent = useMemo(
    () =>
      orders
        .filter((order) => order.status !== "Cancelled")
        .reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        ),
    [orders]
  );

  const handleDownloadAll = () => {
    if (onDownloadInvoice) {
      onDownloadInvoice(filteredOrders);
      return;
    }

    const content = filteredOrders
      .map(
        (order) =>
          `${order.id},${order.date},${order.status},${order.total}`
      )
      .join("\n");

    const blob = new Blob(
      [`Order ID,Date,Status,Total\n${content}`],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "d2c-orders.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="orders-page">
      <section className="orders-header">
        <div className="orders-heading">
          <div className="orders-heading-icon">
            <ShoppingBag size={23} />
          </div>

          <div>
            <p className="orders-eyebrow">D2C MALL</p>
            <h1>My Orders</h1>
            <p>
              Track your purchases, deliveries and returns
              from one place.
            </p>
          </div>
        </div>

        <div className="orders-header-actions">
          <button
            type="button"
            className="orders-help-btn"
            onClick={() =>
              window.location.href = "/help"
            }
          >
            <CircleHelp size={17} />
            Help Center
          </button>

          <button
            type="button"
            className="orders-download-btn"
            onClick={handleDownloadAll}
          >
            <Download size={16} />
            Export Orders
          </button>
        </div>
      </section>

      <section className="orders-summary">
        <div className="orders-summary-card">
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
          <small>All purchases</small>
        </div>

        <div className="orders-summary-card">
          <span>In Progress</span>
          <strong>
            {counts.Processing +
              counts.Shipped +
              counts["Out for Delivery"]}
          </strong>
          <small>Currently moving</small>
        </div>

        <div className="orders-summary-card">
          <span>Delivered</span>
          <strong>{counts.Delivered}</strong>
          <small>Successfully delivered</small>
        </div>

        <div className="orders-summary-card orders-summary-spend">
          <span>Total Spent</span>
          <strong>{formatPrice(totalSpent)}</strong>
          <small>Across your orders</small>
        </div>
      </section>

      <section className="orders-toolbar">
        <div className="orders-tabs">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={
                activeTab === tab.key
                  ? "orders-tab active"
                  : "orders-tab"
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span>{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="orders-controls">
          <label className="orders-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search order, product or AWB"
            />
          </label>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            className="orders-sort"
          >
            <option value="newest">Newest First</option>
            <option value="price-high">
              Highest Amount
            </option>
            <option value="price-low">
              Lowest Amount
            </option>
          </select>
        </div>
      </section>

      <section className="orders-results">
        <div className="orders-results-top">
          <div>
            <h2>
              {activeTab === "All"
                ? "All Orders"
                : activeTab}
            </h2>
            <span>
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1
                ? "order"
                : "orders"}{" "}
              found
            </span>
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="orders-clear-search"
            >
              Clear search
            </button>
          )}
        </div>

        {loading ? (
          <div className="orders-loading">
            <div className="orders-loading-spinner" />
            <span>Loading your orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders
            activeTab={activeTab}
            onShop={onShop}
          />
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={onViewDetails}
                onTrackOrder={onTrackOrder}
                onBuyAgain={onBuyAgain}
                onReturn={onReturn}
                onReview={onReview}
              />
            ))}
          </div>
        )}
      </section>

      <section className="orders-trust">
        <div className="orders-trust-item">
          <div>
            <MapPin size={18} />
          </div>
          <span>
            Delivery updates are linked to your order
            address.
          </span>
        </div>

        <div className="orders-trust-item">
          <div>
            <Truck size={18} />
          </div>
          <span>
            Shipment tracking updates appear as your
            package moves.
          </span>
        </div>

        <div className="orders-trust-item">
          <div>
            <CheckCircle2 size={18} />
          </div>
          <span>
            Payment and refund information stays attached
            to each order.
          </span>
        </div>
      </section>

      <div className="orders-profile-mini">
        <div className="orders-profile-avatar">
          {getInitials("Priyank Raj")}
        </div>

        <div>
          <strong>Need help with an order?</strong>
          <span>
            Our support team can help with delivery,
            returns and payments.
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            (window.location.href = "/help")
          }
        >
          Get Help
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}