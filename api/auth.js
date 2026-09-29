/*
 * Customer authentication (server side, persistent in Redis):
 *   POST /api/auth/register   { name, email, phone, password }
 *   POST /api/auth/login      { email, password }
 *   POST /api/auth/otp-send   { phone }            → SMS via MSG91
 *   POST /api/auth/otp-verify { phone, otp }
 *   GET  /api/auth/me                              (Bearer token)
 *   POST /api/auth/profile    { name?, gender?, dob?, addresses?, prefs? } (Bearer token)
 * Passwords: scrypt. Sessions: JWT (7 days). Brute-force: per-IP + per-account limits.
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, validate } from "./_lib/http.js";
import { hashPassword, requireAuth, signJwt, verifyPassword } from "./_lib/auth.js";
import { db } from "./_lib/db.js";
import { sendNotification } from "./_lib/notify.js";
import { router } from "./_lib/router.js";

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, gender: u.gender || "", dob: u.dob || "", createdAt: u.createdAt, addresses: u.addresses || [], prefs: u.prefs || {}, credits: u.credits || 0, coins: u.coins || 0 });
const issue = (u) => ({ token: signJwt({ sub: u.id, email: u.email, role: "customer" }), user: publicUser(u) });

function passwordStrong(pw = "") {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
}

async function throttle(key, max = 5, windowS = 300) {
  const n = await db.incr(`fail:${key}`);
  if (n === 1) await db.expire(`fail:${key}`, windowS);
  if (n > max) throw new ApiError(429, "LOCKED", "Too many attempts. Try again in 5 minutes.");
}

const register = handler(["POST"], async (req) => {
  const b = await readJson(req);
  validate(b, { name: ["string"], email: ["email"], phone: ["phone"], password: ["string"] });
  if (!passwordStrong(b.password)) throw new ApiError(422, "WEAK_PASSWORD", "Password needs 8+ chars with uppercase, number and symbol");
  const email = b.email.trim().toLowerCase();
  const user = {
    id: `usr_${crypto.randomBytes(8).toString("hex")}`,
    name: b.name.trim().slice(0, 80),
    email,
    phone: b.phone,
    hash: hashPassword(b.password),
    createdAt: Date.now(),
    addresses: [],
    prefs: { orderUpdates: true, offers: true, whatsapp: true, sms: true, email: true },
    credits: 100,
    coins: 0,
  };
  if (!(await db.setnx(`user:${email}`, user))) throw new ApiError(409, "EMAIL_EXISTS", "An account with this email already exists");
  if (!(await db.setnx(`userphone:${b.phone}`, email))) {
    await db.del(`user:${email}`);
    throw new ApiError(409, "PHONE_EXISTS", "This mobile number is already registered");
  }
  await db.set(`userid:${user.id}`, email);
  return issue(user);
}, { limit: 10, key: "register" });

const login = handler(["POST"], async (req) => {
  const b = await readJson(req);
  validate(b, { email: ["email"], password: ["string"] });
  const email = b.email.trim().toLowerCase();
  const u = await db.get(`user:${email}`);
  if (!u || !verifyPassword(b.password, u.hash)) {
    await throttle(`login:${email}`);
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }
  if (u.blocked) throw new ApiError(403, "BLOCKED", "This account has been suspended. Contact support.");
  await db.del(`fail:login:${email}`);
  return issue(u);
}, { limit: 20, key: "login" });

const otpSend = handler(["POST"], async (req) => {
  const b = await readJson(req);
  validate(b, { phone: ["phone"] });
  if (!process.env.MSG91_AUTH_KEY) throw new ApiError(503, "SMS_NOT_CONFIGURED", "SMS provider is not configured");
  const email = await db.get(`userphone:${b.phone}`);
  if (!email) throw new ApiError(404, "NOT_REGISTERED", "No account with this number. Please sign up.");
  await throttle(`otp:${b.phone}`, 5, 900);
  const otp = String(crypto.randomInt(100000, 1000000));
  const hash = crypto.createHash("sha256").update(`${b.phone}:${otp}:${process.env.JWT_SECRET}`).digest("hex");
  await db.set(`otp:${b.phone}`, { hash, tries: 0 }, 300);
  const sent = await sendNotification({ template: "otp", data: { otp }, phone: b.phone, channels: ["sms"] });
  if (sent.results.sms !== "sent") throw new ApiError(502, "SMS_FAILED", "Could not send OTP. Please try again.");
  return { sent: true, expiresIn: 300 };
}, { limit: 10, key: "otp-send" });

const otpVerify = handler(["POST"], async (req) => {
  const b = await readJson(req);
  validate(b, { phone: ["phone"], otp: ["string"] });
  const rec = await db.get(`otp:${b.phone}`);
  if (!rec) throw new ApiError(400, "OTP_EXPIRED", "OTP expired. Request a new one.");
  const hash = crypto.createHash("sha256").update(`${b.phone}:${b.otp}:${process.env.JWT_SECRET}`).digest("hex");
  if (hash !== rec.hash) {
    rec.tries += 1;
    if (rec.tries >= 5) await db.del(`otp:${b.phone}`);
    else await db.set(`otp:${b.phone}`, rec, 300);
    throw new ApiError(401, "OTP_INVALID", "Incorrect OTP");
  }
  await db.del(`otp:${b.phone}`);
  const email = await db.get(`userphone:${b.phone}`);
  const u = await db.get(`user:${email}`);
  return issue(u);
}, { limit: 20, key: "otp-verify" });

const me = handler(["GET"], async (req) => {
  const claims = requireAuth(req, ["customer"]);
  const u = await db.get(`user:${claims.email}`);
  if (!u) throw new ApiError(404, "NOT_FOUND", "Account not found");
  return { user: publicUser(u) };
});

const profile = handler(["POST"], async (req) => {
  const claims = requireAuth(req, ["customer"]);
  const b = await readJson(req);
  const u = await db.get(`user:${claims.email}`);
  if (!u) throw new ApiError(404, "NOT_FOUND", "Account not found");
  if (b.name !== undefined) u.name = String(b.name).slice(0, 80);
  if (b.gender !== undefined) u.gender = String(b.gender).slice(0, 20);
  if (b.dob !== undefined) u.dob = String(b.dob).slice(0, 10);
  if (Array.isArray(b.addresses)) {
    b.addresses.slice(0, 20).forEach((a) => validate(a, { name: ["string"], phone: ["phone"], line1: ["string"], city: ["string"], state: ["string"], pincode: ["pincode"] }));
    u.addresses = b.addresses.slice(0, 20);
  }
  if (b.prefs && typeof b.prefs === "object") u.prefs = { ...u.prefs, ...b.prefs };
  await db.set(`user:${claims.email}`, u);
  return { user: publicUser(u) };
});

export default router({ register, login, "otp-send": otpSend, "otp-verify": otpVerify, me, profile });
