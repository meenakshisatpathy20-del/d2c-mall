import { useMemo, useState } from "react";
import { CalendarCheck, Check, CheckCircle2, Download, Mail, MapPin, MessageSquarePlus, Phone, Search, Store, X, XCircle } from "lucide-react";
import { APPLICATION_STAGES, franchiseTiers } from "../../data/franchise";
import {
  SITE_CHECKLIST,
  addFollowUp,
  decideApplication,
  scheduleSiteVisit,
  setApplicationStatus,
  toggleFollowUp,
  updateSiteChecklist,
  useFranchiseApps,
} from "../../lib/services/franchise";
import { cx, formatDate, formatDateTime, timeAgo } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Drawer } from "../common/ui";
import { AdminHeader, Kpi, exportCsv } from "../admin/AdminBits";
import "./AdminFranchisePage.css";

const COLUMNS = [...APPLICATION_STAGES.map((s) => s.key), "rejected"];
const LABEL = Object.fromEntries([...APPLICATION_STAGES.map((s) => [s.key, s.label]), ["rejected", "Rejected"]]);

function Detail({ app, admin, onClose }) {
  const [fu, setFu] = useState({ type: "Call", note: "", due: new Date(Date.now() + 86400000).toISOString().slice(0, 10) });
  const [visit, setVisit] = useState({ date: app.siteVisit?.date || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), officer: app.siteVisit?.officer || "Imran Qureshi" });
  const [note, setNote] = useState("");
  const tier = franchiseTiers.find((t) => t.id === app.tier);
  const idx = APPLICATION_STAGES.findIndex((s) => s.key === app.status);
  const checklistDone = SITE_CHECKLIST.filter(([k]) => app.siteVisit?.checklist?.[k]).length;
  const closed = ["approved", "rejected"].includes(app.status);

  return (
    <div className="adm-drawer">
      <div className="adm-drawer-head">
        <div>
          <b>{app.name}</b>
          <div className="xs muted">{app.id} · applied {timeAgo(app.createdAt)}</div>
        </div>
        <div className="row gap-6">
          <span className={cx("score", app.score >= 80 ? "hi" : app.score >= 60 ? "mid" : "lo")}>{app.score}</span>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
      </div>
      <div className="adm-drawer-body">
        {app.status !== "rejected" ? (
          <div className="ret-flow">
            {APPLICATION_STAGES.map((s, i) => (
              <div key={s.key} className={cx("ret-flow-step", i < idx && "done", i === idx && "current")}>
                <span>{i < idx || (i === idx && app.status === "approved") ? <Check size={11} /> : null}</span>
                <em>{s.label}</em>
              </div>
            ))}
          </div>
        ) : (
          <div className="notice error">Rejected: {app.decision?.note}</div>
        )}

        <div className="grid grid-2">
          <div className="soft-panel xs col gap-4">
            <b className="small">Applicant</b>
            <span className="row gap-4"><Phone size={12} /> +91 {app.phone}</span>
            <span className="row gap-4"><Mail size={12} /> {app.email}</span>
            <span>{app.occupation} · {app.experience} experience</span>
            <span>Lives in {app.currentCity}</span>
          </div>
          <div className="soft-panel xs col gap-4">
            <b className="small">Proposal</b>
            <span><Store size={12} /> {tier?.name} ({tier?.investmentLabel}) · {app.model}</span>
            <span>Capacity {app.capacity} · {app.funding}</span>
            <span><MapPin size={12} /> {app.city}, {app.state} {app.pincode}</span>
            <span>{app.propertyStatus} · {app.propertyType} · {app.area} sq ft</span>
            <span>Launch: {app.timeline}</span>
          </div>
        </div>
        <div className="soft-panel xs">
          <b className="small">Why D2C Mall</b>
          <p className="mt-4">{app.why}</p>
        </div>

        {!closed ? (
          <div className="card card-pad col gap-10">
            <b className="small">Move stage</b>
            <div className="row wrap gap-6">
              {["under_review", "call_scheduled"].map((s) => (
                <button key={s} className={cx("btn btn-xs", app.status === s ? "btn-blue" : "btn-outline")} onClick={() => { setApplicationStatus(app.id, s, admin.name, note); setNote(""); toast(`Moved to ${LABEL[s]}`); }}>
                  {LABEL[s]}
                </button>
              ))}
            </div>
            <input className="input" placeholder="Internal note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        ) : null}

        <div className="card card-pad col gap-10">
          <b className="small row gap-6"><MessageSquarePlus size={15} /> Follow-ups</b>
          {app.followUps.map((f) => (
            <label key={f.id} className="row gap-10 xs">
              <input type="checkbox" checked={f.done} onChange={() => toggleFollowUp(app.id, f.id)} />
              <span className={cx("grow", f.done && "strike muted")}>
                <b>{f.type}</b> · {f.note} <span className="muted">· due {f.due} · {f.by}</span>
              </span>
            </label>
          ))}
          {!app.followUps.length ? <span className="xs muted">No follow-ups yet.</span> : null}
          <div className="row wrap gap-6">
            <select className="select" style={{ width: 110 }} value={fu.type} onChange={(e) => setFu({ ...fu, type: e.target.value })}>
              {["Call", "Email", "WhatsApp", "Meeting"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className="input" style={{ flex: 1, minWidth: 160 }} placeholder="Note" value={fu.note} onChange={(e) => setFu({ ...fu, note: e.target.value })} />
            <input className="input" type="date" style={{ width: 150 }} value={fu.due} onChange={(e) => setFu({ ...fu, due: e.target.value })} />
            <button className="btn btn-sm btn-blue" onClick={() => { if (!fu.note.trim()) return toast.error("Add a note"); addFollowUp(app.id, { ...fu, by: admin.name }); setFu({ ...fu, note: "" }); toast("Follow-up added"); }}>
              Add
            </button>
          </div>
        </div>

        <div className="card card-pad col gap-10">
          <b className="small row gap-6"><CalendarCheck size={15} /> Site verification {app.siteVisit ? `· ${checklistDone}/${SITE_CHECKLIST.length} checks` : ""}</b>
          {!closed ? (
            <div className="row wrap gap-6">
              <input className="input" type="date" style={{ width: 160 }} value={visit.date} onChange={(e) => setVisit({ ...visit, date: e.target.value })} />
              <input className="input" style={{ flex: 1, minWidth: 140 }} value={visit.officer} onChange={(e) => setVisit({ ...visit, officer: e.target.value })} placeholder="Field officer" />
              <button className="btn btn-sm btn-outline" onClick={() => { scheduleSiteVisit(app.id, { ...visit, by: admin.name }); toast("Site visit scheduled"); }}>
                {app.siteVisit ? "Reschedule" : "Schedule visit"}
              </button>
            </div>
          ) : null}
          {app.siteVisit ? (
            <>
              <span className="xs muted">Visit on {formatDate(new Date(app.siteVisit.date).getTime())} with {app.siteVisit.officer}</span>
              {SITE_CHECKLIST.map(([k, l]) => (
                <label key={k} className="check xs">
                  <input type="checkbox" disabled={closed} checked={!!app.siteVisit.checklist?.[k]} onChange={(e) => updateSiteChecklist(app.id, k, e.target.checked)} /> {l}
                </label>
              ))}
            </>
          ) : null}
        </div>

        {!closed ? (
          <div className="card card-pad col gap-10">
            <b className="small">Decision</b>
            <textarea className="textarea" placeholder="Decision note shared with the applicant" value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 70 }} />
            <div className="grid grid-2">
              <button className="btn btn-green" onClick={() => { decideApplication(app.id, "approved", admin.name, note || "Approved — proposal & agreement will be shared"); toast("Application approved"); }}>
                <CheckCircle2 size={15} /> Approve
              </button>
              <button className="btn btn-red" onClick={() => { if (!note.trim()) return toast.error("Add a reason for rejection"); decideApplication(app.id, "rejected", admin.name, note); toast("Application rejected"); }}>
                <XCircle size={15} /> Reject
              </button>
            </div>
            {app.siteVisit && checklistDone < SITE_CHECKLIST.length ? <span className="xs text-orange">Site checklist incomplete ({checklistDone}/{SITE_CHECKLIST.length})</span> : null}
          </div>
        ) : (
          <div className={cx("notice", app.status === "approved" ? "success" : "error")}>
            {app.status === "approved" ? "Approved" : "Rejected"} by {app.decision?.by} on {formatDateTime(app.decision?.at)} — {app.decision?.note}
          </div>
        )}

        <div>
          <span className="label">Activity log</span>
          <div className="col gap-6 mt-8">
            {[...app.history].reverse().map((h) => (
              <div key={`${h.status}${h.at}`} className="xs">
                <b>{formatDateTime(h.at)}</b> · <span style={{ textTransform: "capitalize" }}>{h.status.replace(/_/g, " ")}</span> · {h.by}{h.note ? ` — ${h.note}` : ""}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFranchisePage({ admin }) {
  const apps = useFranchiseApps();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [openId, setOpenId] = useState(null);
  const list = useMemo(() => apps.filter((a) => (tier === "all" || a.tier === tier) && (!q || `${a.name} ${a.city} ${a.id} ${a.phone}`.toLowerCase().includes(q.toLowerCase()))), [apps, q, tier]);
  const open = apps.find((a) => a.id === openId);

  return (
    <div className="col gap-16">
      <AdminHeader
        eyebrow="Franchise"
        title="Franchise applications"
        sub="Review, follow up, verify sites and approve new stores"
        actions={
          <button className="btn btn-sm btn-outline" onClick={() => exportCsv("franchise-applications.csv", list.map((a) => ({ id: a.id, name: a.name, phone: a.phone, email: a.email, city: a.city, tier: a.tier, model: a.model, capacity: a.capacity, status: a.status, score: a.score, applied: formatDate(a.createdAt) })))}>
            <Download size={14} /> Export
          </button>
        }
      />
      <div className="adm-kpis">
        <Kpi icon={Store} label="Total applications" value={apps.length} tone="blue" />
        <Kpi icon={Store} label="New" value={apps.filter((a) => a.status === "submitted").length} tone="orange" delta="Awaiting review" />
        <Kpi icon={Store} label="In pipeline" value={apps.filter((a) => ["under_review", "call_scheduled", "site_verification"].includes(a.status)).length} tone="purple" />
        <Kpi icon={CalendarCheck} label="Site visits" value={apps.filter((a) => a.status === "site_verification").length} tone="amber" />
        <Kpi icon={CheckCircle2} label="Approved" value={apps.filter((a) => a.status === "approved").length} tone="green" />
        <Kpi icon={XCircle} label="Rejected" value={apps.filter((a) => a.status === "rejected").length} tone="red" />
      </div>
      <div className="adm-toolbar">
        <div className="input-group" style={{ flex: 1 }}>
          <span className="addon"><Search size={15} /></span>
          <input className="input" placeholder="Name, city, phone or application ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: "auto" }} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="all">All formats</option>
          {franchiseTiers.map((t) => <option key={t.id} value={t.id}>{t.investmentLabel} · {t.name}</option>)}
        </select>
      </div>
      <div className="kanban">
        {COLUMNS.map((col) => {
          const items = list.filter((a) => a.status === col);
          return (
            <div key={col} className="kanban-col">
              <div className="kanban-head">
                <b className="small">{LABEL[col]}</b>
                <span className="badge badge-soft-gray">{items.length}</span>
              </div>
              {items.map((a) => {
                const t = franchiseTiers.find((x) => x.id === a.tier);
                return (
                  <button key={a.id} className="kanban-card" onClick={() => setOpenId(a.id)} style={{ "--tc": t?.color }}>
                    <div className="row between">
                      <b className="small">{a.name}</b>
                      <span className={cx("score", a.score >= 80 ? "hi" : a.score >= 60 ? "mid" : "lo")}>{a.score}</span>
                    </div>
                    <span className="xs muted row gap-4"><MapPin size={11} /> {a.city}, {a.state}</span>
                    <span className="xs"><b style={{ color: t?.color }}>{t?.investmentLabel}</b> · {a.model} · {a.propertyStatus}</span>
                    <span className="xs faint">{a.id} · {timeAgo(a.createdAt)}</span>
                    {a.followUps.some((f) => !f.done) ? <span className="badge badge-soft-amber">Follow-up due</span> : null}
                  </button>
                );
              })}
              {!items.length ? <span className="xs faint" style={{ padding: 8 }}>No applications</span> : null}
            </div>
          );
        })}
      </div>
      <Drawer open={!!open} onClose={() => setOpenId(null)} width="min(100vw, 600px)">
        {open ? <Detail key={open.id} app={open} admin={admin} onClose={() => setOpenId(null)} /> : null}
      </Drawer>
    </div>
  );
}
