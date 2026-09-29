import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Check, Eye, EyeOff, Gift, Lock, Mail, Phone, ShieldCheck, Sparkles, Store, Truck, User, X } from "lucide-react";
import { login, passwordIssues, register, requestOtp, useCurrentUser, verifyOtp } from "../../lib/services/account";
import { DEMO_USER } from "../../data/seed";
import { cx } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Field, useDocumentTitle } from "../common/ui";
import "./LoginPage.css";

export default function LoginPage() {
  useDocumentTitle("Login");
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [method, setMethod] = useState("password");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", otp: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: k === "phone" || k === "otp" ? e.target.value.replace(/\D/g, "") : e.target.value });
    setError("");
  };

  const done = (u, msg) => {
    toast(msg || `Welcome back, ${u.name.split(" ")[0]}!`);
    navigate(next, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    try {
    if (mode === "signup") {
      const r = await register(form);
      if (!r.ok) return setError(r.error);
      return done(r.user, "Account created! ₹100 credits added 🎉");
    }
    if (method === "otp") {
      if (!otpSent) {
        const r = await requestOtp(form.phone);
        if (!r.ok) return setError(r.error);
        setOtpSent(r.otp || "sent");
        if (r.server) toast(`OTP sent to +91 ${form.phone}`);
        else toast.info(`Demo OTP: ${r.otp} (SMS is sent once MSG91 is configured)`, { duration: 8000 });
        return;
      }
      const r = await verifyOtp(form.phone, form.otp);
      if (!r.ok) {
        if (r.needsSignup) setMode("signup");
        return setError(r.error);
      }
      return done(r.user);
    }
    const r = await login(form.email, form.password);
    if (!r.ok) return setError(r.error);
    done(r.user);
    } finally {
      setLoading(false);
    }
  };

  const issues = passwordIssues(form.password);
  const strength = 4 - issues.length;

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="auth-art-inner">
          <Link to="/" className="logo">
            <span className="logo-tile">
              <Store size={22} />
            </span>
            <span className="logo-text">
              <span className="logo-word">
                <span className="d2c" style={{ color: "#8fb0ff" }}>D2C</span>
                <span className="mall">MALL</span>
              </span>
            </span>
          </Link>
          <h1>India's home for homegrown brands.</h1>
          <p>Sign in to track orders, save your wishlist, shop looks from D2C Street and check out in seconds.</p>
          <div className="auth-perks">
            {[
              [Gift, "₹100 off your first order with WELCOME100"],
              [Truck, "Free delivery above ₹499 from 4 hubs"],
              [ShieldCheck, "Razorpay-secured payments & easy returns"],
              [Sparkles, "Personalised picks & early access to drops"],
            ].map(([Icon, t], i) => (
              <motion.div key={t} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <Icon size={18} /> {t}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="seg w-full">
            <button className={cx("grow", mode === "login" && "active")} onClick={() => { setMode("login"); setError(""); }}>
              Login
            </button>
            <button className={cx("grow", mode === "signup" && "active")} onClick={() => { setMode("signup"); setError(""); }}>
              Create account
            </button>
          </div>

          <h2 className="mt-24">{mode === "login" ? "Welcome back 👋" : "Join D2C Mall"}</h2>
          <p className="small muted mt-4">{mode === "login" ? "Login to continue shopping." : "It takes less than a minute."}</p>

          {mode === "login" ? (
            <div className="row gap-6 mt-16">
              <button className={cx("chip", method === "password" && "active-blue")} onClick={() => { setMethod("password"); setOtpSent(null); }}>
                <Mail size={14} /> Email & password
              </button>
              <button className={cx("chip", method === "otp" && "active-blue")} onClick={() => setMethod("otp")}>
                <Phone size={14} /> Mobile OTP
              </button>
            </div>
          ) : null}

          <form className="col gap-16 mt-16" onSubmit={submit} noValidate>
            {mode === "signup" ? (
              <Field label="Full name">
                <div className="input-group">
                  <span className="addon"><User size={15} /></span>
                  <input className="input" value={form.name} onChange={set("name")} autoComplete="name" placeholder="Your name" />
                </div>
              </Field>
            ) : null}

            {mode === "signup" || method === "password" ? (
              <Field label="Email">
                <div className="input-group">
                  <span className="addon"><Mail size={15} /></span>
                  <input className="input" type="email" value={form.email} onChange={set("email")} autoComplete="email" placeholder="you@example.com" />
                </div>
              </Field>
            ) : null}

            {mode === "signup" || method === "otp" ? (
              <Field label="Mobile number">
                <div className="input-group">
                  <span className="addon">+91</span>
                  <input className="input" inputMode="numeric" maxLength={10} value={form.phone} onChange={set("phone")} autoComplete="tel-national" placeholder="10-digit mobile" disabled={!!otpSent && mode === "login"} />
                </div>
              </Field>
            ) : null}

            {mode === "login" && method === "otp" && otpSent ? (
              <Field label="Enter OTP" hint="OTP is valid for 5 minutes">
                <input className="input otp-input" inputMode="numeric" maxLength={6} value={form.otp} onChange={set("otp")} placeholder="••••••" autoFocus />
              </Field>
            ) : null}

            {mode === "signup" || method === "password" ? (
              <Field label="Password">
                <div className="input-group">
                  <span className="addon"><Lock size={15} /></span>
                  <input className="input" type={show ? "text" : "password"} value={form.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="••••••••" />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow(!show)} aria-label="Toggle password">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            ) : null}

            {mode === "signup" && form.password ? (
              <div className="pw-meter">
                <div className="pw-bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cx(i < strength && `s${strength}`)} />
                  ))}
                </div>
                <div className="pw-rules">
                  {["At least 8 characters", "One uppercase letter", "One number", "One special character"].map((r) => (
                    <span key={r} className={cx(!issues.includes(r) && "ok")}>
                      {issues.includes(r) ? <X size={12} /> : <Check size={12} />} {r}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <div className="notice error">{error}</div> : null}

            <button className="btn btn-lg btn-block" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {mode === "signup" ? "Create account" : method === "otp" ? (otpSent ? "Verify & login" : "Send OTP") : "Login"}
            </button>
          </form>

          {mode === "login" ? (
            <button
              className="demo-login"
              onClick={() => {
                setMethod("password");
                setForm({ ...form, email: DEMO_USER.email, password: DEMO_USER.password });
              }}
            >
              <BadgeCheck size={16} />
              <span>
                <b>Use demo account</b>
                <span className="xs muted" style={{ display: "block" }}>
                  {DEMO_USER.email} · {DEMO_USER.password}
                </span>
              </span>
            </button>
          ) : null}

          <p className="xs muted center mt-16">
            By continuing you agree to our Terms of Use & Privacy Policy. Passwords are hashed before storage; sessions expire after 7 days.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
