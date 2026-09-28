import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { getNewArrivals, products } from "../../data/catalog";
import { formatDate } from "../../lib/format";
import ProductCard from "../common/ProductCard";
import { Breadcrumbs, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./NewArrivalsPage.css";

export default function NewArrivalsPage() {
  useDocumentTitle("New arrivals");
  const fresh = useMemo(() => getNewArrivals(), []);
  const newest = useMemo(() => [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 36), []);
  const nextDrop = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    d.setHours(11, 0, 0, 0);
    return d.getTime();
  }, []);

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "New arrivals" }]} />
        <div className="page-hero green">
          <span className="eyebrow light">
            <Sparkles size={13} /> Fresh drops every Friday
          </span>
          <h1>Just landed.</h1>
          <p>The newest styles from India's fastest-growing D2C labels. Limited quantities — once they're gone, they're gone.</p>
          <div className="drop-strip">
            <span className="live-dot" /> Next drop: <b>{formatDate(nextDrop, { weekday: true })}, 11:00 AM</b>
            <span className="badge badge-soft-green">{fresh.length} styles this week</span>
          </div>
        </div>

        <section className="section">
          <SectionHead eyebrow="This week's drop" title="Hot off the shelf" />
          <Rail>
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>

        <section className="section">
          <SectionHead eyebrow="Last 60 days" title="All new arrivals" />
          <ListingView products={newest} defaultSort="newest" />
        </section>
      </div>
    </div>
  );
}
