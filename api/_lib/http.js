/*
 * Shared HTTP helpers for Vercel serverless functions:
 * standardized JSON errors, CORS allowlist, per-IP rate limiting,
 * method guards and small validation helpers.
 */

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const allowed = () =>
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export function cors(req, res) {
  const origin = req.headers.origin;
  const list = allowed();
  // Same-origin requests (no Origin header) and allow-listed origins pass.
  if (origin && (list.length === 0 || list.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key");
  res.setHeader("Access-Control-Max-Age", "600");
}

/* In-memory sliding window per instance. For multi-region production use Upstash/Redis. */
const buckets = new Map();
export function rateLimit(req, { limit = 60, windowMs = 60_000, key = "" } = {}) {
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").toString().split(",")[0].trim();
  const id = `${key}:${ip}`;
  const now = Date.now();
  const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(id, hits);
  if (hits.length > limit) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down.");
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

/**
 * Wrap a handler with CORS, OPTIONS, method guard, rate limiting and
 * standardized error responses: { error: { code, message, details? } }
 */
export function handler(methods, fn, opts = {}) {
  return async (req, res) => {
    try {
      cors(req, res);
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
      }
      if (!methods.includes(req.method)) throw new ApiError(405, "METHOD_NOT_ALLOWED", `Use ${methods.join(", ")}`);
      rateLimit(req, { limit: opts.limit || 60, key: opts.key || req.url });
      const out = await fn(req, res);
      if (!res.writableEnded) send(res, 200, out ?? { ok: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 500;
      if (status >= 500) console.error("[api]", req.url, err);
      send(res, status, {
        error: {
          code: err instanceof ApiError ? err.code : "INTERNAL_ERROR",
          message: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
          ...(err instanceof ApiError && err.details ? { details: err.details } : {}),
        },
      });
    }
  };
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await readRaw(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

export function readRaw(req) {
  if (typeof req.body === "string") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1_000_000) reject(new ApiError(413, "PAYLOAD_TOO_LARGE", "Body too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new ApiError(503, "NOT_CONFIGURED", `Server is missing configuration: ${missing.join(", ")}`);
}

/* Tiny schema validator: { field: ["string"|"number"|"int"|"pincode"|"phone", required?] } */
export function validate(body, schema) {
  const errors = {};
  for (const [field, [type, required = true]] of Object.entries(schema)) {
    const v = body[field];
    if (v === undefined || v === null || v === "") {
      if (required) errors[field] = "is required";
      continue;
    }
    if (type === "string" && typeof v !== "string") errors[field] = "must be a string";
    if (type === "number" && typeof v !== "number") errors[field] = "must be a number";
    if (type === "int" && !Number.isInteger(v)) errors[field] = "must be an integer";
    if (type === "pincode" && !/^[1-8]\d{5}$/.test(String(v))) errors[field] = "must be a valid 6-digit pincode";
    if (type === "phone" && !/^[6-9]\d{9}$/.test(String(v))) errors[field] = "must be a valid 10-digit mobile";
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v))) errors[field] = "must be a valid email";
  }
  if (Object.keys(errors).length) throw new ApiError(422, "VALIDATION_FAILED", "Some fields are invalid", errors);
}
