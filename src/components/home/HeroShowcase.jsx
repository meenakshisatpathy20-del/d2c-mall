import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MousePointerClick, Sparkles, Truck } from "lucide-react";
import { getTrendingProducts, heroBanners } from "../../data/catalog";
import { DiscoveryScene } from "../common/ThreeSafe";
import { cx } from "../../lib/format";
import "./HeroShowcase.css";

const THEMES = {
  navy: "linear-gradient(120deg, rgba(7,19,47,0.96) 0%, rgba(19,39,85,0.9) 48%, rgba(36,87,255,0.55) 100%)",
  purple: "linear-gradient(120deg, rgba(27,15,61,0.96) 0%, rgba(62,28,150,0.88) 50%, rgba(238,70,188,0.45) 100%)",
  orange: "linear-gradient(120deg, rgba(40,14,0,0.95) 0%, rgba(122,46,0,0.88) 50%, rgba(255,107,0,0.55) 100%)",
};

export default function HeroShowcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const banner = heroBanners[i];
  const trending = getTrendingProducts();

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % heroBanners.length), 6500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence mode="sync">
        <motion.div
          key={banner.id}
          className="hero-bg"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          style={{ backgroundImage: `${THEMES[banner.theme]}, url(${banner.image})` }}
        />
      </AnimatePresence>
      <div className="hero-glow" />

      <div className="hero-grid">
        <div className="hero-copy">
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
            >
              <span className="hero-eyebrow">
                <Sparkles size={14} /> {banner.eyebrow}
              </span>
              <h1>
                {banner.title}
                <span className="hero-highlight">{banner.highlight}</span>
              </h1>
              <p>{banner.subtitle}</p>
              <div className="hero-ctas">
                {banner.ctas.map((c) => (
                  <Link key={c.label} to={c.href} className={cx("btn btn-lg", c.variant === "glass" ? "btn-glass" : "")}>
                    {c.label} {c.variant ? null : <ArrowRight size={18} />}
                  </Link>
                ))}
              </div>
              <div className="hero-stats">
                {banner.stats.map(([v, l]) => (
                  <div key={l}>
                    <b>{v}</b>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="hero-foot">
            <div className="hero-dots">
              {heroBanners.map((b, idx) => (
                <button key={b.id} className={cx(idx === i && "active")} onClick={() => setI(idx)} aria-label={`Show ${b.eyebrow}`}>
                  <span style={idx === i && !paused ? { animationDuration: "6.5s" } : undefined} />
                </button>
              ))}
            </div>
            <div className="row gap-6">
              <button className="hero-arrow" onClick={() => setI((i - 1 + heroBanners.length) % heroBanners.length)} aria-label="Previous">
                <ChevronLeft size={18} />
              </button>
              <button className="hero-arrow" onClick={() => setI((i + 1) % heroBanners.length)} aria-label="Next">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="hero-3d">
          <div className="hero-3d-tag">
            <MousePointerClick size={14} /> Drag to explore · click a product
          </div>
          <DiscoveryScene products={trending} onSelect={(p) => navigate(`/product/${p.id}`)} />
          <div className="hero-floating hero-floating-a">
            <BadgeCheck size={16} />
            <div>
              <b>240+ verified brands</b>
              <span>Onboarded directly</span>
            </div>
          </div>
          <div className="hero-floating hero-floating-b">
            <Truck size={16} />
            <div>
              <b>24h express</b>
              <span>From 4 hubs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
