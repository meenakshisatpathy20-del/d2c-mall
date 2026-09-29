import { useSyncExternalStore } from "react";

let toasts = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function toast(message, opts = {}) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts.slice(-2), { id, message, type: opts.type || "success", action: opts.action, onAction: opts.onAction }];
  emit();
  setTimeout(() => dismissToast(id), opts.duration || 3200);
  return id;
}

toast.error = (m, o) => toast(m, { ...o, type: "error" });
toast.info = (m, o) => toast(m, { ...o, type: "info" });

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => toasts
  );
}
