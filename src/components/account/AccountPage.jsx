import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  Briefcase,
  Coins,
  FileText,
  Ticket,
  Users,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  Gift,
  Heart,
  HelpCircle,
  Home,
  Laptop,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { useStore } from "../../lib/store";
import {
  changePassword,
  clearNotifications,
  deleteAddress,
  isEmail,
  isPhone,
  logout,
  logoutOtherSessions,
  markNotificationsRead,
  passwordIssues,
  saveAddress,
  setDefaultAddress,
  updateUser,
  useCurrentUser,
} from "../../lib/services/account";
import { closeTicket, replyTicket } from "../../lib/services/orders";
import { deriveOrderStatus } from "../../lib/orderModel";
import { posts, getCreator } from "../../data/social";
import { cx, formatDate, formatDateTime, formatINR, initials, timeAgo } from "../../lib/format";
import { toast } from "../../lib/toast";
import WishlistDrawer from "../wishlist/WishlistDrawer";
import { Empty, Field, Img, Modal, StatusPill, Switch, useDocumentTitle } from "../common/ui";
import AddressForm from "./AddressForm";
import { CoinsPanel, GiftCards, MyCoupons, MyReviews, ReferEarn, TaxDetails } from "./AccountExtras";
import { SupportModal } from "../order/OrderBits";
import "./AccountPage.css";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile details", icon: User },
  { id: "addresses", label: "Saved addresses", icon: MapPin },
  { id: "orders", label: "Orders", icon: Package, to: "/orders" },
  { id: "returns", label: "Returns & refunds", icon: RotateCcw, to: "/returns" },
  { id: "wishlist", label: "Wishlist", icon: Heart, to: "/wishlist" },
  { id: "payments", label: "Payments & credits", icon: Wallet },
  { id: "coupons", label: "My coupons", icon: Ticket },
  { id: "coins", label: "D2C Coins", icon: Coins },
  { id: "giftcards", label: "Gift cards", icon: Gift },
  { id: "reviews", label: "Reviews & ratings", icon: Star },
  { id: "refer", label: "Refer & earn", icon: Users },
  { id: "tax", label: "PAN & GST details", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "looks", label: "Saved looks", icon: Bookmark },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "security", label: "Security & sessions", icon: ShieldCheck },
  { id: "help", label: "Help & support", icon: LifeBuoy },
];

/* ---------------- Overview ---------------- */

