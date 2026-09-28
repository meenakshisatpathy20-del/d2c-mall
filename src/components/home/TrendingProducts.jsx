import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { categories, products as allProducts } from "../../data/catalog";
import ProductCard from "../common/ProductCard";
import { Rail, SectionHead } from "../common/ui";
import { cx } from "../../lib/format";
import "./TrendingProducts.css";

/**
 * Tabbed product rail. `source` picks the ranking; tabs filter by category.
 */
export default function TrendingProducts({ title = "Trending right now", eyebrow = "What India is wearing", source = "trending", to = "/trending", products }) {
  const [tab, setTab] = useState("all");
  const list = useMemo(() => {
    let base = products || allProducts.filter((p) => p.tags.includes(source));
    if (source === "trending") base = [...base].sort((a, b) => b.soldLast24h - a.soldLast24h);
    return tab === "all" ? base : base.filter((p) => p.category === tab);
  }, [tab, source, products]);

  const tabs = useMemo(() => {
    const base = products || allProducts.filter((p) => p.tags.includes(source));
    return categories.filter((c) => base.some((p) => p.category === c.id));
  }, [source, products]);

  return (
    <section className="section">
      <SectionHead eyebrow={<><TrendingUp size={13} /> {eyebrow}</>} title={title} to={to} action="View all" />
      <div className="chips mb-16">
        <button className={cx("chip", tab === "all" && "active")} onClick={() => setTab("all")}>
          All
        </button>
        {tabs.map((c) => (
          <button key={c.id} className={cx("chip", tab === c.id && "active")} onClick={() => setTab(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
          <Rail>
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} rank={source === "trending" && i < 3 ? i + 1 : undefined} />
            ))}
          </Rail>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
