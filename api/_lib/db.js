/*
 * Persistent storage via Upstash Redis REST API (works on Vercel with zero
 * dependencies — add the "Upstash for Redis" integration or set the two env
 * vars). Keys used:
 *   user:<email>            JSON user record (scrypt password hash)
 *   userphone:<phone>       email lookup by phone
 *   otp:<phone>             hashed OTP, 5-minute TTL
 *   order:<id>              JSON order
 *   orders:<userId>         list of order ids
 *   idem:<key>              order id for idempotency (24h TTL)
 *   awb:<awb>               order id + shipment id
 */
import { ApiError } from "./http.js";

const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const dbConfigured = () => Boolean(url() && token());

async function cmd(...args) {
  if (!dbConfigured()) throw new ApiError(503, "DB_NOT_CONFIGURED", "Database is not configured (set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)");
  const r = await fetch(url(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new ApiError(502, "DB_ERROR", data.error || "Database request failed");
  return data.result;
}

export const db = {
  async get(key) {
    const v = await cmd("GET", key);
    return v ? JSON.parse(v) : null;
  },
  async set(key, value, ttlSeconds) {
    return ttlSeconds ? cmd("SET", key, JSON.stringify(value), "EX", ttlSeconds) : cmd("SET", key, JSON.stringify(value));
  },
  /** SET only if absent — returns true when set (used for idempotency / uniqueness). */
  async setnx(key, value, ttlSeconds) {
    const args = ["SET", key, JSON.stringify(value), "NX"];
    if (ttlSeconds) args.push("EX", ttlSeconds);
    return (await cmd(...args)) === "OK";
  },
  del: (key) => cmd("DEL", key),
  lpush: (key, value) => cmd("LPUSH", key, value),
  lrange: (key, start = 0, stop = 49) => cmd("LRANGE", key, start, stop),
  incr: (key) => cmd("INCR", key),
  expire: (key, s) => cmd("EXPIRE", key, s),
};
