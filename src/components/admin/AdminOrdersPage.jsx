import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Filter,
  MapPin,
  Package,
  Search,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminOrdersPage.css";

const INITIAL_ORDERS = [
  {
    id: "D2C24092381",
    customer: "Aarohi Sharma",
    phone: "+91 98765 42108",
    email: "aarohi@example.com",
    items: [
      {
        name: "Relaxed Fit Cotton Shirt",
        sku: "D2C-SHIRT-001",
        qty: 1,
        price: 899,
        size: "M",
        color: "White",
      },
      {
        name: "Minimal Gold-Tone Necklace",
        sku: "D2C-NECK-001",
        qty: 1,
        price: 799,
        size: "One Size",
        color: "Gold",
      },
    ],
    amount: 1698,
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Shipped",
    warehouse: "Bhiwandi",
    carrier: "Delhivery",
    awb: "DLV784321905",
    orderDate: "23 Sep 2026, 08:42 PM",
    delivery: "27 Sep 2026",
    address: "Bandra West, Mumbai, Maharashtra",
  },
  {
    id: "D2C24092380",
    customer: "Rohan Mehta",
    phone: "+91 98111 23891",
    email: "rohan@example.com",
    items: [
      {
        name: "Premium Oversized T-Shirt",
        sku: "D2C-TSHIRT-001",
        qty: 1,
        price: 699,
        size: "L",
        color: "Black",
      },
    ],
    amount: 699,
    payment: "Paid",
    paymentMethod: "Card",
    status: "Processing",
    warehouse: "Delhi NCR",
    carrier: "",
    awb: "",
    orderDate: "23 Sep 2026, 08:36 PM",
    delivery: "28 Sep 2026",
    address: "Gurugram, Haryana",
  },
  {
    id: "D2C24092379",
    customer: "Ananya Singh",
    phone: "+91 99100 78211",
    email: "ananya@example.com",
    items: [
      {
        name: "Hydrating Glow Face Serum",
        sku: "D2C-SERUM-001",
        qty: 1,
        price: 549,
        size: "30ml",
        color: "Natural",
      },
      {
        name: "Everyday Street Sneakers",
        sku: "D2C-SNEAK-001",
        qty: 1,
        price: 1499,
        size: "7",
        color: "White",
      },
      {
        name: "Minimal Gold-Tone Necklace",
        sku: "D2C-NECK-001",
        qty: 1,
        price: 799,
        size: "One Size",
        color: "Gold",
      },
    ],
    amount: 2847,
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Out for Delivery",
    warehouse: "Bengaluru",
    carrier: "Delhivery",
    awb: "DLV784321776",
    orderDate: "23 Sep 2026, 07:59 PM",
    delivery: "24 Sep 2026",
    address: "Indiranagar, Bengaluru, Karnataka",
  },
  {
    id: "D2C24092378",
    customer: "Kabir Verma",
    phone: "+91 98710 44021",
    email: "kabir@example.com",
    items: [
      {
        name: "Everyday Street Sneakers",
        sku: "D2C-SNEAK-001",
        qty: 1,
        price: 1499,
        size: "9",
        color: "Black",
      },
    ],
    amount: 1499,
    payment: "Pending",
    paymentMethod: "COD",
    status: "Processing",
    warehouse: "Jaipur",
    carrier: "",
    awb: "",
    orderDate: "23 Sep 2026, 07:44 PM",
    delivery: "29 Sep 2026",
    address: "Vaishali Nagar, Jaipur, Rajasthan",
  },
  {
    id: "D2C24092377",
    customer: "Meher Khan",
    phone: "+91 98999 11722",
    email: "meher@example.com",
    items: [
      {
        name: "Flowy Printed Midi Dress",
        sku: "D2C-DRESS-001",
        qty: 1,
        price: 1299,
        size: "M",
        color: "Blue",
      },
      {
        name: "Hydrating Glow Face Serum",
        sku: "D2C-SERUM-001",
        qty: 1,
        price: 549,
        size: "30ml",
        color: "Natural",
      },
    ],
    amount: 1848,
    payment: "Paid",
    paymentMethod: "Card",
    status: "Delivered",
    warehouse: "Delhi NCR",
    carrier: "Blue Dart",
    awb: "BD784321611",
    orderDate: "22 Sep 2026, 05:31 PM",
    delivery: "23 Sep 2026",
    address: "Noida Sector 62, Uttar Pradesh",
  },
  {
    id: "D2C24092376",
    customer: "Ishaan Roy",
    phone: "+91 98311 55208",
    email: "ishaan@example.com",
    items: [
      {
        name: "Wireless Noise-Cancelling Headphones",
        sku: "D2C-HEAD-001",
        qty: 1,
        price: 2499,
        size: "One Size",
        color: "Black",
      },
    ],
    amount: 2499,
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Shipped",
    warehouse: "Bhiwandi",
    carrier: "Ecom Express",
    awb: "EC784321504",
    orderDate: "22 Sep 2026, 04:18 PM",
    delivery: "26 Sep 2026",
    address: "Salt Lake, Kolkata, West Bengal",
  },
  {
    id: "D2C24092375",
    customer: "Diya Kapoor",
    phone: "+91 98100 77122",
    email: "diya@example.com",
    items: [
      {
        name: "Modern Accent Table Lamp",
        sku: "D2C-LAMP-001",
        qty: 1,
        price: 1199,
        size: "Standard",
        color: "Beige",
      },
    ],
    amount: 1199,
    payment: "Paid",
    paymentMethod: "Card",
    status: "Cancelled",
    warehouse: "Jaipur",
    carrier: "",
    awb: "",
    orderDate: "22 Sep 2026, 01:12 PM",
    delivery: "",
    address: "Kothrud, Pune, Maharashtra",
  },
  {
    id: "D2C24092374",
    customer: "Vivaan Patel",
    phone: "+91 99251 33770",
    email: "vivaan@example.com",
    items: [
      {
        name: "Relaxed Fit Cotton Shirt",
        sku: "D2C-SHIRT-001",
        qty: 2,
        price: 899,
        size: "L",
        color: "Blue",
      },
    ],
    amount: 1798,
    payment: "Paid",
    paymentMethod: "UPI",
    status: "Processing",
    warehouse: "Bhiwandi",
    carrier: "",
    awb: "",
    orderDate: "22 Sep 2026, 11:47 AM",
    delivery: "27 Sep 2026",
    address: "Navrangpura, Ahmedabad, Gujarat",
  },
];

