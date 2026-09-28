import { memo, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Flame, Heart, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { stockOf } from "../../lib/services/inventory";
import { planFulfilment } from "../../lib/delivery";
import { cx, dayLabel } from "../../lib/format";
import { Img, Price } from "./ui";

function ProductCardBase({ product, variant, showDelivery = true, rank }) {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist, addToCart, openQuickView, inventory, pincode } = useShop();
  const [size, setSize] = useState(null);
  const stock = stockOf(product.id, inventory).sellable;
  const wished = isWishlisted(product.id);
  const oos = stock <= 0;

  const eta = useMemo(() => {
    if (!showDelivery || !pincode?.pincode || oos) return null;
    const plan = planFulfilment(pincode.pincode, [{ productId: product.id, qty: 1, weightKg: product.weightKg }], inventory);
    return plan.ok ? plan.eta : null;
  }, [showDelivery, pincode, product, inventory, oos]);

  const isNew = product.tags.includes("new");
  const isBest = product.tags.includes("bestseller");

  const onAdd = (e) => {
    e.preventDefault();
    if (product.sizes.length && !size) {
      openQuickView(product.id);
      return;
    }
    addToCart(product, { size });
  };

  return (
    <article className={cx("pcard", variant)}>
      <Link to={`/product/${product.id}`} className="pcard-media" aria-label={`${product.brand} ${product.name}`}>
        <Img src={product.images[0]} alt={product.name} label={product.brand} />
        {product.images[1] ? <Img className="alt-img" src={product.images[1]} alt="" label={product.brand} /> : null}

        <div className="pcard-badges">
          {rank ? <span className="badge badge-navy">#{rank}</span> : null}
          {product.discount >= 40 ? <span className="badge badge-orange">{product.discount}% off</span> : null}
          {isNew ? <span className="badge badge-blue">New</span> : null}
          {!isNew && isBest ? <span className="badge badge-soft-green">Bestseller</span> : null}
        </div>

        <span className="pcard-rating">
          {product.rating.toFixed(1)} <Star size={11} fill="currentColor" strokeWidth={0} />
          <span className="sep" />
          <span className="cnt">{new Intl.NumberFormat("en-IN", { notation: "compact" }).format(product.ratingCount)}</span>
        </span>

        {oos ? (
          <div className="pcard-oos">
            <span>Out of stock</span>
          </div>
        ) : null}

        {!oos && variant !== "list" ? (
          <div className="pcard-hover" onClick={(e) => e.preventDefault()}>
            {product.sizes.length ? (
              <div className="pcard-sizes">
                {product.sizes.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={product.soldOutSizes?.includes(s)}
                    onClick={(e) => {
                      e.preventDefault();
                      setSize(s);
                      addToCart(product, { size: s });
                    }}
                    title={`Add size ${s}`}
                  >
                    {s.replace("UK ", "")}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="pcard-actions">
              {product.sizes.length ? (
                <button type="button" className="btn btn-sm btn-outline" onClick={(e) => { e.preventDefault(); openQuickView(product.id); }}>
                  <Eye size={15} /> Quick view
                </button>
              ) : (
                <button type="button" className="btn btn-sm" onClick={onAdd}>
                  <ShoppingBag size={15} /> Add to bag
                </button>
              )}
              <button type="button" className="btn btn-sm btn-outline" aria-label="Quick view" onClick={(e) => { e.preventDefault(); if (product.sizes.length) navigate(`/product/${product.id}`); else openQuickView(product.id); }}>
                {product.sizes.length ? <Zap size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        ) : null}
      </Link>

      <button
        type="button"
        className={cx("pcard-wish", wished && "on")}
        onClick={() => toggleWishlist(product)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={17} fill={wished ? "currentColor" : "none"} />
      </button>

      <Link to={`/product/${product.id}`} className="pcard-body">
        <span className="pcard-brand">{product.brand}</span>
        <span className="pcard-name">{product.name}</span>
        <Price price={product.price} mrp={product.mrp} />
        <div className="pcard-meta">
          {!oos && stock <= 5 ? (
            <span className="urgent row gap-4">
              <Flame size={12} /> Only {stock} left
            </span>
          ) : eta ? (
            <span className="fast row gap-4">
              <Truck size={12} /> Get it by {dayLabel(eta)}
            </span>
          ) : (
            <span className="row gap-4">
              <Truck size={12} /> Free delivery over ₹499
            </span>
          )}
        </div>
        {variant === "list" ? (
          <>
            <p className="small muted clamp-2 mt-4">{product.description}</p>
            <div className="row gap-6 mt-8">
              <button type="button" className="btn btn-sm" onClick={onAdd}>
                <ShoppingBag size={15} /> Add to bag
              </button>
              <button type="button" className="btn btn-sm btn-outline" onClick={(e) => { e.preventDefault(); openQuickView(product.id); }}>
                Quick view
              </button>
            </div>
          </>
        ) : null}
      </Link>
    </article>
  );
}

export const ProductCard = memo(ProductCardBase);
export default ProductCard;

export function ProductGrid({ products, variant, rankStart }) {
  return (
    <div className={variant === "list" ? "col gap-16" : "product-grid"}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} variant={variant} rank={rankStart ? rankStart + i : undefined} />
      ))}
    </div>
  );
}
