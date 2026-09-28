import { useState } from "react";
import { Lock } from "lucide-react";
import { cx } from "../../lib/format";

export function AdminHeader({ title, sub, actions, eyebrow }) {
  return (
    <div className="adm-head">
      <div>
        {eyebrow ? <span className="eyebrow blue">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {sub ? <p className="small muted">{sub}</p> : null}
      </div>
      {actions ? <div className="row gap-6 wrap">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ icon: Icon, label, value, delta, tone = "blue", hint }) {
  return (
    <div className={cx("adm-kpi", `tone-${tone}`)}>
      <div className="row between">
        <span className="adm-kpi-label">{label}</span>
        {Icon ? (
          <span className="adm-kpi-icon">
            <Icon size={16} />
          </span>
        ) : null}
      </div>
      <b className="adm-kpi-value">{value}</b>
      {delta ? <span className="adm-kpi-delta">{delta}</span> : null}
      {hint ? <span className="xs muted">{hint}</span> : null}
    </div>
  );
}

/** Single-series vertical bar chart with hover tooltip (one hue, no legend needed). */
export function BarChart({ data, height = 200, format = (v) => v, color = "#2457ff", label }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  return (
    <div className="bar-chart" role="img" aria-label={label}>
      <div className="bar-axis">
        {ticks.reverse().map((t, i) => (
          <span key={i}>{format(t)}</span>
        ))}
      </div>
      <div className="bar-plot" style={{ height }}>
        {[0, 0.5, 1].map((t) => (
          <span key={t} className="bar-grid" style={{ bottom: `${t * 100}%` }} />
        ))}
        {data.map((d, i) => (
          <div
            key={d.label}
            className="bar-col"
            style={{ left: `${i * w}%`, width: `${w}%` }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={cx("bar", hover === i && "hover")} style={{ height: `${(d.value / max) * 100}%`, background: color }} />
            {hover === i ? (
              <span className="bar-tip">
                <b>{format(d.value)}</b>
                <span>{d.label}</span>
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="bar-labels">
        {data.map((d, i) => (
          <span key={d.label} style={{ width: `${w}%` }}>
            {i % Math.ceil(data.length / 7) === 0 ? d.short || d.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars with direct labels (used for status & warehouse breakdowns). */
export function HBars({ rows, format = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div key={r.label} className="hbar-row" title={`${r.label}: ${format(r.value)}`}>
          <span className="hbar-label">
            {r.color ? <i style={{ background: r.color }} /> : null}
            {r.label}
          </span>
          <div className="hbar-track">
            <span style={{ width: `${(r.value / max) * 100}%`, background: r.color || "#2457ff" }} />
          </div>
          <b className="hbar-value">{format(r.value)}</b>
        </div>
      ))}
    </div>
  );
}

export function Denied({ role }) {
  return (
    <div className="adm-denied">
      <Lock size={36} />
      <h2>Access restricted</h2>
      <p className="small muted">Your role ({role}) doesn't have permission to view this section. Contact a Super Admin to request access.</p>
    </div>
  );
}

export function exportCsv(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
