/*
 * Compact wishlist panel (used on the account overview). Shows the latest
 * saved items with one-tap move-to-bag.
 */
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { formatINR } from "../../lib/format";
import { Img } from "../common/ui";

export default function WishlistDrawer({ limit = 4 }) {
  const { wishlist, moveWishlistToCart, openQuickView } = useShop();
  if (!wishlist.length)
    return (
      <p className="small muted">
        Nothing saved yet. <Link to="/trending" className="link">Discover trending</Link>
      </p>
    );
  return (
    <div className="col gap-10">
      {wishlist.slice(0, limit).map((p) => (
        <div key={p.id} className="row gap-10">
          <Link to={`/product/${p.id}`}>
            <Img src={p.images[0]} alt="" label="" style={{ width: 48, height: 58, borderRadius: 10 }} />
          </Link>
          <div className="grow" style={{ minWidth: 0 }}>
            <b className="xs ellipsis" style={{ display: "block" }}>{p.name}</b>
            <span className="xs muted">{formatINR(p.price)}</span>
          </div>
          <button className="icon-btn sm" onClick={() => (p.sizes.length ? openQuickView(p.id) : moveWishlistToCart(p))} aria-label="Move to bag">
            <ShoppingBag size={16} />
          </button>
        </div>
      ))}
      <Link to="/wishlist" className="link small">
        <Heart size={14} /> View all {wishlist.length}
      </Link>
    </div>
  );
}
