/*
 * D2C Pulse — real-time product discovery. Signals are computed from the
 * order/inventory store (and seeded catalogue metrics) and refresh live.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, Flame, MapPin, Package, Repeat, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { categories, getNewArrivals, products } from "../../data/catalog";
import { warehouses } from "../../data/logistics";
import { useShop } from "../../context/ShopContext";
import { useStore } from "../../lib/store";
import { stockOf } from "../../lib/services/inventory";
import { compact, cx, formatINR, timeAgo } from "../../lib/format";
import { GlobeScene } from "../common/ThreeSafe";
import { Breadcrumbs, Img, useDocumentTitle } from "../common/ui";
import "./PulsePage.css";

const SIGNALS = [
  { id: "trending", label: "Trending", icon: TrendingUp, tone: "blue" },
  { id: "fast", label: "Fast selling", icon: Flame, tone: "orange" },
  { id: "low", label: "Low stock", icon: AlertTriangle, tone: "red" },
  { id: "rated", label: "Highly rated", icon: Star, tone: "amber" },
  { id: "local", label: "Popular near you", icon: MapPin, tone: "purple" },
  { id: "reordered", label: "Most reordered", icon: Repeat, tone: "green" },
  { id: "new", label: "New drops", icon: Sparkles, tone: "pink" },
];

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Jaipur", "Hyderabad", "Pune", "Chennai", "Kolkata", "Jamshedpur", "Lucknow"];

export default function PulsePage() {
  useDocumentTitle("D2C Pulse");
  const { inventory, pincode, openPincode } = useShop();
  const orders = useStore((s) => s.orders);
  const [signal, setSignal] = useState("trending");
  const [tick, setTick] = useState(0);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const r = Math.random();
    const p = products[Math.floor(r * products.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const kind = ["bought", "added to bag", "wishlisted", "reordered"][Math.floor(Math.random() * 4)];
    setFeed((f) => (f[0]?.tick === tick ? f : [{ id: `${tick}-${Date.now()}`, tick, p, city, kind, at: Date.now() }, ...f].slice(0, 8)));
  }, [tick]);

  const city = pincode?.city?.split(" ")[0];
  // live jitter so numbers move
  const jitter = (p) => p.soldLast24h + ((tick * (p.id.length + 3)) % 17);

  const list = useMemo(() => {
    const withStock = products.map((p) => ({ ...p, live: stockOf(p.id, inventory).sellable }));
    switch (signal) {
      case "fast": return [...withStock].sort((a, b) => jitter(b) - jitter(a));
      case "low": return withStock.filter((p) => p.live > 0 && p.live <= 12).sort((a, b) => a.live - b.live);
      case "rated": return [...withStock].sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
      case "local": return withStock.filter((p) => !city || p.popularIn.some((c) => c.toLowerCase().includes(city.toLowerCase()))).sort((a, b) => b.soldLast24h - a.soldLast24h);
      case "reordered": return [...withStock].sort((a, b) => b.reorderRate - a.reorderRate);
      case "new": return getNewArrivals().map((p) => ({ ...p, live: stockOf(p.id, inventory).sellable }));
      default: return [...withStock].sort((a, b) => b.soldLast24h * b.rating - a.soldLast24h * a.rating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal, inventory, city, tick]);

  const ordersToday = orders.filter((o) => Date.now() - o.createdAt < 86400000).length + 1840 + tick * 3;
  const gmv = orders.filter((o) => Date.now() - o.createdAt < 86400000).reduce((t, o) => t + o.pricing.total, 0) + 1842000 + tick * 2100;
  const catHeat = categories.map((c) => ({ c, v: products.filter((p) => p.category === c.id).reduce((t, p) => t + jitter(p), 0) }));
  const maxHeat = Math.max(...catHeat.map((x) => x.v));
  const intensity = warehouses.map((w, i) => 0.4 + (((tick + i * 3) % 7) / 7) * 0.6);

  return (
    <div className="page pulse">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "D2C Pulse" }]} />
        <div className="pulse-hero">
          <div className="pulse-hero-copy">
            <span className="eyebrow light">
              <Activity size={13} /> D2C Pulse · live
            </span>
            <h1>The heartbeat of Indian D2C.</h1>
            <p>Real-time signals from orders, stock and community activity — see what's hot, what's running out and what your city is buying.</p>
            <div className="pulse-kpis">
              <div>
                <span className="live-dot" />
                <b>{compact(ordersToday)}</b>
                <span>orders today</span>
              </div>
              <div>
                <b>{formatINR(gmv).replace("₹", "₹")}</b>
                <span>sold in 24h</span>
              </div>
              <div>
                <b>{warehouses.length}</b>
                <span>hubs dispatching</span>
              </div>
            </div>
          </div>
          <div className="pulse-globe">
            <GlobeScene intensity={intensity} />
            <div className="globe-legend">
              {warehouses.map((w) => (
                <span key={w.id}>
                  <i style={{ background: w.color }} /> {w.short}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pulse-grid">
          <div>
            <div className="signal-tabs">
              {SIGNALS.map((s) => (
                <button key={s.id} className={cx("signal", `tone-${s.tone}`, signal === s.id && "active")} onClick={() => setSignal(s.id)}>
                  <s.icon size={15} /> {s.label}
                </button>
              ))}
            </div>
            {signal === "local" && !city ? (
              <div className="notice info mt-16">
                <MapPin size={16} /> Set your pincode to see what's popular in your city.
                <button className="link" onClick={openPincode}>
                  Set pincode
                </button>
              </div>
            ) : null}
            <AnimatePresence mode="popLayout">
              <motion.div key={signal} className="signal-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {list.slice(0, 12).map((p, i) => (
                  <motion.div layout key={p.id}>
                    <Link to={`/product/${p.id}`} className="signal-row">
                      <span className="signal-rank">{String(i + 1).padStart(2, "0")}</span>
                      <Img src={p.images[0]} alt="" className="signal-thumb" label={p.brand} />
                      <span className="grow" style={{ minWidth: 0 }}>
                        <b className="ellipsis" style={{ display: "block" }}>
                          {p.name}
                        </b>
                        <span className="xs muted">
                          {p.brand} · {formatINR(p.price)} <span className="strike faint">{formatINR(p.mrp)}</span>
                        </span>
                      </span>
                      <span className="signal-metric">
                        {signal === "fast" || signal === "trending" ? (
                          <>
                            <b className="text-orange">{compact(jitter(p))}</b>
                            <span>sold / 24h</span>
                          </>
                        ) : signal === "low" ? (
                          <>
                            <b className="text-red">{p.live}</b>
                            <span>left</span>
                          </>
                        ) : signal === "rated" ? (
                          <>
                            <b className="text-green">{p.rating}★</b>
                            <span>{compact(p.ratingCount)} ratings</span>
                          </>
                        ) : signal === "reordered" ? (
                          <>
                            <b className="text-green">{p.reorderRate}%</b>
                            <span>reorder rate</span>
                          </>
                        ) : signal === "new" ? (
                          <>
                            <b className="text-blue">NEW</b>
                            <span>{timeAgo(p.createdAt)}</span>
                          </>
                        ) : (
                          <>
                            <b className="text-blue">{p.popularIn[0]}</b>
                            <span>hotspot</span>
                          </>
                        )}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <aside className="col gap-16">
            <div className="card card-pad">
              <div className="row between mb-16">
                <b className="row gap-6">
                  <Zap size={16} className="text-orange" /> Live activity
                </b>
                <span className="live-dot" />
              </div>
              <div className="feed">
                <AnimatePresence initial={false}>
                  {feed.map((f) => (
                    <motion.div key={f.id} className="feed-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}>
                      <Img src={f.p.images[0]} alt="" className="feed-thumb" label="" />
                      <span className="small">
                        Someone in <b>{f.city}</b> {f.kind} <Link to={`/product/${f.p.id}`} className="link">{f.p.name}</Link>
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            <div className="card card-pad">
              <b className="row gap-6 mb-16">
                <Package size={16} className="text-blue" /> Category heat
              </b>
              {catHeat.map(({ c, v }) => (
                <Link key={c.id} to={`/category/${c.id}`} className="heat-row">
                  <span className="small bold">{c.name}</span>
                  <div className="progress blue">
                    <span style={{ width: `${(v / maxHeat) * 100}%` }} />
                  </div>
                  <span className="xs muted">{compact(v)}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
