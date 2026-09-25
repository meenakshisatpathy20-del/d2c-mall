import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Heart,
  ShoppingBag,
  Star,
  Zap,
} from "lucide-react";
import { getFlashDealProducts } from "../../data/catalog";
import "./FlashDeals.css";

const FALLBACK_END_TIME =
  Date.now() + 1000 * 60 * 60 * 4;

function formatTime(ms) {
  if (ms <= 0) {
    return {
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const totalSeconds = Math.floor(ms / 1000);

  return {
    hours: String(
      Math.floor(totalSeconds / 3600)
    ).padStart(2, "0"),
    minutes: String(
      Math.floor((totalSeconds % 3600) / 60)
    ).padStart(2, "0"),
    seconds: String(
      totalSeconds % 60
    ).padStart(2, "0"),
  };
}

export default function FlashDeals({
  products,
  title = "Flash Deals",
  subtitle =
    "Limited-time prices. Grab your favourites before they disappear.",
  endTime,
  onProductClick,
  onAddToCart,
  onWishlist,
  wishlistedIds = [],
  onViewAll,
}) {
  const visibleProducts =
    products?.length > 0
      ? products
      : getFlashDealProducts();

  const campaignEndTime =
    endTime || FALLBACK_END_TIME;

  const [remaining, setRemaining] = useState(() =>
    Math.max(
      0,
      new Date(campaignEndTime).getTime() -
        Date.now()
    )
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(
        Math.max(
          0,
          new Date(campaignEndTime).getTime() -
            Date.now()
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [campaignEndTime]);

  const countdown = useMemo(
    () => formatTime(remaining),
    [remaining]
  );

  return (
    <section className="flash-deals-section">
      <div className="flash-deals-container">
        <div className="flash-deals-header">
          <div className="flash-deals-heading">
            <span className="flash-kicker">
              <Zap size={13} fill="currentColor" />
              LIMITED TIME
            </span>

            <h2>{title}</h2>

            <p>{subtitle}</p>
          </div>

          <div className="flash-countdown">
            <div className="flash-countdown-label">
              <Clock3 size={14} />
              Ends in
            </div>

            <div className="flash-time">
              <strong>{countdown.hours}</strong>
              <span>:</span>
              <strong>{countdown.minutes}</strong>
              <span>:</span>
              <strong>{countdown.seconds}</strong>
            </div>
          </div>

          <button
            type="button"
            className="flash-view-all"
            onClick={onViewAll}
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="flash-product-rail">
          {visibleProducts.map((product, index) => {
            const isWishlisted =
              wishlistedIds.includes(product.id);

            return (
              <motion.article
                className="flash-product-card"
                key={product.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.04,
                }}
              >
                <div
                  className="flash-product-image-wrap"
                  onClick={() =>
                    onProductClick?.(product)
                  }
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    loading="lazy"
                  />

                  <span className="flash-product-badge">
                    {product.tags?.includes("bestseller")
                      ? "Bestseller"
                      : `${product.discount}% OFF`}
                  </span>

                  <button
                    type="button"
                    className={`flash-wishlist ${
                      isWishlisted ? "active" : ""
                    }`}
                    aria-label="Add to wishlist"
                    onClick={(event) => {
                      event.stopPropagation();
                      onWishlist?.(product);
                    }}
                  >
                    <Heart
                      size={17}
                      fill={
                        isWishlisted
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>

                  <div className="flash-quick-view">
                    Quick View
                  </div>
                </div>

                <div className="flash-product-info">
                  <span className="flash-brand">
                    {product.brand}
                  </span>

                  <h3>{product.name}</h3>

                  <div className="flash-rating">
                    <span>
                      <Star
                        size={12}
                        fill="currentColor"
                      />
                      {product.rating}
                    </span>

                    <small>
                      {Number(
                        product.reviewCount || 0
                      ).toLocaleString("en-IN")}{" "}
                      reviews
                    </small>
                  </div>

                  <div className="flash-price-row">
                    <strong>
                      ₹
                      {Number(
                        product.price
                      ).toLocaleString("en-IN")}
                    </strong>

                    <del>
                      ₹
                      {Number(
                        product.mrp
                      ).toLocaleString("en-IN")}
                    </del>

                    <span>
                      {product.discount}% OFF
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flash-add-button"
                    onClick={() =>
                      onAddToCart?.(product)
                    }
                  >
                    <ShoppingBag size={16} />
                    Add to Cart
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}