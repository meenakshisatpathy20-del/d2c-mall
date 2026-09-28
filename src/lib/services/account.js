/*
 * Auth, profile, addresses, notifications and admin auth.
 * Mirrors: POST /api/auth/register, /api/auth/login, /api/admin/login ...
 */
import { getState, setState, useStore } from "../store";
import { hashPassword, randomId } from "../crypto";
import { uid } from "../format";

const SESSION_TTL = 7 * 86400000;
const ADMIN_TTL = 8 * 3600000;

/* ---------- validation ---------- */

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
export const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v).trim());
export const isPincode = (v) => /^[1-8]\d{5}$/.test(String(v).trim());

export function passwordIssues(pw = "") {
  const issues = [];
  if (pw.length < 8) issues.push("At least 8 characters");
  if (!/[A-Z]/.test(pw)) issues.push("One uppercase letter");
  if (!/[0-9]/.test(pw)) issues.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("One special character");
  return issues;
}

/* ---------- login throttling (client-side mirror of the API rate limiter) ---------- */

const attempts = {};
function throttled(key) {
  const a = attempts[key];
  if (a && a.count >= 5 && Date.now() - a.first < 5 * 60000) {
    return Math.ceil((5 * 60000 - (Date.now() - a.first)) / 60000);
  }
  return 0;
}
function fail(key) {
  const a = attempts[key];
  if (!a || Date.now() - a.first > 5 * 60000) attempts[key] = { count: 1, first: Date.now() };
  else a.count += 1;
}

/* ---------- customer auth ---------- */

export function register({ name, email, phone, password }) {
  const s = getState();
  email = email.trim().toLowerCase();
  if (!name?.trim()) return { ok: false, error: "Please enter your name." };
  if (!isEmail(email)) return { ok: false, error: "Enter a valid email address." };
  if (!isPhone(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  if (passwordIssues(password).length) return { ok: false, error: "Password doesn't meet the requirements." };
  if (s.users.some((u) => u.email === email)) return { ok: false, error: "An account with this email already exists. Try logging in." };
  const salt = randomId(12);
  const user = {
    id: uid("usr"),
    name: name.trim(),
    email,
    phone,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: Date.now(),
    addresses: [],
    savedUpi: [],
    savedCards: [],
    prefs: { orderUpdates: true, offers: true, whatsapp: true, sms: true, email: true, newsletter: false },
    credits: 100,
    sessions: [],
    tier: "Member",
    status: "active",
  };
  setState((st) => ({ ...st, users: [...st.users, user] }));
  startSession(user.id);
  notify(user.id, { type: "account", title: `Welcome to D2C Mall, ${user.name.split(" ")[0]}! 🎉`, body: "₹100 D2C credits added. Use WELCOME100 for ₹100 off your first order.", link: "/shop" });
  return { ok: true, user };
}

export function login(email, password) {
  const key = `c:${String(email).toLowerCase()}`;
  const wait = throttled(key);
  if (wait) return { ok: false, error: `Too many attempts. Try again in ${wait} min.` };
  const user = getState().users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password, user.salt)) {
    fail(key);
    return { ok: false, error: "Incorrect email or password." };
  }
  if (user.status === "blocked") return { ok: false, error: "This account has been suspended. Contact support." };
  startSession(user.id);
  return { ok: true, user };
}

/** OTP login (demo: OTP is shown on screen; real SMS via /api/notify) */
export function requestOtp(phone) {
  if (!isPhone(phone)) return { ok: false, error: "Enter a valid 10-digit mobile number." };
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  sessionStorage.setItem("d2c_otp", JSON.stringify({ phone, otp, exp: Date.now() + 5 * 60000 }));
  return { ok: true, otp };
}

export function verifyOtp(phone, otp) {
  try {
    const saved = JSON.parse(sessionStorage.getItem("d2c_otp") || "{}");
    if (saved.phone !== phone || saved.otp !== otp || saved.exp < Date.now()) return { ok: false, error: "Invalid or expired OTP." };
  } catch {
    return { ok: false, error: "Invalid OTP." };
  }
  let user = getState().users.find((u) => u.phone === phone);
  if (!user) return { ok: false, needsSignup: true, error: "No account with this number. Please sign up." };
  startSession(user.id);
  return { ok: true, user };
}

function startSession(userId) {
  const token = randomId(32);
  setState((st) => ({
    ...st,
    session: { userId, token, expiresAt: Date.now() + SESSION_TTL },
    users: st.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            lastLogin: Date.now(),
            sessions: [
              { id: token.slice(0, 8), device: navigator.userAgent.includes("Mobile") ? "Mobile browser" : "Desktop browser", location: "India", lastActive: Date.now(), current: true },
              ...(u.sessions || []).map((x) => ({ ...x, current: false })).slice(0, 4),
            ],
          }
        : u
    ),
  }));
}

export function logout() {
  setState((st) => ({ ...st, session: null }));
}

export function logoutOtherSessions(userId) {
  updateUser(userId, (u) => ({ sessions: (u.sessions || []).filter((s) => s.current) }));
}

export function currentUser(s = getState()) {
  if (!s.session || s.session.expiresAt < Date.now()) return null;
  return s.users.find((u) => u.id === s.session.userId) || null;
}

