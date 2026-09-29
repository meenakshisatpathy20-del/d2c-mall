import { useMemo, useState } from "react";
import { Banknote, Boxes, Clock, Gauge, MapPin, Route, Search, Star, Truck, Warehouse, Zap } from "lucide-react";
import { useShop } from "../context/ShopContext";
import { lookupPincode, popularPincodes, warehouses, distanceKm, zoneFlags } from "../data/logistics";
import { courierQuotes, planFulfilment, transitDays } from "../lib/delivery";
import { dayLabel, formatINR } from "../lib/format";
import { GlobeScene } from "../components/common/ThreeSafe";
import { Breadcrumbs, useDocumentTitle } from "../components/common/ui";
import "./DeliveryLocationPage.css";

export default function DeliveryLocationPage() {
  useDocumentTitle("Delivery & serviceability");
  const { pincode, setPincode } = useShop();
  const [value, setValue] = useState(pincode?.pincode || "");
  const [pin, setPin] = useState(pincode?.pincode || "");
  const [error, setError] = useState("");

  const result = useMemo(() => {
    if (!pin) return null;
    const loc = lookupPincode(pin);
    if (!loc) return { error: "Enter a valid 6-digit Indian pincode." };
    const plan = planFulfilment(pin, [], {});
    const flags = zoneFlags(pin);
    const ranked = warehouses
      .map((w) => {
        const km = distanceKm(loc, w);
        return { w, km, days: transitDays(km, flags.special), quotes: courierQuotes(km, 1, flags, false) };
      })
      .sort((a, b) => a.days - b.days || a.km - b.km);
    return { loc, plan, ranked, flags };
  }, [pin]);

  const check = (e) => {
    e?.preventDefault();
    if (!lookupPincode(value)) return setError("Enter a valid 6-digit Indian pincode.");
    setError("");
    setPin(value);
    const loc = lookupPincode(value);
    setPincode(value, { city: loc.city, state: loc.state });
  };

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Delivery & serviceability" }]} />
        <div className="dl-hero">
          <div className="dl-copy">
            <span className="eyebrow light">
              <Truck size={13} /> Pincode serviceability
            </span>
            <h1>Fast delivery, from the right warehouse.</h1>
            <p>Check delivery time, COD and express availability for any pincode. Orders are auto-routed to the best of our 4 hubs.</p>
            <form className="dl-search" onSubmit={check}>
              <MapPin size={18} />
              <input inputMode="numeric" maxLength={6} placeholder="Enter pincode" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} />
              <button className="btn" type="submit">
                <Search size={16} /> Check
              </button>
            </form>
            {error ? <p className="xs" style={{ color: "#ffb4b4" }}>{error}</p> : null}
            <div className="row wrap gap-6 mt-12">
              {popularPincodes.map((p) => (
                <button key={p.pincode} className="dl-chip" onClick={() => { setValue(p.pincode); setPin(p.pincode); }}>
                  {p.city}
                </button>
              ))}
            </div>
          </div>
          <div className="dl-globe">
            <GlobeScene />
          </div>
        </div>

        {result?.error ? <div className="notice error mt-24">{result.error}</div> : null}

        {result?.loc ? (
          <div className="col gap-16 mt-24 fade-up">
            {!result.plan.ok ? (
              <div className="notice error">{result.plan.reason}</div>
            ) : (
              <div className="grid grid-4">
                <div className="kpi">
                  <div className="kpi-label row gap-6"><MapPin size={14} /> Location</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{result.loc.city}</div>
                  <div className="kpi-delta muted">{result.loc.state} · {pin}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label row gap-6"><Truck size={14} /> Standard delivery</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{dayLabel(result.plan.eta)}</div>
                  <div className="kpi-delta text-green">{result.plan.etaDays} day(s) · free over ₹499</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label row gap-6"><Zap size={14} /> Express</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{result.plan.expressAvailable ? dayLabel(result.plan.expressEta) : "N/A"}</div>
                  <div className="kpi-delta muted">{result.plan.expressAvailable ? "+₹99" : "Not in this zone"}</div>
                </div>
                <div className="kpi">
                  <div className="kpi-label row gap-6"><Banknote size={14} /> Cash on Delivery</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{result.plan.codAvailable ? "Available" : "Prepaid only"}</div>
                  <div className="kpi-delta muted">Up to ₹20,000 · ₹29 fee</div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-head">
                <b className="row gap-6">
                  <Warehouse size={17} className="text-blue" /> Warehouse ranking for {result.loc.city}
                </b>
                <span className="xs muted">Ranked by delivery time, then distance</span>
              </div>
              <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Warehouse</th>
                      <th>Distance</th>
                      <th>Transit</th>
                      <th>Dispatch SLA</th>
                      <th>Best courier</th>
                      <th>Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ranked.map((r, i) => (
                      <tr key={r.w.id}>
                        <td><b>{i + 1}</b></td>
                        <td>
                          <span className="row gap-6">
                            <span className="dl-dot" style={{ background: r.w.color }} />
                            <b className="small">{r.w.name}</b>
                            {i === 0 ? <span className="badge badge-soft-green">Primary</span> : null}
                          </span>
                        </td>
                        <td className="small">{r.km} km</td>
                        <td className="small">{r.days} day(s)</td>
                        <td className="small">{r.w.slaHours}h · cut-off {r.w.cutoff}</td>
                        <td className="small">
                          {r.quotes[0]?.name} <span className="xs muted"><Star size={10} fill="#f5a524" color="#f5a524" /> {r.quotes[0]?.rating}</span>
                        </td>
                        <td className="small">{formatINR(r.quotes[0]?.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card card-pad">
              <b className="row gap-6">
                <Truck size={17} className="text-orange" /> Courier options from {result.ranked[0].w.short} (via Shiprocket)
              </b>
              <div className="grid grid-3 mt-12">
                {result.ranked[0].quotes.map((c) => (
                  <div key={c.id} className="soft-panel">
                    <div className="row between">
                      <b className="small">{c.name}</b>
                      <span className="xs row gap-4"><Star size={11} fill="#f5a524" color="#f5a524" /> {c.rating}</span>
                    </div>
                    <div className="xs muted mt-4">
                      {c.days} day(s) · {formatINR(c.rate)} · {c.cod ? "COD" : "Prepaid only"} {c.express ? "· Express" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="section">
          <h2 className="section-title">How we pick your warehouse</h2>
          <div className="grid grid-3 mt-16">
            {[
              [MapPin, "Destination pincode", "Distance and zone (metro, regional, special) from each hub"],
              [Boxes, "Live stock", "Available minus reserved stock at each warehouse, per item"],
              [Clock, "Delivery SLA", "Dispatch cut-off and transit time for each route"],
              [Route, "Fewest shipments", "Prefer one hub for the whole order; split only when faster"],
              [Truck, "Courier serviceability", "Shiprocket courier coverage, COD and express support"],
              [Gauge, "Delivery confidence", "Score from distance, zone and stock depth"],
            ].map(([Icon, t, s]) => (
              <div key={t} className="card card-pad row-top gap-16">
                <span className="dl-icon"><Icon size={18} /></span>
                <div>
                  <b className="small">{t}</b>
                  <p className="xs muted mt-4">{s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
