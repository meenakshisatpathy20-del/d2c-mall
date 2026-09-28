import { Check, ShieldCheck, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { ROLES } from "../../lib/services/account";
import { getWarehouse } from "../../data/logistics";
import { initials } from "../../lib/format";
import { AdminHeader } from "./AdminBits";

const SECTIONS = ["dashboard", "orders", "shipments", "inventory", "warehouses", "returns", "customers", "franchise", "team"];

export default function AdminTeamPage() {
  const admins = useStore((s) => s.admins);
  return (
    <div className="col gap-16">
      <AdminHeader eyebrow="Access control" title="Team & roles" sub="Role-based access control (RBAC). Warehouse admins only see their own hub's data." />
      <div className="grid grid-2">
        {admins.map((a) => (
          <div key={a.id} className="card card-pad row gap-16">
            <span className="avatar lg" style={{ background: ROLES[a.role].color }}>{initials(a.name)}</span>
            <div className="grow">
              <b>{a.name}</b>
              <div className="xs muted">{a.email}</div>
              <div className="row gap-6 mt-8">
                <span className="badge" style={{ background: ROLES[a.role].color, color: "#fff" }}>{ROLES[a.role].label}</span>
                {a.warehouseId ? <span className="badge badge-soft-green">{getWarehouse(a.warehouseId).short}</span> : <span className="badge badge-soft-gray">All hubs</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Permission</th>
              {Object.values(ROLES).map((r) => (
                <th key={r.label}>{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => (
              <tr key={s}>
                <td className="small bold" style={{ textTransform: "capitalize" }}>{s}</td>
                {Object.values(ROLES).map((r) => (
                  <td key={r.label}>{r.can.includes(s) ? <Check size={16} className="text-green" /> : <X size={16} className="faint" />}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="notice info">
        <ShieldCheck size={16} /> In production these permissions are enforced by the API (JWT role claims checked on every request), not just hidden in the UI.
      </div>
    </div>
  );
}
