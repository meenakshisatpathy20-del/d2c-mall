/*
 * Client-side persistent store (the "local backend").
 *
 * Every read/write goes through services in src/lib/services/*, which mirror
 * the REST endpoints in /api. Swapping this for real API calls only touches
 * the services — components never talk to localStorage directly.
 */
import { useSyncExternalStore } from "react";
import { createSeedState } from "../data/seed";

const KEY = "d2c_mall_state_v3";
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 3) return parsed;
    }
  } catch {
    /* corrupted storage — reseed */
  }
  return createSeedState();
}

let state = load();
let saveTimer = null;

function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — keep in memory */
  }
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 80);
}

export function getState() {
  return state;
}

export function setState(updater) {
  const next = typeof updater === "function" ? updater(state) : { ...state, ...updater };
  if (next === state) return;
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Select a slice. Selector must return a stable reference (a slice, not a new array). */
export function useStore(selector = (s) => s) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function resetStore() {
  state = createSeedState();
  persist();
  listeners.forEach((l) => l());
}

// Sync across tabs; flush pending writes when the page is hidden/unloaded
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = JSON.parse(e.newValue);
      listeners.forEach((l) => l());
    } catch {
      /* ignore */
    }
  });
}
