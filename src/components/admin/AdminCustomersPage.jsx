import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminCustomersPage.css";

const INITIAL_CUSTOMERS = [
  {
    id: "CUS-100241",
    name: "Ananya Sharma",
    email: "ananya.sharma@example.com",
    phone: "+91 98XXXXXX41",
    city: "Mumbai",
    state: "Maharashtra",
    status: "Active",
    joined: "12 Jan 2025",
    lastOrder: "23 Sep 2026",
    orders: 18,
    delivered: 16,
    returns: 1,
    cancelled: 1,
    ltv: 42890,
    aov: 2383,
    wishlist: 12,
    addresses: 2,
    payment: "UPI",
    source: "Instagram",
    tags: ["Fashion", "High Value"],
  },
  {
    id: "CUS-100198",
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    phone: "+91 97XXXXXX18",
    city: "Jaipur",
    state: "Rajasthan",
    status: "Active",
    joined: "04 Mar 2025",
    lastOrder: "23 Sep 2026",
    orders: 11,
    delivered: 9,
    returns: 0,
    cancelled: 2,
    ltv: 19680,
    aov: 1789,
    wishlist: 7,
    addresses: 1,
    payment: "COD",
    source: "Google",
    tags: ["Men", "Repeat"],
  },
  {
    id: "CUS-100174",
    name: "Meera Iyer",
    email: "meera.iyer@example.com",
    phone: "+91 96XXXXXX62",
    city: "Bengaluru",
    state: "Karnataka",
    status: "Active",
    joined: "21 Nov 2024",
    lastOrder: "22 Sep 2026",
    orders: 27,
    delivered: 25,
    returns: 1,
    cancelled: 1,
    ltv: 68420,
    aov: 2534,
    wishlist: 21,
    addresses: 3,
    payment: "Card",
    source: "Organic",
    tags: ["Beauty", "VIP"],
  },
  {
    id: "CUS-100143",
    name: "Arjun Nair",
    email: "arjun.nair@example.com",
    phone: "+91 99XXXXXX07",
    city: "Mumbai",
    state: "Maharashtra",
    status: "Active",
    joined: "17 Aug 2025",
    lastOrder: "22 Sep 2026",
    orders: 8,
    delivered: 7,
    returns: 1,
    cancelled: 0,
    ltv: 11490,
    aov: 1436,
    wishlist: 4,
    addresses: 2,
    payment: "UPI",
    source: "Direct",
    tags: ["Electronics"],
  },
  {
    id: "CUS-100121",
    name: "Priya Menon",
    email: "priya.menon@example.com",
    phone: "+91 95XXXXXX33",
    city: "Hyderabad",
    state: "Telangana",
    status: "At Risk",
    joined: "28 Jun 2025",
    lastOrder: "21 Sep 2026",
    orders: 6,
    delivered: 4,
    returns: 1,
    cancelled: 1,
    ltv: 7830,
    aov: 1305,
    wishlist: 9,
    addresses: 2,
    payment: "COD",
    source: "Facebook",
    tags: ["Fashion"],
  },
  {
    id: "CUS-100096",
    name: "Vikram Singh",
    email: "vikram.singh@example.com",
    phone: "+91 94XXXXXX12",
    city: "Delhi",
    state: "Delhi",
    status: "Active",
    joined: "11 Feb 2025",
    lastOrder: "21 Sep 2026",
    orders: 14,
    delivered: 13,
    returns: 0,
    cancelled: 1,
    ltv: 31240,
    aov: 2231,
    wishlist: 11,
    addresses: 2,
    payment: "Card",
    source: "Google",
    tags: ["Men", "Repeat"],
  },
  {
    id: "CUS-100074",
    name: "Kavya Rao",
    email: "kavya.rao@example.com",
    phone: "+91 93XXXXXX64",
    city: "Delhi",
    state: "Delhi",
    status: "Active",
    joined: "03 Dec 2024",
    lastOrder: "20 Sep 2026",
    orders: 22,
    delivered: 20,
    returns: 2,
    cancelled: 0,
    ltv: 52760,
    aov: 2398,
    wishlist: 18,
    addresses: 3,
    payment: "UPI",
    source: "Instagram",
    tags: ["Fashion", "VIP"],
  },
  {
    id: "CUS-100052",
    name: "Nisha Kapoor",
    email: "nisha.kapoor@example.com",
    phone: "+91 92XXXXXX27",
    city: "Pune",
    state: "Maharashtra",
    status: "Inactive",
    joined: "19 Sep 2024",
    lastOrder: "04 Jun 2026",
    orders: 5,
    delivered: 5,
    returns: 0,
    cancelled: 0,
    ltv: 6240,
    aov: 1248,
    wishlist: 3,
    addresses: 1,
    payment: "UPI",
    source: "Direct",
    tags: ["Lifestyle"],
  },
];

