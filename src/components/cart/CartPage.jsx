import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bookmark, Heart, Lock, MapPin, RotateCcw, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { useCurrentUser } from "../../lib/services/account";
import { planFulfilment } from "../../lib/delivery";
import { dayLabel, formatINR } from "../../lib/format";
import { getTrendingProducts } from "../../data/catalog";
import ProductCard from "../common/ProductCard";
import { Breadcrumbs, Empty, Img, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import { FreeShippingBar } from "./CartDrawer";
import CouponPanel, { PriceDetails } from "./CouponPanel";
import "./CartPage.css";

export default function CartPage() {
  useDocumentTitle("Shopping bag");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { cart, savedForLater, summary, updateQty, changeVariant, removeFromCart, saveForLater, moveToCart, removeSaved, toggleWishlist, pincode, openPincode, inventory } = useShop();

  const plan = pincode?.pincode && cart.length ? planFulfilment(pincode.pincode, cart.filter((i) => !i.outOfStock).map((i) => ({ productId: i.productId, qty: Math.min(i.qty, i.stock), weightKg: i.weightKg })), inventory) : null;
  const blocked = cart.some((i) => i.outOfStock || i.exceedsStock);

  const toWishlist = (item) => {
    toggleWishlist(item.product);
    removeFromCart(item.key, { undo: false });
  };

  if (!cart.length && !savedForLater.length) {
    return (
      <div className="page">
        <div className="container">
          <Empty
            icon={<ShoppingBag size={34} />}
            title="Your bag is empty"
            text="Add items you love to your bag. Review them anytime and easily move them to your wishlist."
            action={
              <div className="row gap-6">
                <Link to="/shop" className="btn">
                  Start shopping
                </Link>
                <Link to="/wishlist" className="btn btn-outline">
                  <Heart size={16} /> Wishlist
                </Link>
              </div>
            }
          />
          <SectionHead title="Trending right now" eyebrow="Get inspired" />
          <Rail>
            {getTrendingProducts().map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bag" }]} />
        <div className="stepper mb-16">
          <span className="step active">
            <span className="num">1</span> Bag
          </span>
          <span className="bar" />
          <span className="step">
            <span className="num">2</span> Address & delivery
          </span>
          <span className="bar" />
          <span className="step">
            <span className="num">3</span> Payment
          </span>
        </div>

        <div className="cart-grid">
          <div className="col gap-16">
            <div className="card card-pad row between wrap gap-16">
              <div className="row gap-6">
                <MapPin size={18} className="text-blue" />
                {pincode ? (
                  <span className="small">
                    Deliver to <b>{pincode.city} – {pincode.pincode}</b>
                    {plan?.ok ? <span className="text-green bold"> · by {dayLabel(plan.eta)}</span> : null}
                  </span>
                ) : (
                  <span className="small">Check delivery time & services for your pincode</span>
                )}
              </div>
              <button className="btn btn-outline-blue btn-sm" onClick={openPincode}>
                {pincode ? "Change" : "Enter pincode"}
              </button>
            </div>
            {plan && !plan.ok ? <div className="notice error">{plan.reason}</div> : null}
            {plan?.ok && plan.split ? (
              <div className="notice info">
                <Truck size={16} /> Your items ship in {plan.shipments.length} packages from {plan.shipments.map((s) => s.warehouse.short).join(" & ")} for the fastest delivery.
              </div>
            ) : null}

            <FreeShippingBar summary={summary} />

            {cart.length ? (
              <div className="card">
                <div className="card-head">
                  <b>
                    {cart.length} item{cart.length > 1 ? "s" : ""} in your bag
                  </b>
                  <span className="small text-green bold">You save {formatINR(summary.productDiscount)}</span>
                </div>
                {cart.map((item) => {
                  const p = item.product;
                  return (
                    <div key={item.key} className={`bag-item ${item.outOfStock ? "oos" : ""}`}>
                      <Link to={`/product/${p.id}`}>
                        <Img src={item.image} alt={item.name} className="bag-img" label={item.brand} />
                      </Link>
                      <div className="bag-info">
                        <div className="row between gap-16">
                          <div style={{ minWidth: 0 }}>
                            <b>{item.brand}</b>
                            <div className="small muted ellipsis">{item.name}</div>
                            <div className="xs faint">Sold by {item.brand} · SKU {p.sku}</div>
                          </div>
                          <div className="right nowrap">
                            <b>{formatINR(item.price * item.qty)}</b>
                            <div className="xs">
                              <span className="strike faint">{formatINR(item.mrp * item.qty)}</span> <span className="text-orange bold">{p.discount}% OFF</span>
                            </div>
                          </div>
                        </div>
                        <div className="row wrap gap-6 mt-8">
                          {p.sizes.length ? (
                            <label className="bag-select">
                              Size
                              <select value={item.size || ""} onChange={(e) => changeVariant(item.key, { size: e.target.value })}>
                                {p.sizes.map((s) => (
                                  <option key={s} value={s} disabled={p.soldOutSizes?.includes(s)}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          {p.colors.length > 1 ? (
                            <label className="bag-select">
                              Colour
                              <select value={item.color || ""} onChange={(e) => changeVariant(item.key, { color: e.target.value })}>
                                {p.colors.map((c) => (
                                  <option key={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                          <label className="bag-select">
                            Qty
                            <select value={item.qty} onChange={(e) => updateQty(item.key, e.target.value)} disabled={item.outOfStock}>
                              {Array.from({ length: Math.max(1, Math.min(item.stock, 10)) }, (_, i) => i + 1).map((n) => (
                                <option key={n}>{n}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {item.outOfStock ? (
                          <p className="stock-warn">
                            <AlertTriangle size={13} /> Out of stock. Remove it or save for later to continue.
                          </p>
                        ) : item.exceedsStock ? (
                          <p className="stock-warn">Only {item.stock} available — quantity will be adjusted</p>
                        ) : item.stock <= 5 ? (
                          <p className="stock-warn soft">Only {item.stock} left in stock</p>
                        ) : null}
                        <div className="row wrap gap-16 xs muted mt-8">
                          <span className="row gap-4">
                            <RotateCcw size={12} /> {p.returnDays ? `${p.returnDays} days return` : "Non-returnable"}
                          </span>
                          {plan?.ok ? (
                            <span className="row gap-4 text-green">
                              <Truck size={12} /> Delivery by {dayLabel(plan.eta)}
                            </span>
                          ) : null}
                        </div>
                        <div className="bag-actions">
                          <button onClick={() => removeFromCart(item.key)}>
                            <Trash2 size={14} /> Remove
                          </button>
                          <button onClick={() => saveForLater(item.key)}>
                            <Bookmark size={14} /> Save for later
                          </button>
                          <button onClick={() => toWishlist(item)}>
                            <Heart size={14} /> Move to wishlist
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="notice info">Your bag is empty, but you have items saved for later below.</div>
            )}

            {savedForLater.length ? (
              <div className="card">
                <div className="card-head">
                  <b className="row gap-6">
                    <Bookmark size={16} /> Saved for later ({savedForLater.length})
                  </b>
                </div>
                <div className="saved-grid">
                  {savedForLater.map((item) => (
                    <div key={item.key} className="saved-card">
                      <Img src={item.image} alt={item.name} ratio="3/3.4" label={item.brand} />
                      <b className="small">{item.brand}</b>
                      <span className="xs muted ellipsis">{item.name}</span>
                      <b className="small">{formatINR(item.price)}</b>
                      {item.outOfStock ? <span className="xs text-red bold">Out of stock</span> : null}
                      <button className="btn btn-sm btn-outline-orange" disabled={item.outOfStock} onClick={() => moveToCart(item.key)}>
                        Move to bag
                      </button>
                      <button className="link xs" onClick={() => removeSaved(item.key)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="col gap-16 sticky-top">
            <CouponPanel />
            <PriceDetails summary={summary}>
              <button
                className="btn btn-lg btn-block mt-8"
                disabled={!cart.length || blocked}
                onClick={() => navigate(user ? "/checkout" : "/login?next=/checkout")}
              >
                <Lock size={17} /> {user ? "Place order" : "Login to place order"} <ArrowRight size={17} />
              </button>
              {blocked ? <p className="xs text-red center">Remove out-of-stock items to continue</p> : null}
            </PriceDetails>
            <div className="row gap-16 xs muted" style={{ justifyContent: "center" }}>
              <span className="row gap-4">
                <ShieldCheck size={14} /> Safe & secure payments
              </span>
              <span className="row gap-4">
                <RotateCcw size={14} /> Easy returns
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
