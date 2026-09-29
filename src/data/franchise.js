/*
 * Franchise programme data.
 *
 * The three investment tiers (₹11 Lakh, ₹21 Lakh, ₹51 Lakh) come from the
 * franchise PDFs shared by the business team. Figures marked `indicative`
 * (area, ROI, payback, staff) are placeholders until the final PDF numbers
 * are filled in — edit them here and every franchise page updates.
 */

export const franchiseTiers = [
  {
    id: "express",
    name: "D2C Mall Express",
    investment: 1100000,
    investmentLabel: "₹11 Lakh",
    tagline: "Compact high-street store for Tier 2 & 3 cities",
    model: ["FOFO"],
    areaSqft: "400 – 600 sq ft",
    brands: "40+ D2C brands",
    skus: "1,200+ SKUs",
    staff: "3 – 4",
    paybackMonths: "18 – 24",
    marginPct: "22 – 28%",
    royaltyPct: "4% of net sales",
    fee: "₹1.5 Lakh (included)",
    includes: ["Store design & branding kit", "POS + inventory software", "Initial stock on consignment", "Staff training (7 days)", "Local launch marketing"],
    ideal: "Entrepreneurs starting their first retail business",
    color: "#12b76a",
    indicative: true,
  },
  {
    id: "standard",
    name: "D2C Mall Store",
    investment: 2100000,
    investmentLabel: "₹21 Lakh",
    tagline: "Full-format store for Tier 1 & 2 city high streets and malls",
    model: ["FOFO", "FOCO"],
    areaSqft: "800 – 1,200 sq ft",
    brands: "80+ D2C brands",
    skus: "3,000+ SKUs",
    staff: "5 – 7",
    paybackMonths: "20 – 26",
    marginPct: "24 – 30%",
    royaltyPct: "4% of net sales (FOFO) · revenue share (FOCO)",
    fee: "₹2.5 Lakh (included)",
    includes: ["Everything in Express", "D2C Street creator wall & try-on zone", "Omnichannel ship-from-store", "Regional marketing co-op", "Dedicated area manager"],
    ideal: "Retail operators & investors with an existing location",
    color: "#2457ff",
    popular: true,
    indicative: true,
  },
  {
    id: "flagship",
    name: "D2C Mall Flagship",
    investment: 5100000,
    investmentLabel: "₹51 Lakh",
    tagline: "Experience-led flagship for metros and premium malls",
    model: ["FOCO", "FOFO"],
    areaSqft: "2,000 – 3,500 sq ft",
    brands: "150+ D2C brands",
    skus: "6,000+ SKUs",
    staff: "10 – 14",
    paybackMonths: "24 – 30",
    marginPct: "26 – 32%",
    royaltyPct: "Revenue share (FOCO) · 3.5% royalty (FOFO)",
    fee: "₹5 Lakh (included)",
    includes: ["Everything in Store", "Brand launch pads & events space", "Café / community corner", "Dark-store fulfilment for 2-hour delivery", "City-level exclusivity options"],
    ideal: "Business groups & mall developers",
    color: "#ff6b00",
    indicative: true,
  },
];

export const franchiseModels = {
  FOFO: {
    name: "FOFO — Franchise Owned, Franchise Operated",
    points: ["You invest in and run the store", "Higher margin, full operational control", "D2C Mall supplies stock, tech, branding & training", "Royalty on net sales"],
  },
  FOCO: {
    name: "FOCO — Franchise Owned, Company Operated",
    points: ["You invest in the store; D2C Mall runs daily operations", "Passive income with assured minimum return", "Our staff, processes and inventory planning", "Revenue share model"],
  },
};

export const franchiseCities = [
  { city: "Jamshedpur", state: "Jharkhand", status: "Open", demand: "High" },
  { city: "Ranchi", state: "Jharkhand", status: "Open", demand: "High" },
  { city: "Patna", state: "Bihar", status: "Open", demand: "High" },
  { city: "Bhubaneswar", state: "Odisha", status: "Open", demand: "Medium" },
  { city: "Lucknow", state: "Uttar Pradesh", status: "Limited", demand: "High" },
  { city: "Indore", state: "Madhya Pradesh", status: "Open", demand: "High" },
  { city: "Jaipur", state: "Rajasthan", status: "Limited", demand: "High" },
  { city: "Surat", state: "Gujarat", status: "Open", demand: "Medium" },
  { city: "Coimbatore", state: "Tamil Nadu", status: "Open", demand: "Medium" },
  { city: "Kochi", state: "Kerala", status: "Open", demand: "Medium" },
  { city: "Guwahati", state: "Assam", status: "Open", demand: "High" },
  { city: "Dehradun", state: "Uttarakhand", status: "Open", demand: "Medium" },
];

export const APPLICATION_STAGES = [
  { key: "submitted", label: "Application submitted" },
  { key: "under_review", label: "Under review" },
  { key: "call_scheduled", label: "Discovery call" },
  { key: "site_verification", label: "Site verification" },
  { key: "approved", label: "Approved" },
];

export const franchiseFaq = [
  ["Do I need retail experience?", "No. We provide end-to-end training, store operations playbooks and a dedicated area manager. Business or customer-facing experience helps."],
  ["What is included in the investment?", "Franchise fee, store interiors & branding, fixtures, POS hardware & software, initial marketing and training. Stock is supplied on a consignment/credit model."],
  ["How is inventory managed?", "Stores connect to our warehouse network (Bhiwandi, Delhi NCR, Jaipur, Bengaluru). Auto-replenishment uses real sales data, and slow movers can be returned."],
  ["How long does it take to open?", "Typically 45–75 days from approval: agreement, site fit-out, stock and staff training."],
  ["What's the difference between FOFO and FOCO?", "FOFO: you own and operate the store. FOCO: you own it, and D2C Mall operates it for a revenue share."],
];

