import { Link, useLocation } from "react-router-dom";
import { GitCompareArrows, ShoppingBag, Star, X } from "lucide-react";
import { productMap } from "../../data/catalog";
import { useShop } from "../../context/ShopContext";
import { clearCompare, toggleCompare, useCompare } from "../../lib/services/extras";
import { stockOf } from "../../lib/services/inventory";
import { formatINR } from "../../lib/format";
import { Breadcrumbs, Empty, Img, useDocumentTitle } from "../common/ui";
import "./Compare.css";

const ROWS = [
  ["Price", (p) => <b>{formatINR(p.price)}</b>],
  ["MRP", (p) => <span className="strike faint">{formatINR(p.mrp)}</span>],
  ["Discount", (p) => <span className="text-green bold">{p.discount}% off</span>],
  ["Rating", (p) => <span className="row gap-4"><Star size={13} fill="#12b76a" color="#12b76a" /> {p.rating} ({p.ratingCount.toLocaleString("en-IN")})</span>],
  ["Brand", (p) => p.brand],
  ["Type", (p) => p.subcategory],
  ["Material", (p) => p.material],
  ["Colours", (p) => p.colors.map((c) => c.name).join(", ") || "—"],
  ["Sizes", (p) => p.sizes.join(", ") || "One size"],
  ["Returns", (p) => (p.returnDays ? `${p.returnDays} days` : "Non-returnable")],
  ["Cash on Delivery", (p) => (p.cod ? "Available" : "No")],
  ["Highlights", (p) => <ul className="cmp-hl">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>],
];

export default function ComparePage() {
  useDocumentTitle("Compare products");
  const ids = useCompare();
  const { addToCart, openQuickView, inventory } = useShop();
  const items = ids.map((id) => productMap[id]).filter(Boolean);

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Compare" }]} />
        <div className="row between mb-16">
          <h1 className="row gap-6" style={{ fontSize: 26, fontWeight: 800 }}>
            <GitCompareArrows size={24} className="text-blue" /> Compare products
          </h1>
          {items.length ? <button className="btn btn-outline btn-sm" onClick={clearCompare}>Clear all</button> : null}
        </div>
        {items.length ? (
          <div className="table-wrap">
            <table className="table cmp-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>{items.length} of 4 products</th>
                  {items.map((p) => (
                    <th key={p.id}>
                      <div className="cmp-head">
                        <button className="icon-btn sm cmp-x" onClick={() => toggleCompare(p)} aria-label="Remove"><X size={15} /></button>
                        <Link to={`/product/${p.id}`}>
                          <Img src={p.images[0]} alt="" label={p.brand} />
                        </Link>
                        <b className="small" style={{ textTransform: "none", color: "var(--ink)", letterSpacing: 0 }}>{p.name}</b>
                        <button className="btn btn-sm" disabled={stockOf(p.id, inventory).sellable <= 0} onClick={() => (p.sizes.length ? openQuickView(p.id) : addToCart(p))}>
                          <ShoppingBag size={14} /> Add to bag
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => (
                  <tr key={label}>
                    <td className="small bold">{label}</td>
                    {items.map((p) => (
                      <td key={p.id} className="small">{fn(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={<GitCompareArrows size={32} />} title="Nothing to compare yet" text="Tap “Compare” on up to 4 products from the same category to see them side by side." action={<Link to="/shop" className="btn">Browse products</Link>} />
        )}
      </div>
    </div>
  );
}

const TRAY_HIDDEN = /^\/(compare|checkout|order-success|orders|account|login|admin)/;

export function CompareTray() {
  const ids = useCompare();
  const { pathname } = useLocation();
  const items = ids.map((id) => productMap[id]).filter(Boolean);
  if (!items.length || TRAY_HIDDEN.test(pathname)) return null;
  return (
    <div className="cmp-tray">
      <div className="cmp-tray-items">
        {items.map((p) => (
          <div key={p.id} className="cmp-tray-item">
            <Img src={p.images[0]} alt="" label={p.brand.slice(0, 2)} />
            <button onClick={() => toggleCompare(p)} aria-label="Remove"><X size={11} /></button>
          </div>
        ))}
        {Array.from({ length: 4 - items.length }, (_, i) => (
          <div key={i} className="cmp-tray-item cmp-slot">+</div>
        ))}
      </div>
      <Link to="/compare" className="btn btn-blue btn-sm" aria-disabled={items.length < 2}>
        <GitCompareArrows size={15} /> Compare ({items.length})
      </Link>
      <button className="link xs" onClick={clearCompare} style={{ color: "#cbd5ea" }}>Clear</button>
    </div>
  );
}
