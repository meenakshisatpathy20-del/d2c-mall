import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Download, Mail, MapPin, Phone, Search, Users, X } from "lucide-react";
import { useStore } from "../../lib/store";
import { updateUser } from "../../lib/services/account";
import { deriveOrderStatus } from "../../lib/orderModel";
import { cx, formatDate, formatDateTime, formatINR, initials } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Drawer, StatusPill } from "../common/ui";
import { AdminHeader, Kpi, exportCsv } from "./AdminBits";
import "./AdminCustomersPage.css";

export default function AdminCustomersPage() {
  const users = useStore((s) => s.users);
  const orders = useStore((s) => s.orders);
  const tickets = useStore((s) => s.tickets);
  const returns = useStore((s) => s.returns);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("spent");
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const list = users.map((u) => {
      const mine = orders.filter((o) => o.userId === u.id);
      const valid = mine.filter((o) => !["cancelled", "payment_failed", "pending_payment"].includes(o.status));
      return { u, orders: mine, count: mine.length, spent: valid.reduce((t, o) => t + o.pricing.total, 0), last: mine[0]?.createdAt || u.createdAt };
    });
    const t = q.toLowerCase();
    return list
      .filter((r) => !t || `${r.u.name} ${r.u.email} ${r.u.phone}`.toLowerCase().includes(t))
      .sort((a, b) => (sort === "spent" ? b.spent - a.spent : sort === "orders" ? b.count - a.count : b.last - a.last));
  }, [users, orders, q, sort]);

  const sel = rows.find((r) => r.u.id === open);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Customer management"
        title="Customers"
        actions={
          <button className="btn btn-sm btn-outline" onClick={() => exportCsv("customers.csv", rows.map((r) => ({ name: r.u.name, email: r.u.email, phone: r.u.phone, orders: r.count, spent: r.spent, joined: formatDate(r.u.createdAt), status: r.u.status || "active" })))}>
            <Download size={14} /> Export
          </button>
        }
      />
      <div className="adm-kpis">
        <Kpi icon={Users} label="Customers" value={users.length} tone="blue" />
        <Kpi icon={Users} label="Repeat buyers" value={rows.filter((r) => r.count > 1).length} tone="green" />
        <Kpi icon={Users} label="Avg. lifetime value" value={formatINR(rows.reduce((t, r) => t + r.spent, 0) / (rows.length || 1))} tone="orange" />
        <Kpi icon={Users} label="Open tickets" value={tickets.filter((t) => t.status !== "resolved").length} tone="red" />
        <Kpi icon={Users} label="Blocked" value={users.filter((u) => u.status === "blocked").length} tone="amber" />
        <Kpi icon={Users} label="New (30 days)" value={users.filter((u) => Date.now() - u.createdAt < 30 * 86400000).length} tone="purple" />
      </div>
      <div className="adm-toolbar">
        <div className="input-group" style={{ flex: 1 }}>
          <span className="addon"><Search size={15} /></span>
          <input className="input" placeholder="Name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="spent">Top spenders</option>
          <option value="orders">Most orders</option>
          <option value="recent">Recently active</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th className="num">Orders</th>
              <th className="num">Lifetime value</th>
              <th>Last activity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.u.id} className={cx("clickable", open === r.u.id && "selected")} onClick={() => setOpen(r.u.id)}>
                <td>
                  <div className="row gap-10">
                    <span className="avatar sm">{initials(r.u.name)}</span>
                    <div>
                      <b className="small">{r.u.name}</b>
                      <div className="xs muted">Joined {formatDate(r.u.createdAt)}</div>
                    </div>
                  </div>
                </td>
                <td className="xs">{r.u.email}<div className="muted">+91 {r.u.phone}</div></td>
                <td className="num small">{r.count}</td>
                <td className="num small bold">{formatINR(r.spent)}</td>
                <td className="xs">{formatDate(r.last)}</td>
                <td>{r.u.status === "blocked" ? <span className="badge badge-soft-red">Blocked</span> : <span className="badge badge-soft-green">Active</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Drawer open={!!sel} onClose={() => setOpen(null)} width="min(100vw, 560px)">
        {sel ? (
          <div className="adm-drawer">
            <div className="adm-drawer-head">
              <div className="row gap-10">
                <span className="avatar">{initials(sel.u.name)}</span>
                <div>
                  <b>{sel.u.name}</b>
                  <div className="xs muted">{sel.u.id}</div>
                </div>
              </div>
              <button className="icon-btn sm" onClick={() => setOpen(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="adm-drawer-body">
              <div className="grid grid-3">
                <div className="soft-panel"><span className="xs muted">Orders</span><b style={{ display: "block", fontSize: 20 }}>{sel.count}</b></div>
                <div className="soft-panel"><span className="xs muted">Spent</span><b style={{ display: "block", fontSize: 20 }}>{formatINR(sel.spent)}</b></div>
                <div className="soft-panel"><span className="xs muted">Returns</span><b style={{ display: "block", fontSize: 20 }}>{returns.filter((r) => r.userId === sel.u.id).length}</b></div>
              </div>
              <div className="col gap-6 small">
                <span className="row gap-6"><Mail size={14} /> {sel.u.email}</span>
                <span className="row gap-6"><Phone size={14} /> +91 {sel.u.phone}</span>
                {sel.u.addresses?.map((a) => (
                  <span key={a.id} className="row gap-6"><MapPin size={14} /> {a.type}: {a.line1}, {a.city} {a.pincode}</span>
                ))}
              </div>
              <div>
                <span className="label">Order history</span>
                <div className="col gap-6 mt-8">
                  {sel.orders.map((o) => (
                    <div key={o.id} className="soft-panel row between">
                      <span className="xs">
                        <b>{o.id}</b> · {formatDateTime(o.createdAt)}
                        <span className="muted" style={{ display: "block" }}>{o.items.map((i) => i.name).join(", ")}</span>
                      </span>
                      <span className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                        <b className="xs">{formatINR(o.pricing.total)}</b>
                        <StatusPill status={deriveOrderStatus(o)} />
                      </span>
                    </div>
                  ))}
                  {!sel.orders.length ? <p className="small muted">No orders yet.</p> : null}
                </div>
              </div>
              <div>
                <span className="label">Support tickets</span>
                <div className="col gap-6 mt-8">
                  {tickets.filter((t) => t.userId === sel.u.id).map((t) => (
                    <div key={t.id} className="soft-panel xs">
                      <b>{t.id}</b> · {t.subject} · <span style={{ textTransform: "capitalize" }}>{t.status.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className={cx("btn", sel.u.status === "blocked" ? "btn-green" : "btn-red")}
                onClick={() => {
                  updateUser(sel.u.id, { status: sel.u.status === "blocked" ? "active" : "blocked" });
                  toast(sel.u.status === "blocked" ? "Customer unblocked" : "Customer blocked");
                }}
              >
                {sel.u.status === "blocked" ? <><CheckCircle2 size={15} /> Unblock customer</> : <><Ban size={15} /> Block customer</>}
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
