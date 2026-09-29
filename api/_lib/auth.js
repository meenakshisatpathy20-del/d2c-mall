/*
 * Password hashing (scrypt) and JWT (HS256) using Node's built-in crypto.
 * requireAuth() protects API routes and enforces role-based access.
 */
import crypto from "node:crypto";
import { ApiError } from "./http.js";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split("$");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new ApiError(503, "NOT_CONFIGURED", "JWT_SECRET must be set (min 32 chars)");
  return s;
}

export function signJwt(payload, { expiresIn = 60 * 60 * 24 * 7 } = {}) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }));
  const sig = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token) {
  const [header, body, sig] = String(token || "").split(".");
  if (!header || !body || !sig) throw new ApiError(401, "UNAUTHENTICATED", "Missing or malformed token");
  const expected = crypto.createHmac("sha256", secret()).update(`${header}.${body}`).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw new ApiError(401, "UNAUTHENTICATED", "Invalid token");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new ApiError(401, "TOKEN_EXPIRED", "Session expired, please log in again");
  return payload;
}

/** @param {string[]} roles allowed roles, empty = any authenticated user */
export function requireAuth(req, roles = []) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const claims = verifyJwt(token);
  if (roles.length && !roles.includes(claims.role)) throw new ApiError(403, "FORBIDDEN", "You don't have access to this resource");
  return claims;
}
