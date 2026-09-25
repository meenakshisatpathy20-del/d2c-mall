import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  Factory,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Percent,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminDashboard.css";

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingBag,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
  },
  {
    id: "warehouses",
    label: "Warehouses",
    icon: Factory,
  },
  {
    id: "shipments",
    label: "Shipments",
    icon: Truck,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
  },
  {
    id: "returns",
    label: "Returns",
    icon: RefreshCw,
  },
  {
    id: "franchise",
    label: "Franchise",
    icon: Store,
  },
];

const KPI_DATA = [
  {
    label: "Orders today",
    value: "1,284",
    change: "+12.8%",
    positive: true,
    icon: ShoppingBag,
  },
  {
    label: "Revenue today",
    value: "₹8.42L",
    change: "+18.4%",
    positive: true,
    icon: CircleDollarSign,
  },
  {
    label: "AOV",
    value: "₹1,847",
    change: "+6.2%",
    positive: true,
    icon: BarChart3,
  },
  {
    label: "Pending fulfilment",
    value: "186",
    change: "-9.1%",
    positive: true,
    icon: ClipboardList,
  },
];

const ORDER_DATA = [
  {
    id: "D2C24092381",
    customer: "Aarohi Sharma",
    items: 2,
    amount: 2398,
    payment: "Paid",
    status: "Shipped",
    warehouse: "Bhiwandi",
    time: "4 min ago",
  },
  {
    id: "D2C24092380",
    customer: "Rohan Mehta",
    items: 1,
    amount: 699,
    payment: "Paid",
    status: "Processing",
    warehouse: "Delhi NCR",
    time: "8 min ago",
  },
  {
    id: "D2C24092379",
    customer: "Ananya Singh",
    items: 3,
    amount: 3189,
    payment: "Paid",
    status: "Out for Delivery",
    warehouse: "Bengaluru",
    time: "13 min ago",
  },
  {
    id: "D2C24092378",
    customer: "Kabir Verma",
    items: 1,
    amount: 1499,
    payment: "COD",
    status: "Processing",
    warehouse: "Jaipur",
    time: "19 min ago",
  },
  {
    id: "D2C24092377",
    customer: "Meher Khan",
    items: 2,
    amount: 1648,
    payment: "Paid",
    status: "Delivered",
    warehouse: "Delhi NCR",
    time: "27 min ago",
  },
];

const WAREHOUSE_DATA = [
  {
    name: "Bhiwandi",
    city: "Mumbai",
    orders: 438,
    stock: "92%",
    lowStock: 18,
    status: "Healthy",
  },
  {
    name: "Delhi NCR",
    city: "Delhi",
    orders: 392,
    stock: "88%",
    lowStock: 24,
    status: "Healthy",
  },
  {
    name: "Bengaluru",
    city: "Bengaluru",
    orders: 274,
    stock: "76%",
    lowStock: 31,
    status: "Watch",
  },
  {
    name: "Jaipur",
    city: "Jaipur",
    orders: 180,
    stock: "69%",
    lowStock: 43,
    status: "Watch",
  },
];

const LOW_STOCK = [
  {
    sku: "D2C-SHIRT-001",
    product: "Relaxed Fit Cotton Shirt",
    warehouse: "Bengaluru",
    available: 4,
    threshold: 10,
  },
  {
    sku: "D2C-LAMP-001",
    product: "Modern Accent Table Lamp",
    warehouse: "Jaipur",
    available: 6,
    threshold: 12,
  },
  {
    sku: "D2C-SNEAK-001",
    product: "Everyday Street Sneakers",
    warehouse: "Delhi NCR",
    available: 8,
    threshold: 15,
  },
];

const FRANCHISE_DATA = [
  {
    name: "Arjun Retail Ventures",
    city: "Ranchi",
    model: "FOFO",
    date: "23 Sep",
    status: "New",
  },
  {
    name: "Urban Commerce Pvt Ltd",
    city: "Pune",
    model: "FOCO",
    date: "22 Sep",
    status: "Review",
  },
  {
    name: "NorthStar Retail",
    city: "Delhi NCR",
    model: "FOFO",
    date: "21 Sep",
    status: "Review",
  },
];

function StatusBadge({
  status,
}) {
  const className = status
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span
      className={`admin-status ${className}`}
    >
      <i />
      {status}
    </span>
  );
}

function KPICard({
  item,
}) {
  const Icon = item.icon;

  return (
    <motion.article
      className="admin-kpi-card"
      whileHover={{ y: -2 }}
    >
      <div className="admin-kpi-top">
        <span>{item.label}</span>

        <div>
          <Icon size={16} />
        </div>
      </div>

      <strong>{item.value}</strong>

      <span
        className={
          item.positive
            ? "admin-change positive"
            : "admin-change negative"
        }
      >
        {item.positive ? (
          <ArrowUpRight size={12} />
        ) : (
          <ArrowDownRight size={12} />
        )}

        {item.change}

        <small>
          vs previous period
        </small>
      </span>
    </motion.article>
  );
}