const STATUS_OPTIONS = [
  "All",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const PAYMENT_OPTIONS = [
  "All",
  "Paid",
  "Pending",
  "Failed",
];

const WAREHOUSE_OPTIONS = [
  "All",
  "Bhiwandi",
  "Delhi NCR",
  "Jaipur",
  "Bengaluru",
];

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest first",
  },
  {
    value: "oldest",
    label: "Oldest first",
  },
  {
    value: "amount-high",
    label: "Amount: high to low",
  },
  {
    value: "amount-low",
    label: "Amount: low to high",
  },
];

function StatusBadge({ status }) {
  const className = status
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span
      className={`orders-status ${className}`}
    >
      <i />
      {status}
    </span>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <label className="orders-filter-select">
      <span>{label}</span>

      <div>
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >
          {options.map((option) => (
            <option
              value={option}
              key={option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown size={13} />
      </div>
    </label>
  );
}

function OrderDetails({
  order,
  onClose,
  onStatusChange,
}) {
  if (!order) {
    return null;
  }

  return (
    <motion.aside
      className="order-details-drawer"
      initial={{
        x: "100%",
      }}
      animate={{
        x: 0,
      }}
      exit={{
        x: "100%",
      }}
    >
      <div className="order-details-header">
        <div>
          <span>ORDER DETAILS</span>
          <h2>{order.id}</h2>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="order-details-body">
        <section className="order-detail-status">
          <div>
            <StatusBadge
              status={order.status}
            />

            <span>
              Placed {order.orderDate}
            </span>
          </div>

          <div className="order-status-actions">
            <label>
              Update status

              <select
                value={order.status}
                onChange={(event) =>
                  onStatusChange?.(
                    order.id,
                    event.target.value
                  )
                }
              >
                {STATUS_OPTIONS.filter(
                  (item) =>
                    item !== "All"
                ).map((status) => (
                  <option
                    value={status}
                    key={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="order-detail-block">
          <header>
            <UserRound size={15} />
            <span>Customer</span>
          </header>

          <div className="order-customer-detail">
            <strong>
              {order.customer}
            </strong>

            <span>{order.phone}</span>
            <span>{order.email}</span>
            <p>
              <MapPin size={13} />
              {order.address}
            </p>
          </div>
        </section>

        <section className="order-detail-block">
          <header>
            <Package size={15} />
            <span>Items</span>
          </header>

          <div className="order-items-list">
            {order.items.map(
              (item, index) => (
                <article
                  key={`${item.sku}-${index}`}
                >
                  <div className="order-item-image">
                    <Package size={18} />
                  </div>

                  <div>
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      {item.sku}
                    </span>

                    <small>
                      {item.size} ·{" "}
                      {item.color} · Qty{" "}
                      {item.qty}
                    </small>
                  </div>

                  <strong>
                    ₹
                    {(
                      item.price *
                      item.qty
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </article>
              )
            )}
          </div>
        </section>

        <section className="order-detail-block">
          <header>
            <Truck size={15} />
            <span>Fulfilment</span>
          </header>

          <div className="order-fulfilment-grid">
            <div>
              <span>Warehouse</span>
              <strong>
                {order.warehouse}
              </strong>
            </div>

            <div>
              <span>Carrier</span>
              <strong>
                {order.carrier ||
                  "Not assigned"}
              </strong>
            </div>

            <div>
              <span>AWB</span>
              <strong>
                {order.awb ||
                  "Not generated"}
              </strong>
            </div>

            <div>
              <span>Expected delivery</span>
              <strong>
                {order.delivery ||
                  "Pending"}
              </strong>
            </div>
          </div>
        </section>

        <section className="order-detail-block">
          <header>
            <Clock3 size={15} />
            <span>Payment</span>
          </header>

          <div className="order-payment-summary">
            <div>
              <span>Status</span>
              <StatusBadge
                status={order.payment}
              />
            </div>

            <div>
              <span>Method</span>
              <strong>
                {order.paymentMethod}
              </strong>
            </div>

            <div>
              <span>Order total</span>
              <strong>
                ₹
                {order.amount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="order-detail-actions">
          <button type="button">
            <Truck size={14} />
            Manage shipment
          </button>

          <button type="button">
            <Download size={14} />
            Download invoice
          </button>
        </section>
      </div>
    </motion.aside>
  );
}

export default function AdminOrdersPage({
  orders: externalOrders,
  onOrderStatusChange,
  onExport,
}) {
  const [orders, setOrders] =
    useState(
      externalOrders || INITIAL_ORDERS
    );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [payment, setPayment] =
    useState("All");

  const [warehouse, setWarehouse] =
    useState("All");

  const [sort, setSort] =
    useState("newest");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(6);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [mobileFilters, setMobileFilters] =
    useState(false);

  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result = orders.filter(
        (order) => {
          const matchesSearch =
            !query ||
            `${order.id} ${order.customer} ${order.phone} ${order.email} ${order.warehouse} ${order.awb}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === "All" ||
            order.status === status;

          const matchesPayment =
            payment === "All" ||
            order.payment === payment;

          const matchesWarehouse =
            warehouse === "All" ||
            order.warehouse ===
              warehouse;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment &&
            matchesWarehouse
          );
        }
      );

      return [...result].sort(
        (a, b) => {
          if (sort === "amount-high") {
            return b.amount - a.amount;
          }

          if (sort === "amount-low") {
            return a.amount - b.amount;
          }

          const dateA =
            new Date(a.orderDate).getTime();
          const dateB =
            new Date(b.orderDate).getTime();

          if (sort === "oldest") {
            return dateA - dateB;
          }

          return dateB - dateA;
        }
      );
    }, [
      orders,
      search,
      status,
      payment,
      warehouse,
      sort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleOrders =
    filteredOrders.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const updateStatus = (
    orderId,
    nextStatus
  ) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
            }
          : order
      )
    );

    setSelectedOrder((current) =>
      current?.id === orderId
        ? {
            ...current,
            status: nextStatus,
          }
        : current
    );

    onOrderStatusChange?.(
      orderId,
      nextStatus
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setPayment("All");
    setWarehouse("All");
    setSort("newest");
    setPage(1);
  };

  const hasFilters =
    search ||
    status !== "All" ||
    payment !== "All" ||
    warehouse !== "All";

  const orderStats = useMemo(
    () => ({
      total: orders.length,
      processing: orders.filter(
        (order) =>
          order.status ===
          "Processing"
      ).length,
      shipped: orders.filter(
        (order) =>
          order.status === "Shipped"
      ).length,
      transit: orders.filter(
        (order) =>
          order.status ===
          "Out for Delivery"
      ).length,
      delivered: orders.filter(
        (order) =>
          order.status === "Delivered"
      ).length,
    }),
    [orders]
  );

  return (
    <main className="admin-orders-page">
      <div className="admin-orders-heading">
        <div>
          <span>ORDER MANAGEMENT</span>

          <h1>Orders</h1>

          <p>
            Manage customer orders, payment state and
            fulfilment from one place.
          </p>
        </div>

        <div className="admin-orders-heading-actions">
          <button
            type="button"
            onClick={() =>
              onExport?.(filteredOrders)
            }
          >
            <Download size={14} />
            Export orders
          </button>
        </div>
      </div>

      <section className="orders-stat-strip">
        <div>
          <span>ALL ORDERS</span>
          <strong>
            {orderStats.total}
          </strong>
        </div>

        <div>
          <span>PROCESSING</span>
          <strong>
            {orderStats.processing}
          </strong>
        </div>

        <div>
          <span>SHIPPED</span>
          <strong>
            {orderStats.shipped}
          </strong>
        </div>

        <div>
          <span>OUT FOR DELIVERY</span>
          <strong>
            {orderStats.transit}
          </strong>
        </div>

        <div>
          <span>DELIVERED</span>
          <strong>
            {orderStats.delivered}
          </strong>
        </div>
      </section>

      <section className="orders-toolbar">
        <div className="orders-search">
          <Search size={15} />

          <input
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );
              setPage(1);
            }}
            placeholder="Search order ID, customer, phone, AWB..."
          />
        </div>

        <div className="orders-toolbar-filters">
          <FilterSelect
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />

          <FilterSelect
            label="Payment"
            value={payment}
            options={PAYMENT_OPTIONS}
            onChange={(value) => {
              setPayment(value);
              setPage(1);
            }}
          />

          <FilterSelect
            label="Warehouse"
            value={warehouse}
            options={WAREHOUSE_OPTIONS}
            onChange={(value) => {
              setWarehouse(value);
              setPage(1);
            }}
          />

          <FilterSelect
            label="Sort"
            value={sort}
            options={SORT_OPTIONS.map(
              (item) => item.label
            )}
            onChange={(label) => {
              const selected =
                SORT_OPTIONS.find(
                  (item) =>
                    item.label ===
                    label
                );

              setSort(
                selected?.value ||
                  "newest"
              );

              setPage(1);
            }}
          />
        </div>

        <button
          type="button"
          className="orders-mobile-filter-button"
          onClick={() =>
            setMobileFilters(
              (current) =>
                !current
            )
          }
        >
          <Filter size={14} />
          Filters
        </button>
      </section>

      {hasFilters && (
        <div className="orders-active-filters">
          <span>
            {filteredOrders.length} matching
            orders
          </span>

          <button
            type="button"
            onClick={resetFilters}
          >
            Clear filters
            <X size={12} />
          </button>
        </div>
      )}

      <section className="admin-orders-table-panel">
        <div className="orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all orders"
                  />
                </th>
                <th>ORDER</th>
                <th>CUSTOMER</th>
                <th>ITEMS</th>
                <th>AMOUNT</th>
                <th>PAYMENT</th>
                <th>FULFILMENT</th>
                <th>WAREHOUSE</th>
                <th>ORDERED</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleOrders.map(
                (order) => (
                  <tr
                    key={order.id}
                    onClick={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                  >
                    <td
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${order.id}`}
                      />
                    </td>

                    <td>
                      <strong>
                        {order.id}
                      </strong>

                      <small>
                        {order.items.length}{" "}
                        {order.items.length ===
                        1
                          ? "product"
                          : "products"}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {order.customer}
                      </strong>

                      <small>
                        {order.phone}
                      </small>
                    </td>

                    <td>
                      {order.items.reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          item.qty,
                        0
                      )}
                    </td>

                    <td>
                      <strong>
                        ₹
                        {order.amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          order.payment
                        }
                      />

                      <small>
                        {order.paymentMethod}
                      </small>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          order.status
                        }
                      />

                      {order.awb && (
                        <small className="order-awb">
                          {order.awb}
                        </small>
                      )}
                    </td>

                    <td>
                      <span className="order-warehouse">
                        <MapPin size={11} />
                        {order.warehouse}
                      </span>
                    </td>

                    <td>
                      <span className="order-date">
                        <Clock3 size={11} />
                        {order.orderDate}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="order-view-button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();
                          setSelectedOrder(
                            order
                          );
                        }}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {visibleOrders.length ===
                0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="orders-empty"
                  >
                    <Search size={25} />

                    <strong>
                      No orders found
                    </strong>

                    <span>
                      Try changing your search
                      or filters.
                    </span>

                    <button
                      type="button"
                      onClick={
                        resetFilters
                      }
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="orders-pagination">
          <div>
            Showing{" "}
            <strong>
              {visibleOrders.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredOrders.length}
            </strong>{" "}
            orders
          </div>

          <div>
            <label>
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );
                  setPage(1);
                }}
              >
                <option value="6">
                  6
                </option>
                <option value="10">
                  10
                </option>
                <option value="20">
                  20
                </option>
              </select>
            </label>

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
            >
              <ChevronLeft size={14} />
            </button>

            <span>
              {currentPage} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </footer>
      </section>

      {mobileFilters && (
        <motion.div
          className="orders-mobile-filters"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
        >
          <div className="orders-mobile-filter-head">
            <strong>Filters</strong>

            <button
              type="button"
              onClick={() =>
                setMobileFilters(
                  false
                )
              }
            >
              <X size={17} />
            </button>
          </div>

          <FilterSelect
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={setStatus}
          />

          <FilterSelect
            label="Payment"
            value={payment}
            options={PAYMENT_OPTIONS}
            onChange={setPayment}
          />

          <FilterSelect
            label="Warehouse"
            value={warehouse}
            options={WAREHOUSE_OPTIONS}
            onChange={setWarehouse}
          />

          <button
            type="button"
            onClick={() => {
              resetFilters();
              setMobileFilters(
                false
              );
            }}
          >
            Apply filters
          </button>
        </motion.div>
      )}

      {selectedOrder && (
        <>
          <div
            className="order-details-backdrop"
            onClick={() =>
              setSelectedOrder(null)
            }
          />

          <OrderDetails
            order={selectedOrder}
            onClose={() =>
              setSelectedOrder(null)
            }
            onStatusChange={
              updateStatus
            }
          />
        </>
      )}
    </main>
  );
}