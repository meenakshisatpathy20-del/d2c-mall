import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, ShoppingBag, Zap } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { productMap } from "../../data/catalog";
import { stockOf } from "../../lib/services/inventory";
import { cx } from "../../lib/format";
import { DeliveryChecker } from "../common/DeliveryChecker";
import { Img, Modal, Price, RatingChip } from "../common/ui";
import "./ProductDetailsPage.css";

export default function ProductQuickView() {
  const { quickViewId, closeQuickView, addToCart, buyNow, toggleWishlist, isWishlisted, inventory } = useShop();
  const product = quickViewId ? productMap[quickViewId] : null;
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setImg(0);
    setSize(null);
    setColor(product?.colors?.[0]?.name || null);
    setError("");
  }, [quickViewId, product]);

  if (!product) return <Modal open={false} onClose={closeQuickView} />;
  const stock = stockOf(product.id, inventory).sellable;

  const add = (now) => {
    if (product.sizes.length && !size) {
      setError("Please select a size");
      return;
    }
    const ok = (now ? buyNow : addToCart)(product, { size, color });
    if (ok) {
      closeQuickView();
      if (now) navigate("/checkout");
    }
  };

  return (
    <Modal open={!!product} onClose={closeQuickView} size="wide" title="Quick view">
      <div className="qv">
        <div className="qv-gallery">
          <Img src={product.images[img]} alt={product.name} className="qv-main" label={product.brand} />
          <div className="qv-thumbs">
            {product.images.map((src, i) => (
              <button key={src} className={cx(i === img && "active")} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`}>
                <Img src={src} alt="" label="" />
              </button>
            ))}
          </div>
        </div>
        <div className="qv-info">
          <Link to={`/brands/${product.brandId}`} className="pdp-brand" onClick={closeQuickView}>
            {product.brand}
          </Link>
          <h2 className="pdp-name">{product.name}</h2>
          <RatingChip rating={product.rating} count={product.ratingCount} />
          <Price price={product.price} mrp={product.mrp} size="lg" />
          <span className="xs text-green bold">inclusive of all taxes</span>

          {product.colors.length ? (
            <div className="mt-8">
              <span className="label">Colour: {color}</span>
              <div className="swatches mt-8">
                {product.colors.map((c) => (
                  <button key={c.name} className={cx("swatch", color === c.name && "active")} style={{ "--sw": c.value }} onClick={() => setColor(c.name)} aria-label={c.name} title={c.name} />
                ))}
              </div>
            </div>
          ) : null}

          {product.sizes.length ? (
            <div className="mt-8">
              <span className="label">Select size</span>
              <div className="sizes mt-8">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={cx("size", size === s && "active")}
                    disabled={product.soldOutSizes?.includes(s)}
                    onClick={() => {
                      setSize(s);
                      setError("");
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {error ? <p className="xs text-red bold mt-8">{error}</p> : null}
            </div>
          ) : null}

          {stock > 0 && stock <= 5 ? <p className="small text-red bold">Hurry, only {stock} left!</p> : null}

          <div className="row gap-6 mt-8 wrap">
            <button className="btn btn-lg grow" disabled={stock <= 0} onClick={() => add(false)}>
              <ShoppingBag size={18} /> {stock <= 0 ? "Out of stock" : "Add to bag"}
            </button>
            <button className="btn btn-lg btn-blue grow" disabled={stock <= 0} onClick={() => add(true)}>
              <Zap size={18} /> Buy now
            </button>
            <button className={cx("btn btn-lg btn-outline", isWishlisted(product.id) && "text-red")} onClick={() => toggleWishlist(product)} aria-label="Wishlist">
              <Heart size={18} fill={isWishlisted(product.id) ? "currentColor" : "none"} />
            </button>
          </div>
          <DeliveryChecker product={product} compact />
          <Link to={`/product/${product.id}`} className="link" onClick={closeQuickView}>
            View full details <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </Modal>
  );
}
