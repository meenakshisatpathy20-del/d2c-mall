import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Copy, Flame, Percent, Tag, Zap } from "lucide-react";
import { bankOffers, getFlashDealProducts, products } from "../../data/catalog";
import { coupons } from "../../data/coupons";
import { useShop } from "../../context/ShopContext";
import { formatDate } from "../../lib/format";
import { toast } from "../../lib/toast";
import { flashEndsAt } from "../home/FlashDeals";
import ProductCard from "../common/ProductCard";
import { Breadcrumbs, Countdown, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./DealsPage.css";

export default function DealsPage() {
  useDocumentTitle("Deals of the day");
  const { applyCoupon } = useShop();
  const deals = useMemo(() => products.filter((p) => p.discount >= 30), []);
  const flash = getFlashDealProducts();
  const ends = useMemo(flashEndsAt, []);
  const live = coupons.filter((c) => c.expiresAt > Date.now());

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Deals" }]} />
        <div className="page-hero orange deals-hero">
          <div>
            <span className="eyebrow light">
              <Flame size={13} /> Deals of the day
            </span>
            <h1>Big savings. Verified brands.</h1>
            <p>Handpicked offers up to 70% off, plus coupons and bank offers stacked at checkout.</p>
          </div>
          <div className="deals-timer">
            <span className="xs bold" style={{ color: "#ffd2ad" }}>
              <Zap size={13} /> Flash sale ends in
            </span>
            <Countdown target={ends} dark />
          </div>
        </div>

        <section className="section">
          <SectionHead eyebrow={<><Tag size={13} /> Coupons</>} title="Coupons you can use today" sub="Tap to copy and auto-apply in your bag" />
          <div className="coupon-grid">
            {live.map((c) => (
              <div key={c.code} className="coupon">
                <div className="coupon-left">
                  <Percent size={20} />
                  <b>{c.type === "percent" ? `${c.value}%` : c.type === "flat" ? `₹${c.value}` : "FREE"}</b>
                  <span>{c.type === "shipping" ? "Delivery" : "OFF"}</span>
                </div>
                <div className="coupon-body">
                  <b>{c.title}</b>
                  <p className="xs muted">{c.description}</p>
                  <div className="row between mt-8">
                    <span className="coupon-code">{c.code}</span>
                    <button
                      className="link small"
                      onClick={() => {
                        applyCoupon(c.code);
                        navigator.clipboard?.writeText(c.code).catch(() => {});
                        toast(`${c.code} copied & applied to your bag`);
                      }}
                    >
                      <Copy size={13} /> Apply
                    </button>
                  </div>
                  <span className="xs faint">Valid till {formatDate(c.expiresAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bank-mini mt-16">
            {bankOffers.map((o) => (
              <span key={o.id}>
                <b>{o.bank}</b> · {o.text}
              </span>
            ))}
          </div>
        </section>

        <section className="section">
          <SectionHead eyebrow={<><Zap size={13} /> Lightning deals</>} title="Flash deals" action="Shop all" to="#all-deals" />
          <Rail>
            {flash.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>

        <section className="section" id="all-deals">
          <SectionHead title="All deals · 30% off and more" eyebrow="Filter & sort" />
          <ListingView products={deals} defaultSort="discount" />
        </section>
        <p className="center small muted mt-24">
          Prices and availability are live. <Link to="/pulse" className="link">See what's selling fast →</Link>
        </p>
      </div>
    </div>
  );
}
