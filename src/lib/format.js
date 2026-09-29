const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (value) => inr.format(Math.round(Number(value) || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Math.round(Number(value) || 0));

export const compact = (value) => {
  const n = Number(value) || 0;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

export const formatDate = (ts, opts = {}) =>
  new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: opts.year === false ? undefined : "numeric",
    weekday: opts.weekday ? "short" : undefined,
  });

export const formatDateTime = (ts) =>
  new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(ts, { year: false });
}

export function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("") || "U";

export const maskPhone = (p = "") => (p.length >= 10 ? `${p.slice(0, 2)}******${p.slice(-2)}` : p);

export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const pluralize = (n, word, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;
