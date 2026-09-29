/*
 * Shiprocket service (server-only). Credentials never reach the browser.
 * React → /api/shiprocket/* → Shipment Service → this client → Shiprocket API
 * Docs: https://apidocs.shiprocket.in/
 */
import { ApiError, requireEnv } from "./http.js";

const BASE = "https://apiv2.shiprocket.in/v1/external";
let cached = { token: null, exp: 0 };

async function token() {
  requireEnv("SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD");
  if (cached.token && cached.exp > Date.now()) return cached.token;
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.token) throw new ApiError(502, "SHIPROCKET_AUTH_FAILED", "Could not authenticate with Shiprocket");
  // Shiprocket tokens are valid for 10 days; refresh after 9.
  cached = { token: data.token, exp: Date.now() + 9 * 86400000 };
  return cached.token;
}

export async function sr(path, { method = "GET", body, query } = {}) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(query || {}).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(502, "SHIPROCKET_ERROR", data?.message || `Shiprocket request failed (${r.status})`, data?.errors);
  return data;
}

/** Map Shiprocket shipment status → D2C Mall shipment status. */
export function mapStatus(s = "") {
  const v = s.toUpperCase();
  if (v.includes("DELIVERED") && !v.includes("UNDELIVERED")) return "delivered";
  if (v.includes("OUT FOR DELIVERY")) return "out_for_delivery";
  if (v.includes("UNDELIVERED") || v.includes("NDR") || v.includes("FAILED")) return "delivery_failed";
  if (v.includes("RTO")) return "rto";
  if (v.includes("REACHED") || v.includes("DESTINATION")) return "reached_hub";
  if (v.includes("IN TRANSIT") || v.includes("SHIPPED")) return "in_transit";
  if (v.includes("PICKED")) return "picked_up";
  if (v.includes("PICKUP") || v.includes("MANIFEST")) return "pickup_scheduled";
  if (v.includes("CANCEL")) return "cancelled";
  return "created";
}

/** Warehouse id → Shiprocket pickup location name (configure these in Shiprocket). */
export const PICKUP_LOCATIONS = {
  "WH-BHW": process.env.SR_PICKUP_BHW || "Bhiwandi",
  "WH-DEL": process.env.SR_PICKUP_DEL || "Delhi-NCR",
  "WH-JAI": process.env.SR_PICKUP_JAI || "Jaipur",
  "WH-BLR": process.env.SR_PICKUP_BLR || "Bengaluru",
};