/* Sample applications so the admin review pipeline has data on first run. */
export function seedFranchiseApps() {
  const now = Date.now();
  const DAY = 86400000;
  const base = (i, o) => ({
    email: `${o.name.split(" ")[0].toLowerCase()}@example.com`,
    occupation: "Business owner",
    currentCity: o.city,
    propertyType: "High street",
    funding: "Self-funded",
    timeline: "Within 3 months",
    experience: "3-5 years",
    why: "I run a retail business locally and see strong demand for authentic D2C brands in my city.",
    heard: "Instagram",
    consent: true,
    followUps: [],
    siteVisit: null,
    ...o,
    id: `FR-2026-${10231 + i}`,
    createdAt: now - (i + 1) * 2.5 * DAY,
  });
  return [
    base(0, { name: "Rakesh Agarwal", phone: "9431012345", city: "Jamshedpur", state: "Jharkhand", pincode: "831001", tier: "standard", model: "FOFO", capacity: "₹20 – 30 Lakh", capacityValue: 2500000, propertyStatus: "Owned", area: 1000, status: "under_review", score: 88, history: [{ status: "submitted", at: now - 2.5 * DAY, by: "Applicant", note: "Application submitted online" }, { status: "under_review", at: now - 2 * DAY, by: "Nilay Dubey", note: "Strong location, owned property" }] }),
    base(1, { name: "Sneha Iyer", phone: "9845012345", city: "Coimbatore", state: "Tamil Nadu", pincode: "641002", tier: "express", model: "FOFO", capacity: "₹10 – 15 Lakh", capacityValue: 1200000, propertyStatus: "Leased", area: 550, status: "submitted", score: 72, history: [{ status: "submitted", at: now - 5 * DAY, by: "Applicant", note: "Application submitted online" }] }),
    base(2, { name: "Harpreet Singh", phone: "9814012345", city: "Ludhiana", state: "Punjab", pincode: "141001", tier: "flagship", model: "FOCO", capacity: "₹50 Lakh+", capacityValue: 6000000, propertyStatus: "Owned", propertyType: "Mall", area: 2800, status: "site_verification", score: 94, siteVisit: { date: new Date(now + 2 * DAY).toISOString().slice(0, 10), officer: "Imran Qureshi", checklist: { frontage: true, footfall: true, area: true }, result: null }, followUps: [{ id: "fu1", type: "Call", note: "Discussed FOCO revenue share", due: new Date(now - DAY).toISOString().slice(0, 10), by: "Nilay Dubey", at: now - 3 * DAY, done: true }], history: [{ status: "submitted", at: now - 7.5 * DAY, by: "Applicant", note: "Application submitted online" }, { status: "under_review", at: now - 7 * DAY, by: "Nilay Dubey", note: "High-value flagship lead" }, { status: "call_scheduled", at: now - 5 * DAY, by: "Sneha Pillai", note: "Discovery call done" }, { status: "site_verification", at: now - 2 * DAY, by: "Nilay Dubey", note: "Site visit scheduled" }] }),
    base(3, { name: "Ankit Jain", phone: "9829012345", city: "Indore", state: "Madhya Pradesh", pincode: "452001", tier: "standard", model: "FOFO", capacity: "₹20 – 30 Lakh", capacityValue: 2100000, propertyStatus: "Looking for property", area: 900, experience: "1-3 years", status: "call_scheduled", score: 70, followUps: [{ id: "fu2", type: "Call", note: "Discovery call tomorrow 11 AM", due: new Date(now + DAY).toISOString().slice(0, 10), by: "Sneha Pillai", at: now - DAY, done: false }], history: [{ status: "submitted", at: now - 10 * DAY, by: "Applicant", note: "Application submitted online" }, { status: "under_review", at: now - 9 * DAY, by: "Nilay Dubey", note: "" }, { status: "call_scheduled", at: now - DAY, by: "Sneha Pillai", note: "Call booked" }] }),
    base(4, { name: "Priya Bhattacharya", phone: "9830012345", city: "Guwahati", state: "Assam", pincode: "781001", tier: "express", model: "FOFO", capacity: "₹10 – 15 Lakh", capacityValue: 1100000, propertyStatus: "Leased", area: 480, status: "approved", score: 82, decision: { decision: "approved", note: "Approved for Express format — agreement sent", by: "Nilay Dubey", at: now - 4 * DAY }, history: [{ status: "submitted", at: now - 12.5 * DAY, by: "Applicant", note: "Application submitted online" }, { status: "approved", at: now - 4 * DAY, by: "Nilay Dubey", note: "Approved — agreement sent" }] }),
    base(5, { name: "Mohit Verma", phone: "9811012345", city: "Noida", state: "Uttar Pradesh", pincode: "201301", tier: "flagship", model: "FOFO", capacity: "₹20 – 30 Lakh", capacityValue: 2200000, propertyStatus: "Looking for property", area: 2000, experience: "No experience", status: "rejected", score: 46, decision: { decision: "rejected", note: "Investment capacity below Flagship requirement; suggested Store format", by: "Nilay Dubey", at: now - 6 * DAY }, history: [{ status: "submitted", at: now - 15 * DAY, by: "Applicant", note: "Application submitted online" }, { status: "rejected", at: now - 6 * DAY, by: "Nilay Dubey", note: "Capacity below requirement" }] }),
  ];
}
