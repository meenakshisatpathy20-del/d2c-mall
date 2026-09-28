import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Check, CheckCircle2, Copy, IndianRupee, MapPin, ShieldCheck, Store, User } from "lucide-react";
import { franchiseTiers } from "../../data/franchise";
import { lookupPincode } from "../../data/logistics";
import { submitApplication, validateApplication } from "../../lib/services/franchise";
import { useCurrentUser } from "../../lib/services/account";
import { cx } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Field, useDocumentTitle } from "../common/ui";
import "./FranchiseApplication.css";

const STEPS = [
  { title: "Personal details", icon: User },
  { title: "Proposed location", icon: MapPin },
  { title: "Format & investment", icon: IndianRupee },
  { title: "Experience", icon: Briefcase },
  { title: "Review & submit", icon: ShieldCheck },
];

const CAPACITY = [
  ["₹10 – 15 Lakh", 1200000],
  ["₹15 – 20 Lakh", 1700000],
  ["₹20 – 30 Lakh", 2500000],
  ["₹30 – 50 Lakh", 4000000],
  ["₹50 Lakh+", 6000000],
];

const DRAFT_KEY = "d2c_franchise_draft";

function Choice({ options, value, onChange, error }) {
  return (
    <>
      <div className="choice">
        {options.map((o) => (
          <button key={o} type="button" className={cx("chip", value === o && "active")} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
      {error ? <span className="error-text xs">{error}</span> : null}
    </>
  );
}

export default function FranchiseApplication() {
  useDocumentTitle("Apply for franchise");
  const [params] = useSearchParams();
  const user = useCurrentUser();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [a, setA] = useState(() => {
    let draft = {};
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    } catch {
      draft = {};
    }
    return {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      currentCity: "",
      occupation: "",
      city: "",
      state: "",
      pincode: "",
      propertyStatus: "",
      propertyType: "",
      area: "",
      frontage: "",
      tier: params.get("tier") || "standard",
      model: "FOFO",
      capacity: "",
      capacityValue: 0,
      funding: "",
      timeline: "",
      experience: "",
      business: "",
      why: "",
      heard: "",
      consent: false,
      ...draft,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...a, consent: false }));
    } catch {
      /* ignore */
    }
  }, [a]);

  const set = (k, v) => {
    const next = { ...a, [k]: v };
    if (k === "pincode" && /^\d{6}$/.test(v)) {
      const loc = lookupPincode(v);
      if (loc) {
        next.city = next.city || loc.city;
        next.state = loc.state.split(" / ")[0];
      }
    }
    setA(next);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const next = () => {
    const e = validateApplication(a, step);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please complete the highlighted fields");
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    const r = submitApplication(a);
    if (!r.ok) {
      setErrors(r.errors);
      const firstStep = ["name", "email", "phone", "currentCity", "occupation"].some((k) => r.errors[k]) ? 0 : ["city", "pincode", "propertyStatus", "propertyType", "area"].some((k) => r.errors[k]) ? 1 : ["tier", "model", "capacity", "funding", "timeline"].some((k) => r.errors[k]) ? 2 : ["experience", "why"].some((k) => r.errors[k]) ? 3 : 4;
      setStep(firstStep);
      toast.error(Object.values(r.errors)[0]);
      return;
    }
    localStorage.removeItem(DRAFT_KEY);
    setDone(r.app);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tier = franchiseTiers.find((t) => t.id === a.tier);

  if (done) {
    return (
      <div className="page">
        <div className="container page-narrow">
          <motion.div className="fa-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <CheckCircle2 size={56} />
            <h1>Application submitted!</h1>
            <p>Thank you, {done.name.split(" ")[0]}. Our franchise team will call you within 48 hours.</p>
            <div className="fa-id">
              <span className="xs">Your application ID</span>
              <b>{done.id}</b>
              <button className="link xs" onClick={() => { navigator.clipboard?.writeText(done.id).catch(() => {}); toast("Copied"); }}>
                <Copy size={12} /> Copy
              </button>
            </div>
            <div className="row gap-6 wrap mt-16" style={{ justifyContent: "center" }}>
              <Link to={`/franchise/status?id=${done.id}&phone=${done.phone}`} className="btn btn-lg btn-white">
                Track status
              </Link>
              <Link to="/" className="btn btn-lg btn-glass">
                Back to shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Franchise", to: "/franchise" }, { label: "Apply" }]} />
        <div className="fa-layout">
          <aside className="fa-side">
            <span className="eyebrow">
              <Store size={13} /> Franchise application
            </span>
            <h1>Open your D2C Mall</h1>
            <p className="small muted">Takes about 5 minutes. Your progress is saved automatically.</p>
            <div className="fa-steps">
              {STEPS.map((s, i) => (
                <button key={s.title} className={cx("fa-step", i === step && "active", i < step && "done")} onClick={() => i < step && setStep(i)}>
                  <span className="fa-step-icon">{i < step ? <Check size={15} /> : <s.icon size={15} />}</span>
                  <span>
                    <span className="xs muted">Step {i + 1}</span>
                    <b className="small" style={{ display: "block" }}>{s.title}</b>
                  </span>
                </button>
              ))}
            </div>
            {tier ? (
              <div className="fa-tier" style={{ "--tc": tier.color }}>
                <span className="xs">Selected format</span>
                <b>{tier.name}</b>
                <span className="small">{tier.investmentLabel} · {a.model}</span>
              </div>
            ) : null}
          </aside>

          <section className="fa-main card card-pad-lg">
            <div className="progress mb-16">
              <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
            <h2 className="fa-title">{STEPS[step].title}</h2>

            {step === 0 ? (
              <div className="form-grid mt-16">
                <Field label="Full name *" error={errors.name}>
                  <input className="input" value={a.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Email *" error={errors.email}>
                  <input className="input" type="email" value={a.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
                <Field label="Mobile number *" error={errors.phone}>
                  <div className="input-group">
                    <span className="addon">+91</span>
                    <input className="input" maxLength={10} value={a.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} />
                  </div>
                </Field>
                <Field label="Current city *" error={errors.currentCity}>
                  <input className="input" value={a.currentCity} onChange={(e) => set("currentCity", e.target.value)} />
                </Field>
                <div className="field span-2">
                  <label>Current occupation *</label>
                  <Choice options={["Business owner", "Salaried professional", "Retailer / distributor", "Investor", "Other"]} value={a.occupation} onChange={(v) => set("occupation", v)} error={errors.occupation} />
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="form-grid mt-16">
                <Field label="Proposed store pincode *" error={errors.pincode} hint={lookupPincode(a.pincode) ? `📍 ${lookupPincode(a.pincode).city}, ${lookupPincode(a.pincode).state}` : null}>
                  <input className="input" maxLength={6} value={a.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
                </Field>
                <Field label="City *" error={errors.city}>
                  <input className="input" value={a.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="State">
                  <input className="input" value={a.state} onChange={(e) => set("state", e.target.value)} />
                </Field>
                <Field label="Carpet area (sq ft) *" error={errors.area} hint={tier ? `${tier.name} needs ${tier.areaSqft}` : null}>
                  <input className="input" inputMode="numeric" value={a.area} onChange={(e) => set("area", e.target.value.replace(/\D/g, ""))} />
                </Field>
                <div className="field span-2">
                  <label>Property status *</label>
                  <Choice options={["Owned", "Leased", "Looking for property"]} value={a.propertyStatus} onChange={(v) => set("propertyStatus", v)} error={errors.propertyStatus} />
                </div>
                <div className="field span-2">
                  <label>Property type *</label>
                  <Choice options={["High street", "Mall", "Market complex", "Other"]} value={a.propertyType} onChange={(v) => set("propertyType", v)} error={errors.propertyType} />
                </div>
                <Field label="Frontage (ft, optional)">
                  <input className="input" inputMode="numeric" value={a.frontage} onChange={(e) => set("frontage", e.target.value.replace(/\D/g, ""))} />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="col gap-16 mt-16">
                <div className="grid grid-3">
                  {franchiseTiers.map((t) => (
                    <button key={t.id} type="button" className={cx("fa-tier-opt", a.tier === t.id && "active")} style={{ "--tc": t.color }} onClick={() => set("tier", t.id)}>
                      <span className="xs bold" style={{ color: t.color }}>{t.name}</span>
                      <b>{t.investmentLabel}</b>
                      <span className="xs muted">{t.areaSqft}</span>
                    </button>
                  ))}
                </div>
                {errors.tier ? <span className="error-text xs">{errors.tier}</span> : null}
                <div className="field">
                  <label>Business model *</label>
                  <div className="grid grid-2">
                    {[["FOFO", "Franchise Owned, Franchise Operated", "You run the store"], ["FOCO", "Franchise Owned, Company Operated", "We run it, you earn a share"]].map(([m, t, s]) => (
                      <label key={m} className={cx("radio-card", a.model === m && "active")}>
                        <input type="radio" checked={a.model === m} onChange={() => set("model", m)} />
                        <div>
                          <b className="small">{m}</b> <span className="xs muted">· {t}</span>
                          <p className="xs muted">{s}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Investment capacity *</label>
                  <Choice options={CAPACITY.map((c) => c[0])} value={a.capacity} onChange={(v) => setA({ ...a, capacity: v, capacityValue: CAPACITY.find((c) => c[0] === v)[1] })} error={errors.capacity} />
                  {tier && a.capacityValue && a.capacityValue < tier.investment ? <span className="xs text-orange bold">Your capacity is below the {tier.investmentLabel} requirement — consider a smaller format or financing.</span> : null}
                </div>
                <div className="field">
                  <label>Source of funds *</label>
                  <Choice options={["Self-funded", "Bank loan", "Partnership", "Mix"]} value={a.funding} onChange={(v) => set("funding", v)} error={errors.funding} />
                </div>
                <div className="field">
                  <label>When do you plan to launch? *</label>
                  <Choice options={["Within 3 months", "3 – 6 months", "6 – 12 months"]} value={a.timeline} onChange={(v) => set("timeline", v)} error={errors.timeline} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="col gap-16 mt-16">
                <div className="field">
                  <label>Retail / business experience *</label>
                  <Choice options={["No experience", "1-3 years", "3-5 years", "5+ years"]} value={a.experience} onChange={(v) => set("experience", v)} error={errors.experience} />
                </div>
                <Field label="Current business (if any)">
                  <input className="input" value={a.business} onChange={(e) => set("business", e.target.value)} placeholder="e.g. Apparel store, 8 years" />
                </Field>
                <Field label="Why D2C Mall? *" error={errors.why} hint={`${a.why.length}/600`}>
                  <textarea className="textarea" maxLength={600} value={a.why} onChange={(e) => set("why", e.target.value)} placeholder="Tell us about your city, customers and why you'd be a great partner" />
                </Field>
                <div className="field">
                  <label>How did you hear about us?</label>
                  <Choice options={["Instagram", "D2C Mall website", "Friend / referral", "News / event", "Other"]} value={a.heard} onChange={(v) => set("heard", v)} />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="col gap-16 mt-16">
                {[
                  ["Personal", [["Name", a.name], ["Email", a.email], ["Mobile", `+91 ${a.phone}`], ["Current city", a.currentCity], ["Occupation", a.occupation]], 0],
                  ["Location", [["Store location", `${a.city}, ${a.state} – ${a.pincode}`], ["Property", `${a.propertyStatus} · ${a.propertyType}`], ["Area", `${a.area} sq ft${a.frontage ? ` · ${a.frontage} ft frontage` : ""}`]], 1],
                  ["Investment", [["Format", `${tier?.name} (${tier?.investmentLabel})`], ["Model", a.model], ["Capacity", a.capacity], ["Funding", a.funding], ["Timeline", a.timeline]], 2],
                  ["Experience", [["Experience", a.experience], ["Business", a.business || "—"], ["Why", a.why]], 3],
                ].map(([title, rows, s]) => (
                  <div key={title} className="soft-panel">
                    <div className="row between">
                      <b className="small">{title}</b>
                      <button className="link xs" onClick={() => setStep(s)}>Edit</button>
                    </div>
                    <div className="fa-review">
                      {rows.map(([k, v]) => (
                        <div key={k}>
                          <span className="xs muted">{k}</span>
                          <span className="small">{v || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <label className="check">
                  <input type="checkbox" checked={a.consent} onChange={(e) => set("consent", e.target.checked)} />
                  <span className="small">I confirm the details are accurate and agree to be contacted by D2C Mall's franchise team by phone, email and WhatsApp.</span>
                </label>
                {errors.consent ? <span className="error-text xs">{errors.consent}</span> : null}
              </div>
            ) : null}

            <div className="fa-nav">
              {step > 0 ? (
                <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <Link to="/franchise" className="btn btn-outline">
                  <Building2 size={16} /> Programme details
                </Link>
              )}
              {step < STEPS.length - 1 ? (
                <button className="btn" onClick={next}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn-green" onClick={submit}>
                  <CheckCircle2 size={16} /> Submit application
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