const CUSTOMER_STATUSES = [
  "All",
  "Active",
  "At Risk",
  "Inactive",
];

const SOURCES = [
  "All",
  "Instagram",
  "Google",
  "Organic",
  "Direct",
  "Facebook",
];

const ORDER_HISTORY = [
  {
    id: "D2C24092381",
    date: "23 Sep 2026",
    items: 3,
    amount: 2398,
    status: "Delivered",
  },
  {
    id: "D2C24091274",
    date: "12 Sep 2026",
    items: 2,
    amount: 1799,
    status: "Delivered",
  },
  {
    id: "D2C24082651",
    date: "26 Aug 2026",
    items: 1,
    amount: 899,
    status: "Returned",
  },
  {
    id: "D2C24081732",
    date: "17 Aug 2026",
    items: 4,
    amount: 3290,
    status: "Delivered",
  },
  {
    id: "D2C24080318",
    date: "03 Aug 2026",
    items: 2,
    amount: 1499,
    status: "Delivered",
  },
];

const ACTIVITY = [
  {
    type: "order",
    title: "Placed order D2C24092381",
    text: "3 products · ₹2,398",
    time: "23 Sep 2026, 11:24 AM",
  },
  {
    type: "wishlist",
    title: "Added product to wishlist",
    text: "Relaxed Fit Cotton Shirt",
    time: "22 Sep 2026, 08:14 PM",
  },
  {
    type: "address",
    title: "Updated delivery address",
    text: "Home address updated",
    time: "20 Sep 2026, 06:43 PM",
  },
  {
    type: "return",
    title: "Return requested",
    text: "Order D2C24082651",
    time: "28 Aug 2026, 09:17 AM",
  },
];

