import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Hash, MapPin, TrendingUp } from "lucide-react";
import { products } from "../../data/catalog";
import { trendingHashtags } from "../../data/social";
import { useShop } from "../../context/ShopContext";
import { compact, cx } from "../../lib/format";
import { ProductGrid } from "../common/ProductCard";
import { Breadcrumbs, Img, SectionHead, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./TrendingPage.css";

const WINDOWS = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "This week" },
  { id: "30d", label: "This month" },
];

export default function TrendingPage() {
  useDocumentTitle("Trending now");
  const { pincode } = useShop();
  const [win, setWin] = useState("24h");
  const ranked = useMemo(() => {
    const factor = { "24h": (p) => p.soldLast24h, "7d": (p) => p.soldLast24h * 0.6 + p.ratingCount * 0.08, "30d": (p) => p.ratingCount * 0.2 + p.reorderRate * 10 }[win];
    return [...products].sort((a, b) => factor(b) - factor(a));
  }, [win]);
  const city = pincode?.city?.split(" ")[0];
  const local = useMemo(() => (city ? products.filter((p) => p.popularIn.some((c) => c.toLowerCase().includes(city.toLowerCase()))) : []), [city]);

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Trending" }]} />
        <div className="page-hero purple">
          <span className="eyebrow light">
            <TrendingUp size={13} /> Trending now
          </span>
          <h1>What India is buying.</h1>
          <p>Live rankings from real orders, saves and D2C Street activity — refreshed continuously.</p>
          <div className="row wrap gap-6 mt-16">
            {trendingHashtags.map((h) => (
              <Link key={h} to="/d2c-street" className="hash">
                <Hash size={12} /> {h.slice(1)}
              </Link>
            ))}
          </div>
        </div>

        <section className="section">
          <SectionHead eyebrow={<><Flame size={13} /> Top 5</>} title="The leaderboard" action={
            <div className="seg">
              {WINDOWS.map((w) => (
                <button key={w.id} className={cx(win === w.id && "active")} onClick={() => setWin(w.id)}>
                  {w.label}
                </button>
              ))}
            </div>
          } />
          <div className="leaderboard">
            {ranked.slice(0, 5).map((p, i) => (
              <Link key={p.id} to={`/product/${p.id}`} className={cx("lb-item", i === 0 && "first")}>
                <span className="lb-rank">{i + 1}</span>
                <Img src={p.images[0]} alt={p.name} label={p.brand} />
                <div className="lb-copy">
                  <b>{p.brand}</b>
                  <span className="ellipsis">{p.name}</span>
                  <em>
                    <Flame size={12} /> {compact(p.soldLast24h)} sold
                  </em>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {local.length ? (
          <section className="section">
            <SectionHead eyebrow={<><MapPin size={13} /> Near you</>} eyebrowTone="blue" title={`Popular in ${city}`} />
            <ProductGrid products={local.slice(0, 8)} />
          </section>
        ) : null}

        <section className="section">
          <SectionHead eyebrow="Everything trending" title="Browse the full chart" />
          <ListingView products={ranked.slice(0, 40)} defaultSort="relevance" />
        </section>
      </div>
    </div>
  );
}