function Overview({
  onNavigate,
}) {
  const [query, setQuery] =
    useState("");

  const filteredOrders =
    useMemo(() => {
      if (!query.trim()) {
        return ORDER_DATA;
      }

      const search =
        query.toLowerCase();

      return ORDER_DATA.filter(
        (order) =>
          `${order.id} ${order.customer} ${order.status} ${order.warehouse}`
            .toLowerCase()
            .includes(search)
      );
    }, [query]);

  return (
    <div className="admin-overview">
      <div className="admin-page-title">
        <div>
          <span>OPERATIONS</span>
          <h1>
            Good evening, Admin.
          </h1>
          <p>
            Here's what is happening across D2C Mall
            today.
          </p>
        </div>

        <div className="admin-title-actions">
          <button type="button">
            <Download size={14} />
            Export
          </button>

          <button type="button">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <section className="admin-kpi-grid">
        {KPI_DATA.map((item) => (
          <KPICard
            key={item.label}
            item={item}
          />
        ))}
      </section>

      <section className="admin-alert-strip">
        <div>
          <AlertTriangle size={17} />
        </div>

        <section>
          <strong>
            43 SKUs are below their stock
            threshold.
          </strong>

          <span>
            Jaipur and Bengaluru currently need the
            most attention.
          </span>
        </section>

        <button
          type="button"
          onClick={() =>
            onNavigate?.("inventory")
          }
        >
          Review inventory
          <ChevronRight size={14} />
        </button>
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-orders-panel">
          <header className="admin-panel-header">
            <div>
              <span>LIVE ORDER FLOW</span>
              <h2>Recent orders</h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("orders")
              }
            >
              View all
              <ChevronRight size={13} />
            </button>
          </header>

          <div className="admin-table-tools">
            <div className="admin-table-search">
              <Search size={14} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Search order..."
              />
            </div>
          </div>

          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>AMOUNT</th>
                  <th>WAREHOUSE</th>
                  <th>STATUS</th>
                  <th>TIME</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>
                          {order.id}
                        </strong>
                        <small>
                          {order.items}{" "}
                          {order.items === 1
                            ? "item"
                            : "items"}
                        </small>
                      </td>

                      <td>
                        {order.customer}
                      </td>

                      <td>
                        ₹
                        {order.amount.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {order.warehouse}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            order.status
                          }
                        />
                      </td>

                      <td>
                        <span className="admin-time">
                          <Clock3
                            size={11}
                          />
                          {order.time}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel admin-warehouse-panel">
          <header className="admin-panel-header">
            <div>
              <span>FULFILMENT NETWORK</span>
              <h2>Warehouses</h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "warehouses"
                )
              }
            >
              Manage
              <ChevronRight size={13} />
            </button>
          </header>

          <div className="admin-warehouse-list">
            {WAREHOUSE_DATA.map(
              (warehouse) => (
                <article
                  key={warehouse.name}
                >
                  <div className="admin-warehouse-icon">
                    <Factory size={16} />
                  </div>

                  <section>
                    <strong>
                      {warehouse.name}
                    </strong>

                    <span>
                      {warehouse.city} ·{" "}
                      {warehouse.orders} orders
                    </span>
                  </section>

                  <div className="admin-stock-meter">
                    <div>
                      <span>
                        Stock health
                      </span>

                      <strong>
                        {warehouse.stock}
                      </strong>
                    </div>

                    <div>
                      <i
                        style={{
                          width:
                            warehouse.stock,
                        }}
                      />
                    </div>
                  </div>

                  <StatusBadge
                    status={
                      warehouse.status
                    }
                  />
                </article>
              )
            )}
          </div>
        </section>
      </div>

      <div className="admin-dashboard-grid lower">
        <section className="admin-panel">
          <header className="admin-panel-header">
            <div>
              <span>ATTENTION NEEDED</span>
              <h2>Low stock</h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.("inventory")
              }
            >
              Inventory
              <ChevronRight size={13} />
            </button>
          </header>

          <div className="admin-low-stock-list">
            {LOW_STOCK.map(
              (item) => (
                <article key={item.sku}>
                  <div>
                    <strong>
                      {item.product}
                    </strong>

                    <span>
                      {item.sku} ·{" "}
                      {item.warehouse}
                    </span>
                  </div>

                  <div className="admin-stock-warning">
                    <strong>
                      {item.available}
                    </strong>

                    <span>
                      left
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="admin-panel">
          <header className="admin-panel-header">
            <div>
              <span>NEW BUSINESS</span>
              <h2>
                Franchise enquiries
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "franchise"
                )
              }
            >
              View all
              <ChevronRight size={13} />
            </button>
          </header>

          <div className="admin-franchise-list">
            {FRANCHISE_DATA.map(
              (application) => (
                <article
                  key={
                    application.name
                  }
                >
                  <div className="admin-franchise-avatar">
                    {application.name[0]}
                  </div>

                  <div>
                    <strong>
                      {application.name}
                    </strong>

                    <span>
                      {application.city} ·{" "}
                      {application.model}
                    </span>
                  </div>

                  <div>
                    <StatusBadge
                      status={
                        application.status
                      }
                    />

                    <small>
                      {application.date}
                    </small>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlaceholderSection({
  section,
  onNavigate,
}) {
  const config = {
    orders: {
      label: "ORDER MANAGEMENT",
      title: "Orders",
      description:
        "Search, filter and manage every customer order and fulfilment state.",
      icon: ShoppingBag,
    },
    inventory: {
      label: "INVENTORY CONTROL",
      title: "Inventory",
      description:
        "Monitor SKU stock, reservations, low-stock thresholds and warehouse availability.",
      icon: Boxes,
    },
    warehouses: {
      label: "FULFILMENT NETWORK",
      title: "Warehouses",
      description:
        "Manage warehouse capacity, stock distribution and fulfilment allocation.",
      icon: Factory,
    },
    shipments: {
      label: "LOGISTICS",
      title: "Shipments",
      description:
        "Track AWB, carriers, shipment states and expected delivery.",
      icon: Truck,
    },
    customers: {
      label: "CUSTOMER MANAGEMENT",
      title: "Customers",
      description:
        "Manage customer profiles, orders, lifetime value and support history.",
      icon: Users,
    },
    returns: {
      label: "RETURNS",
      title: "Returns & Refunds",
      description:
        "Review return requests, refund status and reverse logistics.",
      icon: RefreshCw,
    },
    franchise: {
      label: "BUSINESS DEVELOPMENT",
      title: "Franchise",
      description:
        "Review franchise applications, locations, models and application status.",
      icon: Store,
    },
  };

  const data = config[section];
  const Icon = data.icon;

  return (
    <div className="admin-placeholder">
      <div className="admin-placeholder-icon">
        <Icon size={27} />
      </div>

      <span>{data.label}</span>

      <h1>{data.title}</h1>

      <p>{data.description}</p>

      <div className="admin-placeholder-flow">
        <div>
          <ClipboardList size={15} />
          Data
        </div>

        <ChevronRight size={14} />

        <div>
          <Settings size={15} />
          Operations
        </div>

        <ChevronRight size={14} />

        <div>
          <BarChart3 size={15} />
          Analytics
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onNavigate?.("overview")
        }
      >
        Back to overview
      </button>
    </div>
  );
}

export default function AdminDashboard({
  onLogout,
}) {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const currentLabel =
    NAV_ITEMS.find(
      (item) =>
        item.id === activeSection
    )?.label || "Overview";

  const navigate = (section) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  return (
    <main className="admin-dashboard">
      <aside
        className={`admin-sidebar ${
          mobileOpen ? "open" : ""
        }`}
      >
        <div className="admin-sidebar-brand">
          <div>
            <Store size={18} />
          </div>

          <section>
            <strong>D2C MALL</strong>
            <span>OPERATIONS</span>
          </section>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <X size={17} />
          </button>
        </div>

        <nav className="admin-nav">
          <span>COMMAND CENTER</span>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={
                  activeSection ===
                  item.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  navigate(item.id)
                }
              >
                <Icon size={16} />

                <span>
                  {item.label}
                </span>

                {item.id ===
                  "orders" && (
                  <em>24</em>
                )}

                {item.id ===
                  "inventory" && (
                  <em className="warning">
                    43
                  </em>
                )}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <button type="button">
            <FileText size={15} />
            Reports
          </button>

          <button type="button">
            <Settings size={15} />
            Settings
          </button>

          <button
            type="button"
            onClick={onLogout}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() =>
                setMobileOpen(true)
              }
            >
              <Menu size={19} />
            </button>

            <div>
              <span>OPERATIONS</span>
              <strong>
                {currentLabel}
              </strong>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button type="button">
              <Bell size={17} />
              <i />
            </button>

            <div className="admin-user">
              <div>
                AR
              </div>

              <span>
                <strong>Admin</strong>
                <small>
                  Super Admin
                </small>
              </span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeSection ===
          "overview" ? (
            <Overview
              onNavigate={navigate}
            />
          ) : (
            <PlaceholderSection
              section={
                activeSection
              }
              onNavigate={navigate}
            />
          )}
        </div>
      </section>
    </main>
  );
}