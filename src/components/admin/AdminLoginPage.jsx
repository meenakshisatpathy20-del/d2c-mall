import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, Store, Truck, Users, Warehouse } from "lucide-react";
import { ROLES, adminLogin, useAdmin } from "../../lib/services/account";
import { ADMIN_ACCOUNTS } from "../../data/seed";
import { getWarehouse } from "../../data/logistics";
import { useDocumentTitle } from "../common/ui";
import "./AdminLoginPage.css";

const ROLE_ICON = { super_admin: ShieldCheck, warehouse_admin: Warehouse, support: Users, logistics: Truck };

export default function AdminLoginPage() {
  useDocumentTitle("Admin login");
  const admin = useAdmin();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to={params.get("next") || "/admin"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Enter your admin ID and password.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const r = await adminLogin(email, password);
    setLoading(false);
    if (!r.ok) return setError(r.error);
    navigate(params.get("next") || "/admin", { replace: true });
  };

  return (
    <div className="alogin">
      <div className="alogin-grid" />
      <Link to="/" className="alogin-back">
        <ArrowLeft size={16} /> Back to store
      </Link>
      <motion.div className="alogin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="row gap-10">
          <span className="logo-tile">
            <Store size={22} />
          </span>
          <div>
            <b className="alogin-brand">
              <span style={{ color: "#2457ff" }}>D2C</span>
              <span style={{ color: "#ff6b00" }}>MALL</span>
            </b>
            <span className="xs muted" style={{ display: "block" }}>Warehouse & operations console</span>
          </div>
        </div>
        <h1>Admin sign in</h1>
        <p className="small muted">Authorised staff only. Access is logged and role-restricted.</p>

        <form className="col gap-16 mt-16" onSubmit={submit}>
          <div className="field">
            <label>Admin ID (email)</label>
            <div className="input-group">
              <span className="addon"><Mail size={15} /></span>
              <input className="input" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} autoComplete="username" placeholder="name@d2cmall.in" />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-group">
              <span className="addon"><KeyRound size={15} /></span>
              <input className="input" type={show ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} autoComplete="current-password" placeholder="••••••••" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow(!show)} aria-label="Toggle password">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error ? <div className="notice error">{error}</div> : null}
          <button className="btn btn-blue btn-lg btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : <Lock size={17} />} Sign in securely
          </button>
        </form>

        <div className="alogin-demo">
          <span className="xs bold muted">DEMO ACCOUNTS — click to fill</span>
          {ADMIN_ACCOUNTS.map((a) => {
            const Icon = ROLE_ICON[a.role];
            return (
              <button key={a.id} type="button" onClick={() => { setEmail(a.email); setPassword(a.password); setError(""); }}>
                <span className="alogin-role" style={{ background: ROLES[a.role].color }}>
                  <Icon size={14} />
                </span>
                <span className="grow" style={{ textAlign: "left" }}>
                  <b className="small">{ROLES[a.role].label}</b>
                  <span className="xs muted" style={{ display: "block" }}>
                    {a.email} · {a.password}
                    {a.warehouseId ? ` · ${getWarehouse(a.warehouseId).short}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="xs muted mt-16">Locked for 5 minutes after 5 failed attempts. In production, admin auth runs on the API with bcrypt-hashed passwords, JWT sessions and IP rate limiting.</p>
      </motion.div>
    </div>
  );
}
