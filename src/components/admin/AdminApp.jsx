/*
 * Admin / Operations console — protected by admin login + role-based access.
 * Super Admin · Warehouse Admin (scoped to one warehouse) · Customer Support · Logistics
 */
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Boxes, Building2, ExternalLink, LayoutDashboard, LogOut, Package, RotateCcw, ShieldCheck, Store, Truck, Users, Warehouse } from "lucide-react";
import { adminLogout, useAdmin } from "../../lib/services/account";
import { getWarehouse } from "../../data/logistics";
import { useLiveSync } from "../../lib/services/liveSync";
import { useStore } from "../../lib/store";
import { deriveOrderStatus } from "../../lib/orderModel";
import { initials } from "../../lib/format";
import { Denied } from "./AdminBits";
import AdminDashboard from "./AdminDashboard";
import AdminOrdersPage from "./AdminOrdersPage";
import AdminCustomersPage from "./AdminCustomersPage";
import AdminInventoryPage from "./AdminInventoryPage";
import AdminWarehousesPage from "./AdminWarehousesPage";
import AdminShipmentsPage from "./AdminShipmentsPage";
import AdminReturnsPage from "./AdminReturnsPage";
import AdminFranchisePage from "../franchise/AdminFranchisePage";
import AdminTeamPage from "./AdminTeamPage";
import "./AdminDashboard.css";

const NAV = [
  { id: "dashboard", path: "", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", path: "orders", label: "Orders", icon: Package },
  { id: "shipments", path: "shipments", label: "Shipments", icon: Truck },
  { id: "inventory", path: "inventory", label: "Inventory", icon: Boxes },
  { id: "warehouses", path: "warehouses", label: "Warehouses", icon: Warehouse },
  { id: "returns", path: "returns", label: "Returns", icon: RotateCcw },
  { id: "customers", path: "customers", label: "Customers", icon: Users },
  { id: "franchise", path: "franchise", label: "Franchise", icon: Store },
  { id: "team", path: "team", label: "Team & roles", icon: ShieldCheck },
];

function Gate({ id, admin, children }) {
  return admin.permissions.includes(id) ? children : <Denied role={admin.roleLabel} />;
}

export default function AdminApp() {
  const admin = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  useLiveSync(10000);
  const orders = useStore((s) => s.orders);
  const returns = useStore((s) => s.returns);
  const apps = useStore((s) => s.franchiseApps);

  if (!admin) return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />;

  const badges = {
    orders: orders.filter((o) => ["confirmed"].includes(deriveOrderStatus(o))).length,
    shipments: orders.reduce((t, o) => t + o.shipments.filter((s) => s.manualEvents?.some((e) => e.status === "delivery_failed")).length, 0),
    returns: returns.filter((r) => !["refunded", "cancelled", "rejected", "exchange_shipped"].includes(r.status)).length,
    franchise: apps.filter((a) => a.status === "submitted").length,
  };
  const wh = admin.warehouseId ? getWarehouse(admin.warehouseId) : null;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="logo-tile" style={{ width: 38, height: 38, borderRadius: 11 }}>
            <Store size={19} />
          </span>
          <div>
            <b>
              <span style={{ color: "#8fb0ff" }}>D2C</span>
              <span style={{ color: "#ff8a3d" }}>MALL</span>
            </b>
            <span>Operations console</span>
          </div>
        </div>
        <nav className="adm-nav">
          {NAV.filter((n) => admin.permissions.includes(n.id)).map((n) => (
            <NavLink key={n.id} to={`/admin/${n.path}`} end={n.path === ""}>
              <n.icon size={17} /> {n.label}
              {badges[n.id] ? <span className="adm-badge">{badges[n.id]}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> View storefront
          </a>
          <button
            onClick={() => {
              adminLogout();
              navigate("/admin/login");
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <div className="row gap-6 small">
            <span className="live-dot" /> Live · syncing every 10s
            {wh ? (
              <span className="badge badge-soft-green" style={{ marginLeft: 8 }}>
                <Building2 size={11} /> Scoped to {wh.name}
              </span>
            ) : null}
          </div>
          <div className="row gap-10">
            <span className="adm-role" style={{ background: admin.role === "super_admin" ? "#2457ff" : admin.role === "warehouse_admin" ? "#12b76a" : admin.role === "support" ? "#ff6b00" : "#7f56d9" }}>
              {admin.roleLabel}
            </span>
            <span className="avatar sm">{initials(admin.name)}</span>
            <span className="small">
              <b>{admin.name}</b>
              <span className="xs muted" style={{ display: "block" }}>{admin.email}</span>
            </span>
          </div>
        </header>
        <main className="adm-content">
          <Routes>
            <Route index element={<AdminDashboard admin={admin} />} />
            <Route path="orders" element={<Gate id="orders" admin={admin}><AdminOrdersPage admin={admin} /></Gate>} />
            <Route path="shipments" element={<Gate id="shipments" admin={admin}><AdminShipmentsPage admin={admin} /></Gate>} />
            <Route path="inventory" element={<Gate id="inventory" admin={admin}><AdminInventoryPage admin={admin} /></Gate>} />
            <Route path="warehouses" element={<Gate id="warehouses" admin={admin}><AdminWarehousesPage admin={admin} /></Gate>} />
            <Route path="returns" element={<Gate id="returns" admin={admin}><AdminReturnsPage admin={admin} /></Gate>} />
            <Route path="customers" element={<Gate id="customers" admin={admin}><AdminCustomersPage admin={admin} /></Gate>} />
            <Route path="franchise" element={<Gate id="franchise" admin={admin}><AdminFranchisePage admin={admin} /></Gate>} />
            <Route path="team" element={<Gate id="team" admin={admin}><AdminTeamPage admin={admin} /></Gate>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

