/*
 * Shipping console — D2C Mall's own Shiprocket-style panel.
 * Orders (New → Ready to ship → Pickup → In transit → Delivered / NDR / RTO),
 * NDR, RTO, COD remittance, manifests, rate calculator, reports, settings.
 * React → /api/shiprocket/* → Shiprocket API (live) · built-in simulator (demo)
 */
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AlertTriangle, Calculator, CheckCircle2, ClipboardList, FileText, IndianRupee, PackageOpen, Settings, Truck, Undo2, Zap } from "lucide-react";
import { useBackend, live } from "../../lib/api";
import { useNow } from "../../lib/services/liveSync";
import { formatTime } from "../../lib/format";
import { AdminHeader, Kpi } from "./AdminBits";
import ShippingOrders, { useShipRows } from "./shipping/ShippingOrders";
import { ManifestPanel, NdrPanel, RateCalculator, RemittancePanel, ReportsPanel, RtoPanel, SettingsPanel } from "./shipping/ShippingPanels";
import "./AdminShipmentsPage.css";

const SUB = [
  ["", "Orders", ClipboardList],
  ["ndr", "NDR", AlertTriangle],
  ["rto", "RTO", Undo2],
  ["remittance", "COD remittance", IndianRupee],
  ["manifests", "Manifests", FileText],
  ["rates", "Rate calculator", Calculator],
  ["reports", "Reports", CheckCircle2],
  ["settings", "Settings", Settings],
];

export default function AdminShipmentsPage({ admin }) {
  const now = useNow(5000);
  useBackend();
  const rows = useShipRows(admin, now);
  const count = (t) => rows.filter((r) => r.tab === t).length;
  const isLive = live("shiprocket");

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Logistics · Shipping"
        title="Shipping"
        sub={`${isLive ? "Live · connected to Shiprocket" : "Demo mode · courier network simulated"} · updated ${formatTime(now)}`}
        actions={<span className={isLive ? "badge badge-soft-green" : "badge badge-soft-amber"}>{isLive ? "Shiprocket connected" : "Demo mode — add Shiprocket keys to go live"}</span>}
      />
      <div className="adm-kpis">
        <Kpi icon={PackageOpen} label="New (to ship)" value={count("new")} tone="blue" delta="Click Ship now" />
        <Kpi icon={Zap} label="Ready to ship" value={count("ready")} tone="purple" delta="AWB assigned" />
        <Kpi icon={Truck} label="Pickup / in transit" value={count("pickup") + count("in_transit")} tone="orange" />
        <Kpi icon={AlertTriangle} label="NDR" value={count("ndr")} tone="red" delta="Needs action" />
        <Kpi icon={Undo2} label="RTO" value={count("rto")} tone="amber" />
        <Kpi icon={CheckCircle2} label="Delivered" value={count("delivered")} tone="green" />
      </div>
      <nav className="sr-subnav">
        {SUB.map(([path, label, Icon]) => (
          <NavLink key={path} to={`/admin/shipments${path ? `/${path}` : ""}`} end={!path}>
            <Icon size={15} /> {label}
            {path === "ndr" && count("ndr") ? <span className="adm-badge">{count("ndr")}</span> : null}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<ShippingOrders admin={admin} />} />
        <Route path="ndr" element={<NdrPanel admin={admin} />} />
        <Route path="rto" element={<RtoPanel admin={admin} />} />
        <Route path="remittance" element={<RemittancePanel admin={admin} />} />
        <Route path="manifests" element={<ManifestPanel admin={admin} />} />
        <Route path="rates" element={<div className="card card-pad"><RateCalculator /></div>} />
        <Route path="reports" element={<ReportsPanel admin={admin} />} />
        <Route path="settings" element={<SettingsPanel admin={admin} />} />
        <Route path="*" element={<Navigate to="/admin/shipments" replace />} />
      </Routes>
    </div>
  );
}
