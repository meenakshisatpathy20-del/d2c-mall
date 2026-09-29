import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { getFlashDealProducts, seeded } from "../../data/catalog";
import { useShop } from "../../context/ShopContext";
import { Countdown, Img, Price, Rail } from "../common/ui";
import { stockOf } from "../../lib/services/inventory";
import "./FlashDeals.css";

/** Flash sale ends at the next 6-hour boundary so the timer is always live. */
export function flashEndsAt() {
  const d = new Date();
  const block = 6 * 3600000;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return start + Math.ceil((d.getTime() - start + 1) / block) * block;
}

export default function FlashDeals() {
  const deals = useMemo(() => getFlashDealProducts(), []);
  const { addToCart, openQuickView, inventory } = useShop();
  const ends = useMemo(flashEndsAt, []);

  return (
    <section className="section flash">
      <div className="flash-head">
        <div className="row gap-16 wrap">
          <span className="flash-bolt">
            <Zap size={22} fill="currentColor" />
          </span>
          <div>
            <span className="eyebrow light">Flash deals · live now</span>
            <h2>Lightning prices. Limited stock.</h2>
          </div>
        </div>
        <div className="row gap-16 wrap">
          <div className="col gap-4">
            <span className="xs" style={{ color: "#ffd2ad", fontWeight: 700 }}>Ends in</span>
            <Countdown target={ends} dark />
          </div>
          <Link to="/deals" className="btn btn-white">
            All deals <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <Rail itemWidth="minmax(220px, 240px)">
        {deals.map((p) => {
          const rnd = seeded(`${p.id}-claim`);
          const claimed = Math.min(96, Math.floor(45 + rnd() * 50));
          const left = stockOf(p.id, inventory).sellable;
          return (
            <div key={p.id} className="flash-card">
              <Link to={`/product/${p.id}`} className="flash-media">
                <Img src={p.images[0]} alt={p.name} label={p.brand} />
                <span className="badge badge-orange flash-off">-{p.discount}%</span>
              </Link>
              <div className="flash-body">
                <b className="ellipsis">{p.brand}</b>
                <span className="xs muted ellipsis">{p.name}</span>
                <Price price={p.price} mrp={p.mrp} showOff={false} />
                <div className="progress">
                  <span style={{ width: `${claimed}%` }} />
                </div>
                <div className="row between xs">
                  <span className="text-orange bold">{claimed}% claimed</span>
                  <span className="muted">{left} left</span>
                </div>
                <button
                  className="btn btn-sm btn-dark btn-block"
                  onClick={() => (p.sizes.length ? openQuickView(p.id) : addToCart(p))}
                  disabled={left <= 0}
                >
                  {left <= 0 ? "Sold out" : p.sizes.length ? "Choose size" : "Grab deal"}
                </button>
              </div>
            </div>
          );
        })}
      </Rail>
    </section>
  );
}
