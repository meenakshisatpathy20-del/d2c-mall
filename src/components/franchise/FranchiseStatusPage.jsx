import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ClipboardList, FileText, Phone, Search, XCircle } from "lucide-react";
import { APPLICATION_STAGES, franchiseTiers } from "../../data/franchise";
import { findApplication } from "../../lib/services/franchise";
import { useStore } from "../../lib/store";
import { cx, formatDate, formatDateTime } from "../../lib/format";
import { Breadcrumbs, Field, useDocumentTitle } from "../common/ui";
import "./FranchiseApplication.css";

const NEXT = {
  submitted: "Our franchise team will review your application within 48 hours.",
  under_review: "We're evaluating your location and investment fit. Expect a call soon.",
  call_scheduled: "A discovery call is scheduled — keep your property details handy.",
  site_verification: "Our team will visit your proposed site. Please keep ownership/lease documents ready.",
  approved: "Congratulations! Our team will share the franchise proposal and agreement.",
  rejected: "Thank you for your interest. See the note below for details.",
};

export default function FranchiseStatusPage() {
  useDocumentTitle("Franchise application status");
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [lookup, setLookup] = useState(params.get("id") ? { id: params.get("id"), phone: params.get("phone") } : null);
  useStore((s) => s.franchiseApps); // re-render on updates
  const app = lookup ? findApplication(lookup.id, lookup.phone) : null;
  const idx = app ? APPLICATION_STAGES.findIndex((s) => s.key === app.status) : -1;
  const tier = app ? franchiseTiers.find((t) => t.id === app.tier) : null;

  return (
    <div className="page">
      <div className="container page-narrow">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Franchise", to: "/franchise" }, { label: "Application status" }]} />
        <div className="card card-pad-lg">
          <span className="eyebrow">
            <ClipboardList size={13} /> Application status
          </span>
          <h1 className="fa-title mt-8">Track your franchise application</h1>
          <form
            className="form-grid mt-16"
            onSubmit={(e) => {
              e.preventDefault();
              setLookup({ id, phone });
            }}
          >
            <Field label="Application ID">
              <input className="input" placeholder="FR-2026-XXXXX" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} />
            </Field>
            <Field label="Registered mobile">
              <input className="input" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <div className="span-2">
              <button className="btn" type="submit">
                <Search size={16} /> Check status
              </button>
            </div>
          </form>
          <p className="xs muted mt-12">Demo: try FR-2026-10233 with 9814012345</p>
        </div>

        {lookup && !app ? <div className="notice error mt-16">No application found for this ID and mobile number.</div> : null}

        {app ? (
          <div className="col gap-16 mt-16 fade-up">
            <div className="card card-pad-lg">
              <div className="row between wrap gap-16">
                <div>
                  <span className="xs muted">{app.id} · submitted {formatDate(app.createdAt)}</span>
                  <h2 className="fa-title">{app.name}</h2>
                  <p className="small muted">
                    {tier?.name} ({tier?.investmentLabel}) · {app.model} · {app.city}, {app.state}
                  </p>
                </div>
                <span className={cx("badge", app.status === "approved" ? "badge-soft-green" : app.status === "rejected" ? "badge-soft-red" : "badge-soft-blue")} style={{ fontSize: 12 }}>
                  {app.status.replace(/_/g, " ")}
                </span>
              </div>

              {app.status !== "rejected" ? (
                <div className="ret-flow mt-24">
                  {APPLICATION_STAGES.map((s, i) => (
                    <div key={s.key} className={cx("ret-flow-step", i < idx && "done", i === idx && "current")}>
                      <span>{i < idx || (i === idx && app.status === "approved") ? <Check size={11} /> : null}</span>
                      <em>{s.label}</em>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notice error mt-16">
                  <XCircle size={16} /> {app.decision?.note || "Application not approved."}
                </div>
              )}
              <div className="notice info mt-16">{NEXT[app.status]}</div>
              {app.siteVisit?.date && app.status === "site_verification" ? (
                <div className="notice warn mt-12">
                  Site visit on <b>{formatDate(new Date(app.siteVisit.date).getTime())}</b> with {app.siteVisit.officer}.
                </div>
              ) : null}
            </div>

            <div className="grid grid-2">
              <div className="card card-pad">
                <b className="small">Activity</b>
                <div className="timeline mt-12">
                  {[...app.history].reverse().map((h) => (
                    <div key={`${h.status}-${h.at}`} className="tl-item done">
                      <span className="tl-dot"><Check size={12} /></span>
                      <div>
                        <div className="tl-title" style={{ textTransform: "capitalize" }}>{h.status.replace(/_/g, " ")}</div>
                        <div className="tl-meta">{formatDateTime(h.at)}{h.note ? ` · ${h.note}` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card-pad">
                <b className="small">Documents to keep ready</b>
                <div className="col gap-10 mt-12">
                  {["PAN & Aadhaar of applicant", "Property ownership / lease agreement", "Site photos (frontage & interior)", "Bank statement (last 6 months)", "GST registration (if available)"].map((d) => (
                    <span key={d} className="row gap-6 small">
                      <FileText size={14} className="text-blue" /> {d}
                    </span>
                  ))}
                </div>
                <div className="soft-panel mt-16 row gap-6 small">
                  <Phone size={14} /> Franchise desk: 1800-120-D2C (ext. 3)
                </div>
              </div>
            </div>
            <Link to="/franchise" className="link small">← Back to franchise programme</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
