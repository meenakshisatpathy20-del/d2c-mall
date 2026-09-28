import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ImageOff, Info, Minus, Plus, Star, X } from "lucide-react";
import { cx, formatINR } from "../../lib/format";
import { dismissToast, useToasts } from "../../lib/toast";
import { ORDER_STATUS, TONE_CLASS } from "../../lib/orderModel";
import "./common.css";

/* ---------- Image with graceful fallback ---------- */

export function Img({ src, alt = "", className, label, ratio, style, eager, ...rest }) {
  const [state, setState] = useState("loading");
  useEffect(() => setState("loading"), [src]);
  return (
    <div className={cx("img-box", state === "loaded" && "is-loaded", className)} style={{ aspectRatio: ratio, ...style }}>
      {state !== "error" && src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          {...rest}
        />
      ) : null}
      {state === "error" || !src ? (
        <div className="img-fallback">
          <ImageOff size={22} />
          <span>{label || alt || "D2C Mall"}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Price & rating ---------- */

export function Price({ price, mrp, size, showOff = true }) {
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className={cx("price", size)}>
      <span className="now">{formatINR(price)}</span>
      {off > 0 ? <span className="mrp">{formatINR(mrp)}</span> : null}
      {off > 0 && showOff ? <span className="off">({off}% OFF)</span> : null}
    </div>
  );
}

export function RatingChip({ rating, count }) {
  const tone = rating >= 4 ? "" : rating >= 3 ? "mid" : "low";
  return (
    <span className="row gap-6">
      <span className={cx("rating-chip", tone)}>
        {Number(rating).toFixed(1)} <Star size={11} fill="currentColor" strokeWidth={0} />
      </span>
      {count !== undefined ? <span className="xs muted">({new Intl.NumberFormat("en-IN", { notation: "compact" }).format(count)})</span> : null}
    </span>
  );
}

export function Stars({ value = 0, size = 16, onChange }) {
  return (
    <span className="stars" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cx("star", n <= Math.round(value) && "on")}
          aria-label={`${n} star`}
        >
          <Star size={size} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </span>
  );
}

/* ---------- Status ---------- */

const STATUS_COLORS = {
  amber: ["#b54708", "#fffaeb"],
  red: ["#b42318", "#fff1f3"],
  blue: ["#2457ff", "#eef4ff"],
  purple: ["#6941c6", "#f4f3ff"],
  orange: ["#c94e00", "#fff2e7"],
  green: ["#067647", "#ecfdf3"],
  gray: ["#475467", "#f2f4f7"],
};

export function StatusPill({ status, label, tone }) {
  const meta = ORDER_STATUS[status] || { label: label || status, tone: tone || "gray" };
  const [fg, bg] = STATUS_COLORS[tone || meta.tone] || STATUS_COLORS.gray;
  return (
    <span className="status" style={{ color: fg, background: bg }}>
      {label || meta.label}
    </span>
  );
}

export function Badge({ tone = "soft-gray", children }) {
  return <span className={cx("badge", `badge-${tone}`, TONE_CLASS[tone])}>{children}</span>;
}

/* ---------- Quantity ---------- */

export function QtyStepper({ value, min = 1, max = 10, onChange, size }) {
  return (
    <div className={cx("qty", size)}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={14} />
      </button>
    </div>
  );
}

/* ---------- Modal & drawer ---------- */

export function Modal({ open, onClose, title, children, footer, size, hideHead }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <div className="modal-layer">
            <motion.div
              className={cx("modal", size)}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
            >
              {!hideHead ? (
                <div className="modal-head">
                  <h3>{title}</h3>
                  <button className="icon-btn sm" onClick={onClose} aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              ) : null}
              <div className={hideHead ? "" : "modal-body"}>{children}</div>
              {footer ? <div className="modal-foot">{footer}</div> : null}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, children, side = "right", width }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className={cx("drawer", side === "left" && "left")}
            style={width ? { width } : undefined}
            initial={{ x: side === "left" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "left" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/* ---------- Toasts ---------- */

export function Toaster() {
  const toasts = useToasts();
  const icon = { success: <CheckCircle2 size={16} />, error: <AlertCircle size={16} />, info: <Info size={16} /> };
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={cx("toast", t.type)}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
          >
            <span className="toast-icon">{icon[t.type]}</span>
            <span>{t.message}</span>
            {t.action ? (
              <button
                className="toast-action"
                onClick={() => {
                  t.onAction?.();
                  dismissToast(t.id);
                }}
              >
                {t.action}
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Section head / breadcrumbs / empty ---------- */

export function SectionHead({ eyebrow, title, sub, action, to, eyebrowTone }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <div className={cx("eyebrow", eyebrowTone)}>{eyebrow}</div> : null}
        <h2 className="section-title">{title}</h2>
        {sub ? <p className="section-sub">{sub}</p> : null}
      </div>
      {action ? (
        to ? (
          <Link to={to} className="link nowrap">
            {action} <ChevronRight size={16} />
          </Link>
        ) : (
          action
        )
      ) : null}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={it.label} className="row gap-6">
          {i > 0 ? <ChevronRight size={13} /> : null}
          {it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span className="current">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}

/* ---------- Horizontal rail ---------- */

export function Rail({ children, className, itemWidth }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children]);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="rail-wrap">
      {!edges.start ? (
        <button className="rail-nav prev" onClick={() => scroll(-1)} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>
      ) : null}
      <div ref={ref} className={cx("rail", className)} style={itemWidth ? { gridAutoColumns: itemWidth } : undefined}>
        {children}
      </div>
      {!edges.end ? (
        <button className="rail-nav next" onClick={() => scroll(1)} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      ) : null}
    </div>
  );
}

/* ---------- Countdown ---------- */

export function useCountdown(target) {
  const [left, setLeft] = useState(() => Math.max(target - Date.now(), 0));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(target - Date.now(), 0)), 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return { left, h, m, s };
}

export function Countdown({ target, dark }) {
  const { h, m, s } = useCountdown(target);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div className={cx("countdown", dark && "dark")}>
      <span>{pad(h)}</span>:<span>{pad(m)}</span>:<span>{pad(s)}</span>
    </div>
  );
}

/* ---------- Misc ---------- */

export function Skeleton({ h = 16, w = "100%", r, style }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function Switch({ on, onChange, label }) {
  return (
    <button type="button" className="row gap-16" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className={cx("switch", on && "on")} />
      {label ? <span className="small">{label}</span> : null}
    </button>
  );
}

export function Field({ label, error, hint, children, className }) {
  return (
    <div className={cx("field", className)}>
      {label ? <label>{label}</label> : null}
      {children}
      {error ? <span className="error-text">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function useScrollTop(dep) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [dep]);
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | D2C Mall` : "D2C Mall — India's home for D2C brands";
  }, [title]);
}