function Overview({ user }) {
  const orders = useStore((s) => s.orders);
  const returns = useStore((s) => s.returns);
  const wishlist = useStore((s) => s.wishlist);
  const notifications = useStore((s) => s.notifications);
  const mine = orders.filter((o) => o.userId === user.id);
  const active = mine.filter((o) => ["confirmed", "processing", "shipped", "out_for_delivery"].includes(deriveOrderStatus(o)));
  const spent = mine.filter((o) => o.payment.status === "paid" || o.payment.status === "cod_pending").reduce((t, o) => t + o.pricing.total, 0);
  const tier = spent > 20000 ? "Gold" : spent > 5000 ? "Silver" : "Member";
  const nextTier = tier === "Gold" ? null : tier === "Silver" ? 20000 : 5000;

  return (
    <div className="col gap-16">
      <div className="acc-hero">
        <div className="row gap-16">
          <span className="avatar xl">{initials(user.name)}</span>
          <div>
            <h2>{user.name}</h2>
            <p className="small">{user.email} · +91 {user.phone}</p>
            <div className="row gap-6 wrap mt-8">
              <span className={cx("tier", tier.toLowerCase())}>
                <Star size={12} fill="currentColor" /> {tier} member
              </span>
              <span className="badge badge-soft-green">
                <BadgeCheck size={12} /> Verified
              </span>
              <span className="xs" style={{ opacity: 0.8 }}>
                Member since {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="acc-credits">
          <span className="xs">D2C credits</span>
          <b>{formatINR(user.credits || 0)}</b>
          <Link to="/account/payments" className="xs link" style={{ color: "#ffb37a" }}>
            View wallet →
          </Link>
        </div>
      </div>

      {nextTier ? (
        <div className="card card-pad">
          <div className="row between small">
            <span>
              Shop for <b>{formatINR(nextTier - spent)}</b> more to unlock <b>{tier === "Member" ? "Silver" : "Gold"}</b> — free express delivery & early sale access
            </span>
            <span className="xs muted">{formatINR(spent)} spent</span>
          </div>
          <div className="progress mt-8">
            <span style={{ width: `${Math.min(100, (spent / nextTier) * 100)}%` }} />
          </div>
        </div>
      ) : null}

      <div className="grid grid-4">
        {[
          [Package, "Orders", mine.length, "/orders"],
          [Truck, "In transit", active.length, "/orders?tab=shipped"],
          [Heart, "Wishlist", wishlist.length, "/wishlist"],
          [RotateCcw, "Returns", returns.filter((r) => r.userId === user.id).length, "/returns"],
        ].map(([Icon, l, v, to]) => (
          <Link key={l} to={to} className="kpi acc-kpi">
            <Icon size={18} className="text-blue" />
            <div className="kpi-value">{v}</div>
            <div className="kpi-label">{l}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="row between mb-16">
            <b>Recent orders</b>
            <Link to="/orders" className="link small">View all</Link>
          </div>
          {mine.slice(0, 4).map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="acc-order">
              <Img src={o.items[0].image} alt="" className="acc-order-img" label="" />
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="xs">{o.id}</b>
                <div className="xs muted ellipsis">{o.items.map((i) => i.name).join(", ")}</div>
              </div>
              <StatusPill status={deriveOrderStatus(o)} />
            </Link>
          ))}
          {!mine.length ? <p className="small muted">No orders yet.</p> : null}
        </div>
        <div className="card card-pad">
          <div className="row between mb-16">
            <b>Wishlist</b>
          </div>
          <WishlistDrawer />
        </div>
      </div>

      <div className="card card-pad">
        <div className="row between mb-16">
          <b>Latest notifications</b>
          <Link to="/account/notifications" className="link small">See all</Link>
        </div>
        {notifications
          .filter((n) => n.userId === user.id)
          .slice(0, 3)
          .map((n) => (
            <Link key={n.id} to={n.link || "#"} className="notif-row">
              <span className={cx("notif-dot", !n.read && "unread")} />
              <div className="grow">
                <b className="small">{n.title}</b>
                <div className="xs muted">{n.body}</div>
              </div>
              <span className="xs faint">{timeAgo(n.at)}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function Profile({ user }) {
  const [f, setF] = useState({ name: user.name, email: user.email, phone: user.phone, gender: user.gender || "", dob: user.dob || "", altPhone: user.altPhone || "" });
  const [err, setErr] = useState({});
  const save = (e) => {
    e.preventDefault();
    const errors = {};
    if (!f.name.trim()) errors.name = "Required";
    if (!isEmail(f.email)) errors.email = "Invalid email";
    if (!isPhone(f.phone)) errors.phone = "Invalid mobile number";
    if (f.altPhone && !isPhone(f.altPhone)) errors.altPhone = "Invalid mobile number";
    setErr(errors);
    if (Object.keys(errors).length) return;
    updateUser(user.id, { ...f, email: f.email.toLowerCase() });
    toast("Profile updated");
  };
  return (
    <div className="card card-pad-lg">
      <h3 className="acc-title">Profile details</h3>
      <p className="small muted mb-16">Keep your details up to date for smooth deliveries and account recovery.</p>
      <form className="form-grid" onSubmit={save}>
        <Field label="Full name" error={err.name}>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Gender">
          <div className="seg">
            {["Female", "Male", "Other"].map((g) => (
              <button key={g} type="button" className={cx(f.gender === g && "active")} onClick={() => setF({ ...f, gender: g })}>
                {g}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Email" error={err.email} hint="Order updates & invoices are sent here">
          <div className="input-group">
            <input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <span className="addon text-green"><BadgeCheck size={15} /></span>
          </div>
        </Field>
        <Field label="Mobile number" error={err.phone} hint="Used for OTP login & delivery updates">
          <div className="input-group">
            <span className="addon">+91</span>
            <input className="input" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
          </div>
        </Field>
        <Field label="Date of birth" hint="Get a birthday surprise 🎁">
          <input className="input" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
        </Field>
        <Field label="Alternate mobile (optional)" error={err.altPhone}>
          <input className="input" maxLength={10} value={f.altPhone} onChange={(e) => setF({ ...f, altPhone: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <div className="span-2 row gap-6">
          <button className="btn" type="submit">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Addresses ---------------- */

function Addresses({ user }) {
  const [editing, setEditing] = useState(null);
  const icon = { Home: Home, Work: Briefcase, Other: MapPin };
  return (
    <div className="col gap-16">
      <div className="row between">
        <div>
          <h3 className="acc-title">Saved addresses</h3>
          <p className="small muted">Home, work and other delivery locations</p>
        </div>
        <button className="btn btn-blue" onClick={() => setEditing("new")}>
          <Plus size={16} /> Add new address
        </button>
      </div>
      {user.addresses.length ? (
        <div className="grid grid-2">
          {user.addresses.map((a) => {
            const Icon = icon[a.type] || MapPin;
            return (
              <div key={a.id} className={cx("addr-card", a.isDefault && "default")}>
                <div className="row between">
                  <span className="row gap-6">
                    <span className="addr-icon"><Icon size={15} /></span>
                    <b>{a.label || a.type}</b>
                    {a.isDefault ? <span className="badge badge-soft-blue">Default</span> : null}
                  </span>
                  <div className="row gap-4">
                    <button className="icon-btn sm" onClick={() => setEditing(a.id)} aria-label="Edit">
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-btn sm"
                      onClick={() => {
                        deleteAddress(user.id, a.id);
                        toast("Address removed", { type: "info" });
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="small mt-8">
                  <b>{a.name}</b>
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  {a.landmark ? `, ${a.landmark}` : ""}
                  <br />
                  {a.city}, {a.state} – <b>{a.pincode}</b>
                </p>
                <p className="small muted mt-4">
                  <Phone size={12} /> +91 {a.phone}
                </p>
                {!a.isDefault ? (
                  <button className="link small mt-8" onClick={() => setDefaultAddress(user.id, a.id)}>
                    Set as default
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={<MapPin size={30} />} title="No saved addresses" text="Add an address for faster checkout." />
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add new address" : "Edit address"} size="mid">
        {editing ? (
          <AddressForm
            initial={editing === "new" ? { name: user.name, phone: user.phone } : user.addresses.find((a) => a.id === editing)}
            onSubmit={(a) => {
              saveAddress(user.id, { ...a, id: editing === "new" ? undefined : editing });
              setEditing(null);
              toast("Address saved");
            }}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

/* ---------------- Payments ---------------- */

function Payments({ user }) {
  const [upi, setUpi] = useState("");
  const orders = useStore((s) => s.orders).filter((o) => o.userId === user.id && o.payment.status === "paid").slice(0, 6);
  const addUpi = (e) => {
    e.preventDefault();
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi)) return toast.error("Enter a valid UPI ID, e.g. name@okhdfcbank");
    updateUser(user.id, (u) => ({ savedUpi: [...new Set([...(u.savedUpi || []), upi])] }));
    setUpi("");
    toast("UPI ID saved");
  };
  return (
    <div className="col gap-16">
      <div className="wallet-card">
        <div>
          <span className="xs">D2C Mall credits</span>
          <b>{formatINR(user.credits || 0)}</b>
          <p className="xs">Use credits at checkout. Refunds to credits are instant.</p>
        </div>
        <Gift size={40} />
      </div>

      <div className="card card-pad">
        <h3 className="acc-title">Saved UPI IDs</h3>
        <div className="col gap-10 mt-12">
          {(user.savedUpi || []).map((v) => (
            <div key={v} className="row between soft-panel">
              <span className="row gap-6 small">
                <Smartphone size={16} className="text-blue" /> <b>{v}</b>
              </span>
              <button className="icon-btn sm" onClick={() => updateUser(user.id, (u) => ({ savedUpi: u.savedUpi.filter((x) => x !== v) }))} aria-label="Remove">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <form className="row mt-12" onSubmit={addUpi}>
          <input className="input" placeholder="Add UPI ID (name@bank)" value={upi} onChange={(e) => setUpi(e.target.value)} />
          <button className="btn btn-outline-blue" type="submit">
            <Plus size={15} /> Add
          </button>
        </form>
      </div>

      <div className="card card-pad">
        <h3 className="acc-title">Saved cards</h3>
        <p className="xs muted">Cards are tokenised as per RBI guidelines — we never store your full card number or CVV.</p>
        <div className="grid grid-2 mt-12">
          {(user.savedCards || []).map((c) => (
            <div key={c.id} className="bank-card">
              <div className="row between">
                <b>{c.bank}</b>
                <CreditCard size={20} />
              </div>
              <span className="bank-card-no">•••• •••• •••• {c.last4}</span>
              <div className="row between xs">
                <span>{c.name}</span>
                <span>{c.expiry}</span>
              </div>
              <button className="bank-card-remove" onClick={() => updateUser(user.id, (u) => ({ savedCards: u.savedCards.filter((x) => x.id !== c.id) }))}>
                Remove
              </button>
            </div>
          ))}
          {!user.savedCards?.length ? <p className="small muted">No saved cards. Cards are saved securely when you pay via Razorpay.</p> : null}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="acc-title">Payment history</h3>
        <div className="table-wrap mt-12">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}`} className="link small">{o.id}</Link></td>
                  <td className="small">{o.payment.instrument}</td>
                  <td className="small bold">{formatINR(o.pricing.total)}</td>
                  <td className="xs muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Notifications ---------------- */

function Notifications({ user }) {
  const all = useStore((s) => s.notifications);
  const [type, setType] = useState("all");
  const mine = all.filter((n) => n.userId === user.id && (type === "all" || n.type === type));
  const types = ["all", "order", "shipment", "payment", "refund", "return", "offer", "support"];
  return (
    <div className="card card-pad">
      <div className="row between wrap gap-16">
        <div>
          <h3 className="acc-title">Notifications</h3>
          <p className="small muted">Order, shipment, payment and refund updates — also sent by email, SMS & WhatsApp</p>
        </div>
        <div className="row gap-6">
          <button className="btn btn-outline btn-sm" onClick={() => markNotificationsRead(user.id)}>
            Mark all read
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => clearNotifications(user.id)}>
            Clear
          </button>
        </div>
      </div>
      <div className="chips mt-16">
        {types.map((t) => (
          <button key={t} className={cx("chip", type === t && "active")} onClick={() => setType(t)} style={{ textTransform: "capitalize" }}>
            {t}
          </button>
        ))}
      </div>
      <div className="col mt-16">
        {mine.length ? (
          mine.map((n) => (
            <Link key={n.id} to={n.link || "#"} className={cx("notif-row", !n.read && "unread-bg")} onClick={() => markNotificationsRead(user.id, n.id)}>
              <span className={cx("notif-dot", !n.read && "unread")} />
              <div className="grow">
                <b className="small">{n.title}</b>
                <div className="xs muted">{n.body}</div>
                <div className="row gap-6 mt-4">
                  {(n.channels || []).map((c) => (
                    <span key={c} className="badge badge-soft-gray">{c}</span>
                  ))}
                </div>
              </div>
              <span className="xs faint nowrap">{timeAgo(n.at)}</span>
            </Link>
          ))
        ) : (
          <p className="small muted">No notifications here.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- Saved looks ---------------- */

function Looks() {
  const social = useStore((s) => s.social);
  const saved = posts.filter((p) => social.saves?.[p.id]);
  const following = Object.keys(social.follows || {}).map(getCreator).filter(Boolean);
  return (
    <div className="col gap-16">
      <div className="card card-pad">
        <h3 className="acc-title">Saved looks</h3>
        {saved.length ? (
          <div className="looks-grid mt-12">
            {saved.map((p) => (
              <Link key={p.id} to={`/social?post=${p.id}`} className="look-tile">
                <Img src={p.image} alt="" label={p.topic} />
                <span className="xs">{p.caption}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="small muted mt-8">
            Save looks on <Link to="/d2c-street" className="link">D2C Street</Link> to find them here.
          </p>
        )}
      </div>
      <div className="card card-pad">
        <h3 className="acc-title">Creators you follow</h3>
        <div className="row wrap gap-16 mt-12">
          {following.map((c) => (
            <Link key={c.id} to="/d2c-street" className="row gap-6">
              <img src={c.avatar} alt="" className="avatar" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <span className="small">
                <b>{c.name}</b>
                <span className="xs muted" style={{ display: "block" }}>@{c.handle}</span>
              </span>
            </Link>
          ))}
          {!following.length ? <p className="small muted">You're not following anyone yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsPanel({ user }) {
  const prefs = user.prefs || {};
  const set = (k, v) => updateUser(user.id, (u) => ({ prefs: { ...u.prefs, [k]: v } }));
  const rows = [
    ["orderUpdates", "Order & delivery updates", "Confirmation, shipping, out-for-delivery and delivery alerts"],
    ["offers", "Offers & price drops", "Sale alerts and wishlist price drops"],
    ["whatsapp", "WhatsApp messages", "Order updates on WhatsApp"],
    ["sms", "SMS", "OTP and delivery SMS"],
    ["email", "Email", "Invoices, receipts and account emails"],
    ["newsletter", "Weekly newsletter", "New drops and stories from D2C brands"],
  ];
  const download = () => {
    const blob = new Blob([JSON.stringify({ ...user, passwordHash: undefined, salt: undefined }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "d2c-mall-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="col gap-16">
      <div className="card card-pad">
        <h3 className="acc-title">Communication preferences</h3>
        <div className="col mt-12">
          {rows.map(([k, t, s]) => (
            <div key={k} className="pref-row">
              <div>
                <b className="small">{t}</b>
                <div className="xs muted">{s}</div>
              </div>
              <Switch on={!!prefs[k]} onChange={(v) => set(k, v)} />
            </div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <h3 className="acc-title">Privacy & data</h3>
        <div className="row gap-6 wrap mt-12">
          <button className="btn btn-outline btn-sm" onClick={download}>
            <Download size={15} /> Download my data
          </button>
          <button className="btn btn-ghost btn-sm text-red" onClick={() => toast.info("Account deletion request raised. Our team will confirm within 48 hours.")}>
            <Trash2 size={15} /> Request account deletion
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Security ---------------- */

function Security({ user }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) return setErr("Passwords don't match");
    const r = changePassword(user.id, f.current, f.next);
    if (!r.ok) return setErr(r.error);
    setErr("");
    setF({ current: "", next: "", confirm: "" });
    toast("Password changed");
  };
  const issues = passwordIssues(f.next);
  return (
    <div className="col gap-16">
      <div className="card card-pad">
        <h3 className="acc-title">Change password</h3>
        <form className="form-grid mt-12" onSubmit={submit}>
          <Field label="Current password" className="span-2">
            <input className="input" type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" />
          </Field>
          <Field label="New password" hint={f.next ? (issues.length ? `Needs: ${issues.join(", ")}` : "Strong password ✓") : "Min 8 chars, uppercase, number & symbol"}>
            <input className="input" type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <input className="input" type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" />
          </Field>
          {err ? <div className="notice error span-2">{err}</div> : null}
          <div className="span-2">
            <button className="btn" type="submit">
              <Lock size={15} /> Update password
            </button>
          </div>
        </form>
      </div>
      <div className="card card-pad">
        <div className="row between">
          <div>
            <h3 className="acc-title">Two-step verification</h3>
            <p className="xs muted">Require an OTP on new devices</p>
          </div>
          <Switch on={!!user.prefs?.twoFactor} onChange={(v) => updateUser(user.id, (u) => ({ prefs: { ...u.prefs, twoFactor: v } }))} />
        </div>
      </div>
      <div className="card card-pad">
        <div className="row between">
          <h3 className="acc-title">Active sessions</h3>
          <button className="btn btn-outline btn-sm" onClick={() => { logoutOtherSessions(user.id); toast("Logged out of other devices"); }}>
            Log out other devices
          </button>
        </div>
        <div className="col gap-10 mt-12">
          {(user.sessions || []).map((s) => (
            <div key={s.id} className="soft-panel row gap-10">
              {s.device.includes("app") || s.device.includes("Mobile") ? <Smartphone size={18} /> : <Laptop size={18} />}
              <div className="grow">
                <b className="small">{s.device}</b>
                <div className="xs muted">
                  {s.location} · {s.current ? "Active now" : `Last active ${timeAgo(s.lastActive)}`}
                </div>
              </div>
              {s.current ? <span className="badge badge-soft-green">This device</span> : null}
            </div>
          ))}
        </div>
        <p className="xs muted mt-12">Sessions expire automatically after 7 days of inactivity. Passwords are salted and hashed; the production API uses bcrypt + JWT.</p>
      </div>
    </div>
  );
}

/* ---------------- Help ---------------- */

const FAQ = [
  ["Orders & delivery", [
    ["How do I track my order?", "Go to My Orders and tap Track. Each shipment shows live status from the courier, AWB number and expected delivery date."],
    ["Why is my order arriving in multiple packages?", "We ship from the warehouse closest to you that has stock. If items are at different hubs, they ship separately so you get them faster — at no extra cost."],
    ["What if I miss the delivery?", "The courier re-attempts delivery up to 3 times. You'll get an SMS/WhatsApp after every attempt and can reschedule from order details."],
  ]],
  ["Payments & refunds", [
    ["Money was debited but the order failed. What now?", "Reserved stock is released and any debited amount is auto-refunded by Razorpay within 5–7 working days. You can also retry payment within 60 minutes from the order page."],
    ["How long do refunds take?", "UPI/cards: 3–5 working days after quality check. D2C credits: instant. Bank transfer: 2–3 working days."],
    ["Is Cash on Delivery available?", "COD is available on most pincodes for orders up to ₹20,000, with a ₹29 handling fee."],
  ]],
  ["Returns & exchanges", [
    ["What is the return policy?", "Most fashion & footwear have 14-day returns and size exchanges. Electronics have 7 days. Beauty & personal care are non-returnable once opened."],
    ["How do I cancel a return?", "Open Returns & Refunds and tap Cancel return — possible until the item is picked up."],
  ]],
  ["Account & security", [
    ["How do I change my password?", "Go to Account → Security & sessions → Change password."],
    ["Can I log in with OTP?", "Yes — choose Mobile OTP on the login page."],
  ]],
];

function Help({ user }) {
  const tickets = useStore((s) => s.tickets).filter((t) => t.userId === user.id);
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState("");
  const [raise, setRaise] = useState(false);
  const [reply, setReply] = useState({});
  const filtered = FAQ.map(([cat, items]) => [cat, items.filter(([qq, a]) => `${qq} ${a}`.toLowerCase().includes(q.toLowerCase()))]).filter(([, items]) => items.length);

  return (
    <div className="col gap-16">
      <div className="help-hero">
        <h3>Hi {user.name.split(" ")[0]}, how can we help?</h3>
        <div className="help-search">
          <HelpCircle size={18} />
          <input placeholder="Search help articles — e.g. refund, track, COD" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-4 mt-16">
          {[
            [MessageCircle, "Chat with us", "Avg reply 2 min", () => setRaise(true)],
            [Phone, "Call 1800-120-D2C", "8 AM – 10 PM", () => (window.location.href = "tel:18001200000")],
            [Mail, "care@d2cmall.in", "Reply in 24h", () => (window.location.href = "mailto:care@d2cmall.in")],
            [Send, "WhatsApp", "+91 90000 12345", () => window.open("https://wa.me/919000012345", "_blank")],
          ].map(([Icon, t, s, fn]) => (
            <button key={t} className="help-channel" onClick={fn}>
              <Icon size={18} />
              <b className="small">{t}</b>
              <span className="xs">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <div className="row between">
          <h3 className="acc-title">My support tickets</h3>
          <button className="btn btn-blue btn-sm" onClick={() => setRaise(true)}>
            <Plus size={15} /> Raise a ticket
          </button>
        </div>
        <div className="col gap-10 mt-12">
          {tickets.map((t) => (
            <details key={t.id} className="ticket">
              <summary>
                <div className="grow">
                  <b className="small">{t.subject}</b>
                  <div className="xs muted">
                    {t.id} · {t.orderId ? `Order ${t.orderId} · ` : ""}
                    {formatDateTime(t.createdAt)}
                  </div>
                </div>
                <span className={cx("badge", t.status === "resolved" ? "badge-soft-green" : t.status === "open" ? "badge-soft-amber" : "badge-soft-blue")}>{t.status.replace("_", " ")}</span>
                <ChevronDown size={16} />
              </summary>
              <div className="ticket-thread">
                {t.messages.map((m, i) => (
                  <div key={i} className={cx("bubble", m.from)}>
                    {m.text}
                    <span>{timeAgo(m.at)}</span>
                  </div>
                ))}
                {t.status !== "resolved" ? (
                  <form
                    className="row mt-8"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!reply[t.id]?.trim()) return;
                      replyTicket(t.id, "customer", reply[t.id]);
                      setReply({ ...reply, [t.id]: "" });
                      setTimeout(() => replyTicket(t.id, "support", "Thanks for the update! We're on it and will get back to you shortly."), 1500);
                    }}
                  >
                    <input className="input" placeholder="Write a reply…" value={reply[t.id] || ""} onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })} />
                    <button className="btn btn-blue" type="submit" aria-label="Send">
                      <Send size={15} />
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => closeTicket(t.id)}>
                      Resolve
                    </button>
                  </form>
                ) : null}
              </div>
            </details>
          ))}
          {!tickets.length ? <p className="small muted">No tickets yet.</p> : null}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="acc-title">Frequently asked questions</h3>
        {filtered.map(([cat, items]) => (
          <div key={cat} className="mt-16">
            <span className="label">{cat}</span>
            {items.map(([qq, a]) => (
              <div key={qq} className="faq">
                <button className="faq-q" onClick={() => setOpen(open === qq ? null : qq)}>
                  {qq} <ChevronDown size={16} style={{ transform: open === qq ? "rotate(180deg)" : "none" }} />
                </button>
                {open === qq ? <p className="faq-a">{a}</p> : null}
              </div>
            ))}
          </div>
        ))}
        {!filtered.length ? <p className="small muted mt-12">No articles match "{q}". Raise a ticket and we'll help.</p> : null}
      </div>
      <SupportModal user={user} open={raise} onClose={() => setRaise(false)} />
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function AccountPage() {
  const { section = "overview" } = useParams();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const unread = useStore((s) => s.notifications).filter((n) => n.userId === user.id && !n.read).length;
  const current = NAV.find((n) => n.id === section) || NAV[0];
  useDocumentTitle(current.label);

  const body = useMemo(() => {
    switch (current.id) {
      case "profile": return <Profile user={user} />;
      case "addresses": return <Addresses user={user} />;
      case "payments": return <Payments user={user} />;
      case "coupons": return <MyCoupons user={user} />;
      case "coins": return <CoinsPanel user={user} />;
      case "giftcards": return <GiftCards user={user} />;
      case "reviews": return <MyReviews user={user} />;
      case "refer": return <ReferEarn user={user} />;
      case "tax": return <TaxDetails user={user} />;
      case "notifications": return <Notifications user={user} />;
      case "looks": return <Looks />;
      case "settings": return <SettingsPanel user={user} />;
      case "security": return <Security user={user} />;
      case "help": return <Help user={user} />;
      default: return <Overview user={user} />;
    }
  }, [current.id, user]);

  return (
    <div className="page">
      <div className="container">
        <div className="acc-layout">
          <aside className="acc-side">
            <div className="acc-side-head">
              <span className="avatar lg">{initials(user.name)}</span>
              <div style={{ minWidth: 0 }}>
                <span className="xs muted">Hello,</span>
                <b className="ellipsis" style={{ display: "block" }}>{user.name}</b>
              </div>
            </div>
            <nav className="acc-nav">
              {NAV.map((n) =>
                n.to ? (
                  <Link key={n.id} to={n.to}>
                    <n.icon size={17} /> {n.label} <ChevronRight size={14} className="acc-chev" />
                  </Link>
                ) : (
                  <NavLink key={n.id} to={`/account/${n.id === "overview" ? "" : n.id}`} end className={() => cx(current.id === n.id && "active")}>
                    <n.icon size={17} /> {n.label}
                    {n.id === "notifications" && unread ? <span className="acc-count">{unread}</span> : null}
                  </NavLink>
                )
              )}
              <button
                onClick={() => {
                  logout();
                  toast("Logged out");
                  navigate("/");
                }}
              >
                <LogOut size={17} /> Logout
              </button>
            </nav>
          </aside>
          <section className="acc-main fade-up" key={current.id}>
            {body}
          </section>
        </div>
      </div>
    </div>
  );
}
