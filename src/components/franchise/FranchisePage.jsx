import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileSignature,
  Handshake,
  MapPin,
  PhoneCall,
  Rocket,
  Search,
  Store,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { APPLICATION_STAGES, franchiseCities, franchiseFaq, franchiseModels, franchiseTiers } from "../../data/franchise";
import { warehouses } from "../../data/logistics";
import { cx, formatINR } from "../../lib/format";
import { Breadcrumbs, useDocumentTitle } from "../common/ui";
import "./FranchisePage.css";

function Calculator_({ defaultTier = "standard" }) {
  const [tierId, setTierId] = useState(defaultTier);
  const [footfall, setFootfall] = useState(180);
  const [conversion, setConversion] = useState(18);
  const [bill, setBill] = useState(1400);
  const tier = franchiseTiers.find((t) => t.id === tierId);
  const calc = useMemo(() => {
    const monthlySales = footfall * 30 * (conversion / 100) * bill;
    const marginPct = { express: 0.25, standard: 0.27, flagship: 0.29 }[tierId];
    const gross = monthlySales * marginPct;
    const opex = { express: 110000, standard: 220000, flagship: 520000 }[tierId];
    const royalty = monthlySales * (tierId === "flagship" ? 0.035 : 0.04);
    const net = gross - opex - royalty;
    const payback = net > 0 ? Math.ceil(tier.investment / net) : null;
    return { monthlySales, gross, opex, royalty, net, payback, roi: net > 0 ? ((net * 12) / tier.investment) * 100 : 0 };
  }, [footfall, conversion, bill, tierId, tier]);

  return (
    <div className="calc">
      <div className="calc-inputs">
        <div className="seg w-full">
          {franchiseTiers.map((t) => (
            <button key={t.id} className={cx("grow", tierId === t.id && "active")} onClick={() => setTierId(t.id)}>
              {t.investmentLabel}
            </button>
          ))}
        </div>
        {[
          ["Daily footfall", footfall, setFootfall, 40, 800, 10, (v) => `${v} visitors`],
          ["Conversion rate", conversion, setConversion, 5, 40, 1, (v) => `${v}%`],
          ["Average bill value", bill, setBill, 500, 4000, 50, (v) => formatINR(v)],
        ].map(([label, v, set, min, max, step, fmt]) => (
          <label key={label} className="calc-slider">
            <span className="row between small">
              <b>{label}</b>
              <span className="text-blue bold">{fmt(v)}</span>
            </span>
            <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} />
          </label>
        ))}
        <p className="xs muted">Estimates are indicative and depend on location, season and execution. Final projections are shared after site verification.</p>
      </div>
      <div className="calc-out">
        <span className="xs" style={{ opacity: 0.8 }}>Estimated monthly profit · {tier.name}</span>
        <b className="calc-big">{formatINR(Math.max(calc.net, 0))}</b>
        <div className="calc-rows">
          <div><span>Monthly sales</span><b>{formatINR(calc.monthlySales)}</b></div>
          <div><span>Gross margin</span><b>{formatINR(calc.gross)}</b></div>
          <div><span>Operating costs</span><b>−{formatINR(calc.opex)}</b></div>
          <div><span>Royalty</span><b>−{formatINR(calc.royalty)}</b></div>
          <div><span>Annual ROI</span><b>{calc.roi.toFixed(0)}%</b></div>
          <div><span>Payback</span><b>{calc.payback ? `~${calc.payback} months` : "—"}</b></div>
        </div>
        <Link to={`/franchise/apply?tier=${tierId}`} className="btn btn-white btn-block mt-16">
          Apply for {tier.investmentLabel} format <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function FranchisePage() {
  useDocumentTitle("Franchise opportunities");
  const [faq, setFaq] = useState(0);
  const [q, setQ] = useState("");
  const cities = franchiseCities.filter((c) => `${c.city} ${c.state}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page franchise">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Franchise" }]} />
        <div className="fr-hero">
          <div>
            <span className="eyebrow light">
              <Store size={13} /> D2C Mall franchise programme
            </span>
            <h1>
              Bring India's best D2C brands
              <br />
              <span>to your city.</span>
            </h1>
            <p>Three store formats from ₹11 Lakh. FOFO & FOCO models, tech-powered inventory from our 4-warehouse network, and a brand portfolio customers already love online.</p>
            <div className="row gap-6 wrap mt-24">
              <Link to="/franchise/apply" className="btn btn-lg">
                Apply now <ArrowRight size={18} />
              </Link>
              <a href="#calculator" className="btn btn-lg btn-glass">
                <Calculator size={17} /> Estimate returns
              </a>
              <Link to="/franchise/status" className="btn btn-lg btn-glass">
                <Search size={17} /> Track application
              </Link>
            </div>
          </div>
          <div className="fr-hero-stats">
            {[
              ["₹11L – ₹51L", "Investment range"],
              ["3 formats", "Express · Store · Flagship"],
              ["18 – 30 mo", "Indicative payback"],
              ["45 – 75 days", "Approval to launch"],
            ].map(([v, l], i) => (
              <motion.div key={l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                <b>{v}</b>
                <span>{l}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Store formats</span>
              <h2 className="section-title">Choose your investment</h2>
              <p className="section-sub">Every format includes branding, fit-out design, POS & inventory software, stock support and training.</p>
            </div>
          </div>
          <div className="tiers">
            {franchiseTiers.map((t, i) => (
              <motion.div key={t.id} className={cx("tier-card", t.popular && "popular")} style={{ "--tc": t.color }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                {t.popular ? <span className="tier-popular">Most popular</span> : null}
                <span className="tier-name">{t.name}</span>
                <b className="tier-price">{t.investmentLabel}</b>
                <p className="small muted">{t.tagline}</p>
                <div className="row gap-6 mt-8">
                  {t.model.map((m) => (
                    <span key={m} className="badge badge-soft-blue">{m}</span>
                  ))}
                </div>
                <div className="tier-specs">
                  <div><span>Store size</span><b>{t.areaSqft}</b></div>
                  <div><span>Assortment</span><b>{t.brands}</b></div>
                  <div><span>SKUs</span><b>{t.skus}</b></div>
                  <div><span>Team</span><b>{t.staff}</b></div>
                  <div><span>Gross margin</span><b>{t.marginPct}</b></div>
                  <div><span>Payback</span><b>{t.paybackMonths} months</b></div>
                  <div><span>Royalty</span><b>{t.royaltyPct}</b></div>
                  <div><span>Franchise fee</span><b>{t.fee}</b></div>
                </div>
                <ul className="tier-inc">
                  {t.includes.map((x) => (
                    <li key={x}>
                      <Check size={14} /> {x}
                    </li>
                  ))}
                </ul>
                <p className="xs muted">Ideal for: {t.ideal}</p>
                <Link to={`/franchise/apply?tier=${t.id}`} className={cx("btn btn-block mt-12", t.popular ? "" : "btn-outline")}>
                  Apply for {t.investmentLabel}
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="xs muted mt-12">* Store size, margins, payback and royalty are indicative and will be confirmed in your franchise proposal.</p>
        </section>

        <section className="section">
          <div className="grid grid-2">
            {Object.entries(franchiseModels).map(([k, m]) => (
              <div key={k} className={cx("model-card", k.toLowerCase())}>
                <span className="model-icon">{k === "FOFO" ? <Store size={22} /> : <Handshake size={22} />}</span>
                <h3>{m.name}</h3>
                <ul>
                  {m.points.map((p) => (
                    <li key={p}>
                      <BadgeCheck size={15} /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="calculator">
          <div className="section-head">
            <div>
              <span className="eyebrow blue">
                <TrendingUp size={13} /> Investment calculator
              </span>
              <h2 className="section-title">Estimate your returns</h2>
            </div>
          </div>
          <Calculator_ />
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="section-title">From application to launch</h2>
            </div>
          </div>
          <div className="process">
            {[
              [ClipboardCheck, "Apply online", "5-minute application with your location & investment details"],
              [PhoneCall, "Discovery call", "Our franchise team calls within 48 hours"],
              [MapPin, "Site verification", "Location, footfall and property checks by our team"],
              [FileSignature, "Agreement", "Approval, proposal and franchise agreement"],
              [Building2, "Fit-out & training", "Store build, stock allocation and staff training"],
              [Rocket, "Grand launch", "Launch marketing with D2C Street creators"],
            ].map(([Icon, t, s], i) => (
              <div key={t} className="process-step">
                <span className="process-num">{i + 1}</span>
                <Icon size={22} />
                <b className="small">{t}</b>
                <span className="xs muted">{s}</span>
              </div>
            ))}
          </div>
          <p className="xs muted mt-12">Application stages you'll see in tracking: {APPLICATION_STAGES.map((s) => s.label).join(" → ")}</p>
        </section>

        <section className="section grid grid-2">
          <div className="card card-pad">
            <div className="row between wrap gap-10">
              <h3 className="section-title" style={{ fontSize: 20 }}>Cities open for franchise</h3>
              <div className="input-group" style={{ maxWidth: 220 }}>
                <span className="addon"><Search size={14} /></span>
                <input className="input" placeholder="Search city" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="city-list mt-12">
              {cities.map((c) => (
                <div key={c.city} className="city-row">
                  <MapPin size={15} className="text-orange" />
                  <b className="small grow">
                    {c.city} <span className="xs muted">{c.state}</span>
                  </b>
                  <span className={cx("badge", c.status === "Open" ? "badge-soft-green" : "badge-soft-amber")}>{c.status}</span>
                  <span className="xs muted">Demand: {c.demand}</span>
                </div>
              ))}
            </div>
            <p className="xs muted mt-12">Don't see your city? Apply anyway — we evaluate every location.</p>
          </div>
          <div className="card card-pad">
            <h3 className="section-title" style={{ fontSize: 20 }}>Backed by our supply chain</h3>
            <p className="small muted mt-4">Stores are replenished from the nearest hub with auto-replenishment based on live sales.</p>
            <div className="col gap-10 mt-16">
              {warehouses.map((w) => (
                <div key={w.id} className="city-row">
                  <Warehouse size={15} style={{ color: w.color }} />
                  <b className="small grow">{w.name}</b>
                  <span className="xs muted">{w.capacity.toLocaleString("en-IN")} sq ft</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="card mt-16">
            {franchiseFaq.map(([q2, a], i) => (
              <div key={q2} className="fr-faq">
                <button onClick={() => setFaq(faq === i ? -1 : i)}>
                  {q2} <ChevronDown size={17} style={{ transform: faq === i ? "rotate(180deg)" : "none" }} />
                </button>
                {faq === i ? <p>{a}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="section fr-cta">
          <div>
            <h2>Ready to open your D2C Mall?</h2>
            <p>Applications are reviewed within 48 hours. No fee to apply.</p>
          </div>
          <Link to="/franchise/apply" className="btn btn-lg btn-white">
            Start application <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </div>
  );
}
