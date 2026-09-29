/*
 * API client + backend capability detection.
 *
 * On start-up we call GET /api/health once. Each integration (db, sms,
 * shiprocket, razorpay, admin users) switches the matching feature from demo
 * mode to the real backend automatically — no code changes needed after you
 * add credentials in Vercel.
 */
import { useSyncExternalStore } from "react";
import { getState } from "./store";

const BASE = import.meta.env.VITE_API_BASE || "/api";

let status = { checked: false, available: false, integrations: {} };
const listeners = new Set();

export class ApiRequestError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, { method = "GET", body, token, timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const auth = token || getState().session?.serverToken || getState().adminSession?.serverToken;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const type = res.headers.get("content-type") || "";
    if (!type.includes("application/json")) throw new ApiRequestError(res.status, "NO_API", "API not available");
    const data = await res.json();
    if (!res.ok) throw new ApiRequestError(res.status, data?.error?.code, data?.error?.message || "Request failed", data?.error?.details);
    return data;
  } catch (e) {
    if (e instanceof ApiRequestError) throw e;
    throw new ApiRequestError(0, "NETWORK", e.name === "AbortError" ? "Request timed out" : "Network error");
  } finally {
    clearTimeout(t);
  }
}

export async function checkBackend() {
  try {
    const h = await api("/health", { timeout: 6000 });
    status = { checked: true, available: true, integrations: h.integrations || {} };
  } catch {
    status = { checked: true, available: false, integrations: {} };
  }
  listeners.forEach((l) => l());
  return status;
}

export const backend = () => status;
export const live = (key) => status.available && !!status.integrations[key];

export function useBackend() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status
  );
}

if (typeof window !== "undefined") checkBackend();