function CustomerStatus({ status }) {
  return (
    <span
      className={`customer-status ${status
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  );
}

function CustomerDrawer({
  customer,
  onClose,
}) {
  const [activeTab, setActiveTab] =
    useState("overview");

  const tabs = [
    "overview",
    "orders",
    "activity",
  ];

  return (
    <motion.aside
      className="customer-details-drawer"
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
      <header className="customer-drawer-header">
        <div className="customer-profile-heading">
          <div className="customer-avatar-large">
            {customer.name
              .split(" ")
              .map((item) => item[0])
              .join("")
              .slice(0, 2)}
          </div>

          <div>
            <span>CUSTOMER PROFILE</span>
            <h2>{customer.name}</h2>
            <small>
              {customer.id} · {customer.status}
            </small>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="customer-drawer-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={
              activeTab === tab
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(tab)
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="customer-drawer-body">
        {activeTab === "overview" && (
          <>
            <section className="customer-value-grid">
              <div>
                <span>LIFETIME VALUE</span>
                <strong>
                  ₹
                  {customer.ltv.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>AVG ORDER VALUE</span>
                <strong>
                  ₹
                  {customer.aov.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div>
                <span>ORDERS</span>
                <strong>
                  {customer.orders}
                </strong>
              </div>

              <div>
                <span>RETURNS</span>
                <strong>
                  {customer.returns}
                </strong>
              </div>
            </section>

            <section className="customer-drawer-section">
              <header>
                <UserRound size={14} />
                <span>Contact information</span>
              </header>

              <div className="customer-contact-list">
                <div>
                  <Mail size={13} />
                  <span>
                    {customer.email}
                  </span>
                </div>

                <div>
                  <Phone size={13} />
                  <span>
                    {customer.phone}
                  </span>
                </div>

                <div>
                  <MapPin size={13} />
                  <span>
                    {customer.city},{" "}
                    {customer.state}
                  </span>
                </div>

                <div>
                  <CalendarDays size={13} />
                  <span>
                    Joined {customer.joined}
                  </span>
                </div>
              </div>
            </section>

            <section className="customer-drawer-section">
              <header>
                <Package size={14} />
                <span>Order performance</span>
              </header>

              <div className="customer-performance">
                <div>
                  <span>Delivered</span>
                  <strong className="green">
                    {customer.delivered}
                  </strong>
                </div>

                <div>
                  <span>Returned</span>
                  <strong className="orange">
                    {customer.returns}
                  </strong>
                </div>

                <div>
                  <span>Cancelled</span>
                  <strong className="red">
                    {customer.cancelled}
                  </strong>
                </div>
              </div>
            </section>

            <section className="customer-drawer-section">
              <header>
                <MapPin size={14} />
                <span>Saved addresses</span>
              </header>

              <div className="customer-address-card">
                <div>
                  <strong>Home</strong>
                  <span>
                    {customer.name}
                  </span>
                  <span>
                    {customer.city},{" "}
                    {customer.state}
                  </span>
                  <small>
                    Default delivery address
                  </small>
                </div>

                <button type="button">
                  View
                </button>
              </div>
            </section>

            <section className="customer-drawer-section">
              <header>
                <Wallet size={14} />
                <span>Customer preferences</span>
              </header>

              <div className="customer-preferences">
                <div>
                  <span>Preferred payment</span>
                  <strong>
                    {customer.payment}
                  </strong>
                </div>

                <div>
                  <span>Acquisition source</span>
                  <strong>
                    {customer.source}
                  </strong>
                </div>

                <div>
                  <span>Wishlist</span>
                  <strong>
                    {customer.wishlist} products
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "orders" && (
          <section className="customer-drawer-section orders-tab">
            <header>
              <ShoppingBag size={14} />
              <span>Order history</span>
            </header>

            {ORDER_HISTORY.map((order) => (
              <div
                className="customer-order-row"
                key={order.id}
              >
                <div>
                  <strong>
                    {order.id}
                  </strong>

                  <span>
                    {order.date} ·{" "}
                    {order.items} items
                  </span>
                </div>

                <div>
                  <strong>
                    ₹
                    {order.amount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <span
                    className={
                      order.status ===
                      "Returned"
                        ? "returned"
                        : "delivered"
                    }
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === "activity" && (
          <section className="customer-drawer-section">
            <header>
              <Clock3 size={14} />
              <span>Account activity</span>
            </header>

            <div className="customer-activity-list">
              {ACTIVITY.map(
                (activity, index) => (
                  <div
                    key={`${activity.title}-${index}`}
                  >
                    <div>
                      {activity.type ===
                        "order" && (
                        <Package
                          size={13}
                        />
                      )}

                      {activity.type ===
                        "wishlist" && (
                        <ShoppingBag
                          size={13}
                        />
                      )}

                      {activity.type ===
                        "address" && (
                        <MapPin
                          size={13}
                        />
                      )}

                      {activity.type ===
                        "return" && (
                        <RefreshCw
                          size={13}
                        />
                      )}
                    </div>

                    <section>
                      <strong>
                        {activity.title}
                      </strong>

                      <span>
                        {activity.text}
                      </span>

                      <small>
                        {activity.time}
                      </small>
                    </section>
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>

      <footer className="customer-drawer-footer">
        <button type="button">
          <MessageCircle size={13} />
          Contact customer
        </button>

        <button type="button">
          View full account
        </button>
      </footer>
    </motion.aside>
  );
}

export default function AdminCustomersPage({
  customers: externalCustomers,
  onCustomerUpdate,
}) {
  const [customers, setCustomers] =
    useState(
      externalCustomers ||
        INITIAL_CUSTOMERS
    );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [source, setSource] =
    useState("All");

  const [sort, setSort] =
    useState("recent");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(6);

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const filteredCustomers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        customers.filter((customer) => {
          const matchesSearch =
            !query ||
            `${customer.id} ${customer.name} ${customer.email} ${customer.phone} ${customer.city} ${customer.state}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === "All" ||
            customer.status === status;

          const matchesSource =
            source === "All" ||
            customer.source === source;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesSource
          );
        });

      return [...result].sort(
        (a, b) => {
          if (
            sort === "ltv-high"
          ) {
            return b.ltv - a.ltv;
          }

          if (
            sort === "orders-high"
          ) {
            return (
              b.orders -
              a.orders
            );
          }

          if (
            sort === "aov-high"
          ) {
            return b.aov - a.aov;
          }

          return b.id.localeCompare(
            a.id
          );
        }
      );
    }, [
      customers,
      search,
      status,
      source,
      sort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleCustomers =
    filteredCustomers.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const metrics = useMemo(() => {
    const totalCustomers =
      customers.length;

    const active =
      customers.filter(
        (customer) =>
          customer.status ===
          "Active"
      ).length;

    const totalLtv =
      customers.reduce(
        (sum, customer) =>
          sum + customer.ltv,
        0
      );

    const averageLtv =
      totalCustomers
        ? Math.round(
            totalLtv /
              totalCustomers
          )
        : 0;

    const totalOrders =
      customers.reduce(
        (sum, customer) =>
          sum + customer.orders,
        0
      );

    const totalReturns =
      customers.reduce(
        (sum, customer) =>
          sum + customer.returns,
        0
      );

    return {
      totalCustomers,
      active,
      averageLtv,
      totalOrders,
      totalReturns,
    };
  }, [customers]);

  return (
    <main className="admin-customers-page">
      <div className="admin-customers-heading">
        <div>
          <span>CUSTOMER OPERATIONS</span>
          <h1>Customers</h1>
          <p>
            Manage customer profiles, value, orders, returns
            and account activity.
          </p>
        </div>

        <button type="button">
          <RefreshCw size={14} />
          Refresh customers
        </button>
      </div>

      <section className="customer-kpis">
        <div>
          <span>TOTAL CUSTOMERS</span>
          <strong>
            {metrics.totalCustomers}
          </strong>
          <small>
            Registered accounts
          </small>
        </div>

        <div>
          <span>ACTIVE</span>
          <strong className="green">
            {metrics.active}
          </strong>
          <small>
            Active customers
          </small>
        </div>

        <div>
          <span>AVG CUSTOMER LTV</span>
          <strong>
            ₹
            {metrics.averageLtv.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Across customer base
          </small>
        </div>

        <div>
          <span>TOTAL ORDERS</span>
          <strong>
            {metrics.totalOrders}
          </strong>
          <small>
            Customer order count
          </small>
        </div>

        <div>
          <span>RETURNS</span>
          <strong className="orange">
            {metrics.totalReturns}
          </strong>
          <small>
            Customer initiated
          </small>
        </div>
      </section>

      <section className="customer-operations">
        <div className="customer-toolbar">
          <div className="customer-search">
            <Search size={14} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search name, email, phone or customer ID..."
            />
          </div>

          <label>
            <span>Status</span>

            <div>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {CUSTOMER_STATUSES.map(
                  (item) => (
                    <option key={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <label>
            <span>Source</span>

            <div>
              <select
                value={source}
                onChange={(event) => {
                  setSource(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {SOURCES.map(
                  (item) => (
                    <option key={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <label>
            <span>Sort</span>

            <div>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target.value
                  )
                }
              >
                <option value="recent">
                  Recent
                </option>
                <option value="ltv-high">
                  Highest LTV
                </option>
                <option value="orders-high">
                  Most orders
                </option>
                <option value="aov-high">
                  Highest AOV
                </option>
              </select>

              <ChevronDown size={12} />
            </div>
          </label>
        </div>

        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>LOCATION</th>
                <th>ORDERS</th>
                <th>LTV</th>
                <th>AOV</th>
                <th>RETURNS</th>
                <th>LAST ORDER</th>
                <th>STATUS</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleCustomers.map(
                (customer) => (
                  <tr
                    key={customer.id}
                    onClick={() =>
                      setSelectedCustomer(
                        customer
                      )
                    }
                  >
                    <td>
                      <div className="customer-table-profile">
                        <div className="customer-avatar">
                          {customer.name
                            .split(" ")
                            .map(
                              (item) =>
                                item[0]
                            )
                            .join("")
                            .slice(
                              0,
                              2
                            )}
                        </div>

                        <div>
                          <strong>
                            {customer.name}
                          </strong>

                          <span>
                            {customer.email}
                          </span>

                          <small>
                            {customer.id}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="customer-location">
                        <MapPin size={11} />
                        <span>
                          {customer.city},{" "}
                          {customer.state}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {customer.orders}
                      </strong>

                      <span className="customer-order-meta">
                        {customer.delivered} delivered
                      </span>
                    </td>

                    <td>
                      <strong className="customer-money">
                        ₹
                        {customer.ltv.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {customer.aov.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          customer.returns
                            ? "customer-return-count"
                            : "customer-no-return"
                        }
                      >
                        {customer.returns}
                      </span>
                    </td>

                    <td>
                      <span className="customer-last-order">
                        {customer.lastOrder}
                      </span>
                    </td>

                    <td>
                      <CustomerStatus
                        status={
                          customer.status
                        }
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="customer-open-button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setSelectedCustomer(
                            customer
                          );
                        }}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {visibleCustomers.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="customer-empty"
                  >
                    <UserRound size={26} />

                    <strong>
                      No customers found
                    </strong>

                    <span>
                      Try changing your search or
                      filters.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="customer-pagination">
          <span>
            Showing{" "}
            <strong>
              {visibleCustomers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredCustomers.length}
            </strong>{" "}
            customers
          </span>

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
              <ChevronLeft size={13} />
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
              <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </section>

      {selectedCustomer && (
        <>
          <div
            className="customer-drawer-backdrop"
            onClick={() =>
              setSelectedCustomer(null)
            }
          />

          <CustomerDrawer
            customer={selectedCustomer}
            onClose={() =>
              setSelectedCustomer(null)
            }
          />
        </>
      )}
    </main>
  );
}