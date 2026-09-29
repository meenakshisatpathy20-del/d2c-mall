import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bookmark, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { formatINR } from "../../lib/format";
import { FREE_SHIPPING_THRESHOLD } from "../../lib/pricing";
import { getTrendingProducts } from "../../data/catalog";
import { Drawer, Empty, Img, QtyStepper } from "../common/ui";
import "./CartDrawer.css";

export function FreeShippingBar({ summary }) {
  const pct = Math.min(100, ((FREE_SHIPPING_THRESHOLD - summary.amountForFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100);
  return (
    <div className="ship-bar">
      <div className="row gap-6 small">
        <Truck size={16} className={summary.freeShipping ? "text-green" : "text-orange"} />
        {summary.freeShipping ? (
          <span>
            <b className="text-green">Yay! Free delivery</b> unlocked on this order
          </span>
        ) : (
          <span>
            Add <b>{formatINR(summary.amountForFreeShipping)}</b> more for <b>FREE delivery</b>
          </span>
        )}
      </div>
      <div className={`progress mt-8 ${summary.freeShipping ? "green" : ""}`}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, summary, updateQty, removeFromCart, saveForLater, cartCount, savedForLater, addToCart } = useShop();
  const navigate = useNavigate();
  const blocked = cart.some((i) => i.outOfStock || i.exceedsStock);
  const suggestions = getTrendingProducts().filter((p) => !cart.some((c) => c.productId === p.id)).slice(0, 4);

  return (
    <Drawer open={cartOpen} onClose={closeCart}>
      <div className="cdrawer">
        <div className="cdrawer-head">
          <div>
            <b>Your bag</b>
            <span className="xs muted"> · {cartCount} item{cartCount === 1 ? "" : "s"}</span>
          </div>
          <button className="icon-btn sm" onClick={closeCart} aria-label="Close bag">
            <X size={18} />
          </button>
        </div>

        {cart.length ? (
          <>
            <div className="cdrawer-body">
              <FreeShippingBar summary={summary} />
              {cart.map((item) => (
                <div key={item.key} className={`citem ${item.outOfStock ? "oos" : ""}`}>
                  <Link to={`/product/${item.productId}`} onClick={closeCart}>
                    <Img src={item.image} alt={item.name} className="citem-img" label={item.brand} />
                  </Link>
                  <div className="citem-info">
                    <div className="row between">
                      <b className="small">{item.brand}</b>
                      <button className="icon-btn sm" onClick={() => removeFromCart(item.key)} aria-label="Remove">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <span className="xs muted ellipsis">{item.name}</span>
                    <span className="xs muted">
                      {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ")}
                    </span>
                    {item.outOfStock ? (
                      <span className="stock-warn">
                        <AlertTriangle size={13} /> Out of stock — remove or save for later
                      </span>
                    ) : item.stock <= 5 ? (
                      <span className="stock-warn soft">Only {item.stock} left</span>
                    ) : null}
                    <div className="row between mt-4">
                      <QtyStepper size="sm" value={item.qty} max={Math.min(item.stock, 10)} onChange={(q) => updateQty(item.key, q)} />
                      <div className="right">
                        <b>{formatINR(item.price * item.qty)}</b>
                        {item.mrp > item.price ? <div className="xs strike faint">{formatINR(item.mrp * item.qty)}</div> : null}
                      </div>
                    </div>
                    <button className="link xs mt-4" onClick={() => saveForLater(item.key)}>
                      <Bookmark size={12} /> Save for later
                    </button>
                  </div>
                </div>
              ))}
              {savedForLater.length ? (
                <Link to="/cart" className="saved-hint" onClick={closeCart}>
                  <Bookmark size={14} /> {savedForLater.length} item(s) saved for later <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>
            <div className="cdrawer-foot">
              {summary.couponCode ? (
                <div className="row between small">
                  <span className="row gap-6 text-green bold">
                    <Tag size={14} /> {summary.couponCode} applied
                  </span>
                  <span className="text-green bold">−{formatINR(summary.couponDiscount)}</span>
                </div>
              ) : null}
              <div className="row between small">
                <span className="muted">You save</span>
                <span className="text-green bold">{formatINR(summary.savings)}</span>
              </div>
              <div className="row between">
                <b>Total</b>
                <b style={{ fontSize: 20 }}>{formatINR(summary.total)}</b>
              </div>
              <div className="grid grid-2">
                <Link to="/cart" className="btn btn-outline" onClick={closeCart}>
                  View bag
                </Link>
                <button
                  className="btn"
                  disabled={blocked}
                  onClick={() => {
                    closeCart();
                    navigate("/checkout");
                  }}
                >
                  Checkout <ArrowRight size={16} />
                </button>
              </div>
              {blocked ? <span className="xs text-red center">Resolve stock issues to continue</span> : null}
            </div>
          </>
        ) : (
          <div className="cdrawer-body">
            <Empty
              icon={<ShoppingBag size={34} />}
              title="Your bag is empty"
              text="Looks like you haven't added anything yet. Explore today's trending picks."
              action={
                <Link to="/shop" className="btn" onClick={closeCart}>
                  Start shopping
                </Link>
              }
            />
            <span className="label">Trending now</span>
            <div className="grid grid-2 mt-8">
              {suggestions.map((p) => (
                <div key={p.id} className="mini-sugg">
                  <Link to={`/product/${p.id}`} onClick={closeCart}>
                    <Img src={p.images[0]} alt={p.name} ratio="1" label={p.brand} />
                  </Link>
                  <b className="xs ellipsis">{p.name}</b>
                  <div className="row between">
                    <span className="small bold">{formatINR(p.price)}</span>
                    {!p.sizes.length ? (
                      <button className="link xs" onClick={() => addToCart(p)}>
                        + Add
                      </button>
                    ) : (
                      <Link className="link xs" to={`/product/${p.id}`} onClick={closeCart}>
                        View
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
