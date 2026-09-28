import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, BadgeCheck, Building2, CreditCard, Flame, History, MapPin, Percent, Repeat, ShieldCheck, Sparkles, Star, Store, TrendingUp, Truck, Warehouse, Zap } from "lucide-react";
import { bankOffers, brands, getBestSellingProducts, getNewArrivals, getProductsByBrand, products } from "../../data/catalog";
import { warehouses } from "../../data/logistics";
import { useShop } from "../../context/ShopContext";
import { compact, formatINR } from "../../lib/format";
import ProductCard from "../common/ProductCard";
import { Img, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import HeroShowcase from "./HeroShowcase";
import ShopByCategory from "./ShopByCategory";
import FlashDeals from "./FlashDeals";
import TrendingProducts from "./TrendingProducts";
import SocialStyleHub from "./SocialStyleHub";
import "./HomePage.css";

const CITIES = ["Pune", "Jaipur", "Kolkata", "Bengaluru", "Delhi", "Mumbai", "Jamshedpur", "Hyderabad", "Lucknow", "Chennai", "Indore", "Kochi"];

function LiveTicker() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 2600);
    return () => clearInterval(t);
  }, []);
  const events = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const p = products[(i * 7 + tick * 3) % products.length];
        const city = CITIES[(i * 5 + tick) % CITIES.length];
        const kind = (i + tick) % 3;
        return { p, city, kind, key: `${tick}-${i}` };
      }),
    [tick]
  );
  const e = events[0];
  return (
    <div className="ticker">
      <span className="ticker-live">
        <span className="live-dot" /> LIVE
      </span>
      <motion.div key={e.key} className="ticker-msg" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Img src={e.p.images[0]} alt="" className="ticker-thumb" label="" />
        <span>
          {e.kind === 0 ? "Someone in " : e.kind === 1 ? "A shopper from " : "Just now in "}
          <b>{e.city}</b> {e.kind === 2 ? "reordered" : "bought"} <Link to={`/product/${e.p.id}`}>{e.p.brand} {e.p.name}</Link>
        </span>
      </motion.div>
      <Link to="/pulse" className="ticker-link">
        Open D2C Pulse <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function BankOffers() {
  const icons = [CreditCard, Building2, Zap, Percent];
  return (
    <div className="bank-strip">
      {bankOffers.map((o, i) => {
        const Icon = icons[i % icons.length];
        return (
          <div key={o.id} className="bank-offer">
            <span className="bank-icon">
              <Icon size={18} />
            </span>
            <div>
              <b>{o.bank}</b>
              <p>{o.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonalSection() {
  const { recentlyViewed, wishlist, clearRecentlyViewed } = useShop();
  const recommended = useMemo(() => {
    const seedCats = [...recentlyViewed, ...wishlist].map((p) => p.category);
    const seen = new Set([...recentlyViewed, ...wishlist].map((p) => p.id));
    const cats = seedCats.length ? seedCats : ["men", "women", "beauty"];
    return products
      .filter((p) => cats.includes(p.category) && !seen.has(p.id))
      .sort((a, b) => b.rating * Math.log(b.ratingCount) - a.rating * Math.log(a.ratingCount))
      .slice(0, 12);
  }, [recentlyViewed, wishlist]);

  return (
    <>
      {recentlyViewed.length ? (
        <section className="section">
          <SectionHead
            eyebrow={<><History size={13} /> Pick up where you left off</>}
            title="Recently viewed"
            action={
              <button className="link" onClick={clearRecentlyViewed}>
                Clear history
              </button>
            }
          />
          <Rail>
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>
      ) : null}
      <section className="section">
        <SectionHead
          eyebrow={<><Sparkles size={13} /> Picked for you</>}
          eyebrowTone="blue"
          title={recentlyViewed.length || wishlist.length ? "Recommended based on your taste" : "Top rated across D2C Mall"}
          sub="Updated as you browse, save and shop"
          to="/shop?sort=rating"
          action="See more"
        />
        <Rail>
          {recommended.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </Rail>
      </section>
    </>
  );
}

function BrandDiscovery() {
  return (
    <section className="section">
      <SectionHead eyebrow={<><Store size={13} /> Brand discovery</>} title="Homegrown brands worth knowing" sub="Founder-led labels shipping directly to you" to="/brands" action="All brands" />
      <div className="brand-grid">
        {brands.slice(0, 8).map((b, i) => {
          const items = getProductsByBrand(b.id);
          const rating = items.reduce((t, p) => t + p.rating, 0) / (items.length || 1);
          return (
            <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={`/brands/${b.id}`} className="brand-card" style={{ "--brand": b.color }}>
                <div className="brand-top">
                  <span className="brand-logo">{b.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="row gap-4">
                      {b.name} <BadgeCheck size={14} className="text-blue" />
                    </b>
                    <span className="xs muted ellipsis" style={{ display: "block" }}>
                      {b.tagline}
                    </span>
                  </div>
                </div>
                <div className="brand-thumbs">
                  {items.slice(0, 3).map((p) => (
                    <Img key={p.id} src={p.images[0]} alt={p.name} label={b.name} />
                  ))}
                </div>
                <div className="row between xs muted">
                  <span className="row gap-4">
                    <Star size={12} fill="#f5a524" color="#f5a524" /> {rating.toFixed(1)} · {items.length} products
                  </span>
                  <span>
                    {b.city} · since {b.founded}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function DeliveryPromise() {
  const { pincode, openPincode } = useShop();
  return (
    <section className="section promise">
      <div className="promise-copy">
        <span className="eyebrow light">
          <Warehouse size={13} /> Multi-warehouse fulfilment
        </span>
        <h2>Shipped from the hub closest to you.</h2>
        <p>
          Every order is routed to the best of our 4 fulfilment hubs based on your pincode, live stock, courier SLAs and distance, so it arrives faster and more reliably.
        </p>
        <div className="row gap-16 wrap mt-16">
          <button className="btn" onClick={openPincode}>
            <MapPin size={17} /> {pincode ? `Delivering to ${pincode.pincode}` : "Check your pincode"}
          </button>
          <Link to="/delivery-location" className="btn btn-glass">
            How delivery works
          </Link>
        </div>
      </div>
      <div className="promise-hubs">
        {warehouses.map((w, i) => (
          <motion.div key={w.id} className="hub-card" initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <span className="hub-dot" style={{ background: w.color }} />
            <b>{w.short}</b>
            <span className="xs">{w.city}</span>
            <div className="hub-meta">
              <span>
                <Truck size={12} /> {w.slaHours}h dispatch
              </span>
              <span>Cut-off {w.cutoff}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CampaignBanners() {
  return (
    <section className="section campaign-grid">
      <Link to="/category/beauty" className="campaign campaign-a">
        <div>
          <span className="eyebrow light">Beauty week</span>
          <h3>Glow on. Clean actives from ₹349.</h3>
          <span className="btn btn-white btn-sm mt-12">
            Shop beauty <ArrowRight size={15} />
          </span>
        </div>
        <Img src={products.find((p) => p.category === "beauty").images[0]} alt="" label="Beauty" />
      </Link>
      <Link to="/category/electronics" className="campaign campaign-b">
        <div>
          <span className="eyebrow light">Made in India tech</span>
          <h3>Audio & wearables up to 60% off.</h3>
          <span className="btn btn-white btn-sm mt-12">
            Shop electronics <ArrowRight size={15} />
          </span>
        </div>
        <Img src={products.find((p) => p.category === "electronics").images[0]} alt="" label="Electronics" />
      </Link>
    </section>
  );
}

function PulseStrip() {
  const fast = [...products].sort((a, b) => b.soldLast24h - a.soldLast24h).slice(0, 4);
  const reordered = [...products].sort((a, b) => b.reorderRate - a.reorderRate).slice(0, 4);
  const cols = [
    { title: "Fast selling", icon: Flame, tone: "orange", items: fast, stat: (p) => `${compact(p.soldLast24h)} sold today` },
    { title: "Most reordered", icon: Repeat, tone: "green", items: reordered, stat: (p) => `${p.reorderRate}% reorder` },
  ];
  return (
    <section className="section">
      <SectionHead eyebrow={<><Activity size={13} /> D2C Pulse</>} eyebrowTone="blue" title="Real-time discovery" sub="What's moving across India right now" to="/pulse" action="Open Pulse" />
      <LiveTicker />
      <div className="grid grid-2 mt-16">
        {cols.map((c) => (
          <div key={c.title} className="card card-pad pulse-col">
            <div className="row gap-6 mb-16">
              <span className={`pulse-icon ${c.tone}`}>
                <c.icon size={16} />
              </span>
              <b>{c.title}</b>
            </div>
            {c.items.map((p, i) => (
              <Link key={p.id} to={`/product/${p.id}`} className="pulse-row">
                <span className="pulse-rank">{i + 1}</span>
                <Img src={p.images[0]} alt="" className="pulse-thumb" label={p.brand} />
                <span className="grow" style={{ minWidth: 0 }}>
                  <b className="small ellipsis" style={{ display: "block" }}>
                    {p.name}
                  </b>
                  <span className="xs muted">
                    {p.brand} · {formatINR(p.price)}
                  </span>
                </span>
                <span className={`xs bold text-${c.tone === "orange" ? "orange" : "green"}`}>{c.stat(p)}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function FranchiseBanner() {
  return (
    <section className="section franchise-banner">
      <div>
        <span className="eyebrow light">
          <Store size={13} /> Franchise opportunities
        </span>
        <h2>Own a D2C Mall store in your city.</h2>
        <p>FOFO and FOCO models · curated D2C assortment · tech-enabled inventory from our warehouse network.</p>
      </div>
      <div className="row gap-16 wrap">
        <Link to="/franchise" className="btn btn-lg">
          Explore franchise <ArrowRight size={17} />
        </Link>
        <Link to="/franchise/apply" className="btn btn-lg btn-glass">
          Apply now
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle(null);
  return (
    <div className="page home">
      <div className="container">
        <HeroShowcase />
        <BankOffers />
        <ShopByCategory />
        <FlashDeals />
        <TrendingProducts />
        <PersonalSection />
        <CampaignBanners />
        <SocialStyleHub />
        <TrendingProducts title="Best sellers" eyebrow="Loved by 1M+ shoppers" source="bestseller" to="/shop?sort=popularity" products={getBestSellingProducts()} />
        <BrandDiscovery />
        <PulseStrip />
        <TrendingProducts title="New arrivals" eyebrow="Fresh drops every Friday" source="new" to="/new-arrivals" products={getNewArrivals()} />
        <DeliveryPromise />
        <section className="section trust-band">
          {[
            [ShieldCheck, "Secure checkout", "Razorpay-verified payments · PCI-DSS"],
            [BadgeCheck, "Authentic brands", "Onboarded directly, never resellers"],
            [TrendingUp, "Delivery confidence", "Live ETA from stock & courier SLA"],
            [Repeat, "Easy returns", "Doorstep pickup · refund in 48h"],
          ].map(([Icon, t, s]) => (
            <div key={t} className="row gap-16">
              <Icon size={22} className="text-blue" />
              <div>
                <b className="small">{t}</b>
                <div className="xs muted">{s}</div>
              </div>
            </div>
          ))}
        </section>
        <FranchiseBanner />
      </div>
    </div>
  );
}
