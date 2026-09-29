import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Heart, Share2, ShoppingBag, Trash2, TrendingDown } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { stockOf } from "../../lib/services/inventory";
import { cx, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { getTrendingProducts } from "../../data/catalog";
import ProductCard from "../common/ProductCard";
import { Breadcrumbs, Empty, Img, Price, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import "./WishlistPage.css";

export default function WishlistPage() {
  useDocumentTitle("Wishlist");
  const { wishlist, removeFromWishlist, moveWishlistToCart, inventory } = useShop();
  const [sizes, setSizes] = useState({});
  const [sort, setSort] = useState("recent");

  const list = [...wishlist].sort((a, b) => (sort === "price" ? a.price - b.price : sort === "discount" ? b.discount - a.discount : 0));
  const totalSaving = wishlist.reduce((t, p) => t + (p.mrp - p.price), 0);

  const share = async () => {
    const text = `My D2C Mall wishlist:\n${wishlist.map((p) => `• ${p.brand} ${p.name} — ${formatINR(p.price)}`).join("\n")}`;
    try {
      if (navigator.share) await navigator.share({ title: "My wishlist", text });
      else {
        await navigator.clipboard.writeText(text);
        toast("Wishlist copied — share it with friends");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />
        <div className="wl-head">
          <div>
            <h1 className="row gap-6">
              <Heart size={24} className="text-red" fill="currentColor" /> My wishlist
            </h1>
            <p className="small muted">
              {wishlist.length} item{wishlist.length === 1 ? "" : "s"}
              {totalSaving ? ` · you'd save ${formatINR(totalSaving)} buying today` : ""}
            </p>
          </div>
          {wishlist.length ? (
            <div className="row gap-6">
              <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">Recently added</option>
                <option value="price">Price: low to high</option>
                <option value="discount">Biggest discount</option>
              </select>
              <button className="btn btn-outline btn-sm" onClick={share}>
                <Share2 size={15} /> Share
              </button>
            </div>
          ) : null}
        </div>

        {wishlist.length ? (
          <div className="wl-grid">
            {list.map((p) => {
              const stock = stockOf(p.id, inventory).sellable;
              return (
                <div key={p.id} className="wl-card">
                  <Link to={`/product/${p.id}`} className="wl-media">
                    <Img src={p.images[0]} alt={p.name} label={p.brand} />
                    {p.discount >= 40 ? (
                      <span className="badge badge-green wl-drop">
                        <TrendingDown size={11} /> Price drop
                      </span>
                    ) : null}
                  </Link>
                  <button className="wl-remove" onClick={() => removeFromWishlist(p.id)} aria-label="Remove">
                    <Trash2 size={15} />
                  </button>
                  <div className="wl-body">
                    <b className="small">{p.brand}</b>
                    <span className="xs muted ellipsis">{p.name}</span>
                    <Price price={p.price} mrp={p.mrp} />
                    {stock <= 0 ? (
                      <span className="xs text-red bold row gap-4">
                        <Bell size={12} /> Out of stock — we'll notify you
                      </span>
                    ) : stock <= 5 ? (
                      <span className="xs text-orange bold">Only {stock} left!</span>
                    ) : null}
                    {p.sizes.length && stock > 0 ? (
                      <div className="wl-sizes">
                        {p.sizes.map((s) => (
                          <button key={s} className={cx(sizes[p.id] === s && "active")} disabled={p.soldOutSizes?.includes(s)} onClick={() => setSizes({ ...sizes, [p.id]: s })}>
                            {s.replace("UK ", "")}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button className="wl-move" disabled={stock <= 0} onClick={() => moveWishlistToCart(p, { size: sizes[p.id] || null })}>
                    <ShoppingBag size={15} /> Move to bag
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon={<Heart size={34} />} title="Your wishlist is empty" text="Tap the ♥ on any product to save it here. We'll let you know when prices drop." action={<Link to="/trending" className="btn">Explore trending</Link>} />
        )}

        <section className="section">
          <SectionHead title="You may also like" eyebrow="Inspired by your wishlist" />
          <Rail>
            {getTrendingProducts().map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>
      </div>
    </div>
  );
}
