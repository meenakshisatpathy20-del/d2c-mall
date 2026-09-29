/*
 * Franchise applications — submit, track status, admin review workflow:
 * submitted → under_review → call_scheduled → site_verification → approved / rejected
 * with follow-ups, site verification checklist and decision notes.
 */
import { getState, setState, useStore } from "../store";
import { isEmail, isPhone, isPincode } from "./account";
import { franchiseTiers } from "../../data/franchise";
import { uid } from "../format";

export const useFranchiseApps = () => useStore((s) => s.franchiseApps);

export function validateApplication(a, step) {
  const e = {};
  if (step === 0 || step === undefined) {
    if (!a.name?.trim()) e.name = "Required";
    if (!isEmail(a.email || "")) e.email = "Valid email required";
    if (!isPhone(a.phone || "")) e.phone = "Valid 10-digit mobile required";
    if (!a.currentCity?.trim()) e.currentCity = "Required";
    if (!a.occupation) e.occupation = "Required";
  }
  if (step === 1 || step === undefined) {
    if (!a.city?.trim()) e.city = "Required";
    if (!isPincode(a.pincode || "")) e.pincode = "Valid 6-digit pincode required";
    if (!a.propertyStatus) e.propertyStatus = "Required";
    if (!a.propertyType) e.propertyType = "Required";
    if (!a.area || Number(a.area) < 200) e.area = "Enter carpet area (min 200 sq ft)";
  }
  if (step === 2 || step === undefined) {
    if (!a.tier) e.tier = "Choose a format";
    if (!a.model) e.model = "Choose FOFO or FOCO";
    if (!a.capacity) e.capacity = "Required";
    if (!a.funding) e.funding = "Required";
    if (!a.timeline) e.timeline = "Required";
  }
  if (step === 3 || step === undefined) {
    if (!a.experience) e.experience = "Required";
    if (!a.why || a.why.trim().length < 30) e.why = "Tell us a bit more (min 30 characters)";
  }
  if (step === 4 || step === undefined) {
    if (!a.consent) e.consent = "Please accept to continue";
  }
  return e;
}

/** Simple lead score to help the admin team prioritise. */
export function scoreApplication(a) {
  let s = 40;
  const tier = franchiseTiers.find((t) => t.id === a.tier);
  if (tier && Number(a.capacityValue || 0) >= tier.investment) s += 20;
  if (a.propertyStatus === "Owned") s += 12;
  else if (a.propertyStatus === "Leased") s += 8;
  if (a.propertyType === "High street" || a.propertyType === "Mall") s += 8;
  if (["3-5 years", "5+ years"].includes(a.experience)) s += 12;
  else if (a.experience === "1-3 years") s += 6;
  if (a.timeline === "Within 3 months") s += 8;
  return Math.min(100, s);
}

export function submitApplication(a) {
  const errors = validateApplication(a);
  if (Object.keys(errors).length) return { ok: false, errors };
  const dup = getState().franchiseApps.find((x) => x.phone === a.phone && x.city.toLowerCase() === a.city.toLowerCase() && !["rejected", "withdrawn"].includes(x.status));
  if (dup) return { ok: false, duplicate: dup.id, errors: { phone: `You already have an active application (${dup.id}) for ${dup.city}.` } };
  const id = `FR-${new Date().getFullYear()}-${String(Math.floor(10000 + Math.random() * 89999))}`;
  const app = {
    ...a,
    id,
    status: "submitted",
    score: scoreApplication(a),
    createdAt: Date.now(),
    followUps: [],
    siteVisit: null,
    history: [{ status: "submitted", at: Date.now(), by: "Applicant", note: "Application submitted online" }],
  };
  setState((st) => ({ ...st, franchiseApps: [app, ...st.franchiseApps] }));
  return { ok: true, app };
}

export function findApplication(id, phone) {
  return getState().franchiseApps.find((a) => a.id.toUpperCase() === String(id).trim().toUpperCase() && a.phone === String(phone).trim()) || null;
}

function patch(id, fn) {
  setState((st) => ({ ...st, franchiseApps: st.franchiseApps.map((a) => (a.id === id ? { ...a, ...fn(a) } : a)) }));
}

export function setApplicationStatus(id, status, by, note) {
  patch(id, (a) => ({ status, history: [...a.history, { status, at: Date.now(), by, note }] }));
}

export function addFollowUp(id, { type, note, due, by }) {
  patch(id, (a) => ({ followUps: [{ id: uid("fu"), type, note, due, by, at: Date.now(), done: false }, ...a.followUps] }));
}

export function toggleFollowUp(id, fuId) {
  patch(id, (a) => ({ followUps: a.followUps.map((f) => (f.id === fuId ? { ...f, done: !f.done } : f)) }));
}

export function scheduleSiteVisit(id, { date, officer, by }) {
  patch(id, (a) => ({
    siteVisit: { ...(a.siteVisit || {}), date, officer, checklist: a.siteVisit?.checklist || {}, result: null },
    status: "site_verification",
    history: [...a.history, { status: "site_verification", at: Date.now(), by, note: `Site visit scheduled on ${date} with ${officer}` }],
  }));
}

export function updateSiteChecklist(id, key, value) {
  patch(id, (a) => ({ siteVisit: { ...(a.siteVisit || {}), checklist: { ...(a.siteVisit?.checklist || {}), [key]: value } } }));
}

export function decideApplication(id, decision, by, note) {
  patch(id, (a) => ({
    status: decision,
    decision: { decision, note, by, at: Date.now() },
    history: [...a.history, { status: decision, at: Date.now(), by, note }],
  }));
}

export const SITE_CHECKLIST = [
  ["frontage", "Frontage ≥ 15 ft with signage visibility"],
  ["footfall", "Adequate footfall (≥ 1,500/day)"],
  ["area", "Carpet area matches chosen format"],
  ["access", "Road access & parking"],
  ["power", "Power load & backup available"],
  ["docs", "Ownership / lease documents verified"],
];