export function useCurrentUser() {
  const session = useStore((s) => s.session);
  const users = useStore((s) => s.users);
  if (!session || session.expiresAt < Date.now()) return null;
  return users.find((u) => u.id === session.userId) || null;
}

export function updateUser(userId, patch) {
  setState((st) => ({
    ...st,
    users: st.users.map((u) => (u.id === userId ? { ...u, ...(typeof patch === "function" ? patch(u) : patch) } : u)),
  }));
}

export function changePassword(userId, current, next) {
  const user = getState().users.find((u) => u.id === userId);
  if (!user || user.passwordHash !== hashPassword(current, user.salt)) return { ok: false, error: "Current password is incorrect." };
  if (passwordIssues(next).length) return { ok: false, error: "New password doesn't meet the requirements." };
  const salt = randomId(12);
  updateUser(userId, { salt, passwordHash: hashPassword(next, salt) });
  return { ok: true };
}

/* ---------- addresses ---------- */

export function validateAddress(a) {
  const e = {};
  if (!a.name?.trim()) e.name = "Required";
  if (!isPhone(a.phone)) e.phone = "Enter a valid 10-digit mobile";
  if (!isPincode(a.pincode)) e.pincode = "Enter a valid 6-digit pincode";
  if (!a.line1?.trim()) e.line1 = "Required";
  if (!a.city?.trim()) e.city = "Required";
  if (!a.state?.trim()) e.state = "Required";
  return e;
}

export function saveAddress(userId, address) {
  const id = address.id || uid("addr");
  updateUser(userId, (u) => {
    let list = (u.addresses || []).filter((a) => a.id !== id);
    const isDefault = address.isDefault || list.length === 0;
    if (isDefault) list = list.map((a) => ({ ...a, isDefault: false }));
    const idx = (u.addresses || []).findIndex((a) => a.id === id);
    const next = { ...address, id, isDefault };
    if (idx >= 0) list.splice(idx, 0, next);
    else list.push(next);
    return { addresses: list };
  });
  return id;
}

export function deleteAddress(userId, id) {
  updateUser(userId, (u) => {
    const list = u.addresses.filter((a) => a.id !== id);
    if (list.length && !list.some((a) => a.isDefault)) list[0] = { ...list[0], isDefault: true };
    return { addresses: list };
  });
}

export function setDefaultAddress(userId, id) {
  updateUser(userId, (u) => ({ addresses: u.addresses.map((a) => ({ ...a, isDefault: a.id === id })) }));
}

/* ---------- notifications ---------- */

export function notify(userId, { type = "order", title, body, link, channels = ["push"] }) {
  if (!userId) return;
  setState((st) => ({
    ...st,
    notifications: [{ id: uid("ntf"), userId, type, title, body, link, at: Date.now(), read: false, channels }, ...st.notifications].slice(0, 200),
  }));
}

export function markNotificationsRead(userId, id) {
  setState((st) => ({
    ...st,
    notifications: st.notifications.map((n) => (n.userId === userId && (!id || n.id === id) ? { ...n, read: true } : n)),
  }));
}

export function clearNotifications(userId) {
  setState((st) => ({ ...st, notifications: st.notifications.filter((n) => n.userId !== userId) }));
}

/* ---------- admin auth (RBAC) ---------- */

export const ROLES = {
  super_admin: { label: "Super Admin", color: "#2457ff", can: ["dashboard", "orders", "customers", "inventory", "warehouses", "shipments", "returns", "franchise", "team"] },
  warehouse_admin: { label: "Warehouse Admin", color: "#12b76a", can: ["dashboard", "orders", "inventory", "warehouses", "shipments"] },
  support: { label: "Customer Support", color: "#ff6b00", can: ["dashboard", "orders", "customers", "returns", "franchise"] },
  logistics: { label: "Logistics", color: "#7f56d9", can: ["dashboard", "orders", "shipments", "warehouses", "returns"] },
};

export function adminLogin(email, password) {
  const key = `a:${String(email).toLowerCase()}`;
  const wait = throttled(key);
  if (wait) return { ok: false, error: `Account temporarily locked. Try again in ${wait} min.` };
  const admin = getState().admins.find((a) => a.email === String(email).trim().toLowerCase());
  if (!admin || admin.passwordHash !== hashPassword(password, admin.salt)) {
    fail(key);
    return { ok: false, error: "Invalid admin ID or password." };
  }
  setState((st) => ({ ...st, adminSession: { adminId: admin.id, role: admin.role, token: randomId(32), expiresAt: Date.now() + ADMIN_TTL, at: Date.now() } }));
  return { ok: true, admin };
}

export function adminLogout() {
  setState((st) => ({ ...st, adminSession: null }));
}

export function useAdmin() {
  const session = useStore((s) => s.adminSession);
  const admins = useStore((s) => s.admins);
  if (!session || session.expiresAt < Date.now()) return null;
  const admin = admins.find((a) => a.id === session.adminId);
  return admin ? { ...admin, permissions: ROLES[admin.role].can, roleLabel: ROLES[admin.role].label } : null;
}
