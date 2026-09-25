import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Eye,
  ShoppingBag,
  Star,
  Flame,
  Play,
} from "lucide-react";
import { useState } from "react";
import { getTrendingProducts } from "../../data/catalog";
import "./TrendingProducts.css";

export default function TrendingProducts({
  products,
  onProductClick,
  onAddToCart,
  onWishlist,
  onViewAll,
}) {
  const [wishlisted, setWishlisted] = useState([]);

  const trendingProducts =
    products?.length > 0
      ? products
      : getTrendingProducts();

  const toggleWishlist = (product) => {
    setWishlisted((current) =>
      current.includes(product.id)
        ? current.filter((id) => id !== product.id)
        : [...current, product.id]
    );

    onWishlist?.(product);
  };

  const getTrendLabel = (product) => {
    if (product.tags?.includes("bestseller")) {
      return "Bestseller";
    }

    if (product.tags?.includes("new")) {
      return "New & Trending";
    }

    return "Trending Now";
  };

  return (
    <section className="trending-products-section">
      <div className="trending-products-container">
        <div className="trending-heading-row">
          <div className="trending-title-area">
            <span className="trending-kicker">
              <Flame size={14} fill="currentColor" />
              D2C PULSE
            </span>

            <h2>What's Trending</h2>

            <p>
              See what shoppers are discovering, saving and
              buying right now.
            </p>
          </div>

          <button
            type="button"
            className="trending-view-all"
            onClick={onViewAll}
          >
            Explore trends
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="trending-products-grid">
          {trendingProducts.map((product, index) => {
            const isWishlisted = wishlisted.includes(
              product.id
            );

            return (
              <motion.article
                key={product.id}
                className="trending-product-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                }}
              >
                <div
                  className="trending-image-wrapper"
                  onClick={() =>
                    onProductClick?.(product)
                  }
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    loading="lazy"
                  />

                  <div className="trending-top-row">
                    <span className="trend-label">
                      <Flame size={11} />
                      {getTrendLabel(product)}
                    </span>

                    <button
                      type="button"
                      className={`trend-wishlist ${
                        isWishlisted ? "active" : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWishlist(product);
                      }}
                      aria-label="Wishlist product"
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
                  </div>

                  <div className="trending-image-bottom">
                    <span>
                      <Eye size={12} />
                      {(
                        product.reviewCount * 4
                      ).toLocaleString("en-IN")}
                    </span>

                    {product.tags?.includes(
                      "trending"
                    ) && (
                      <span className="reel-indicator">
                        <Play
                          size={10}
                          fill="currentColor"
                        />
                        Style
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="trending-quick-view"
                    onClick={(event) => {
                      event.stopPropagation();
                      onProductClick?.(product);
                    }}
                  >
                    Quick View
                  </button>
                </div>

                <div className="trending-product-details">
                  <div className="trending-brand-line">
                    <span>{product.brand}</span>

                    <span className="trending-category">
                      {product.category}
                    </span>
                  </div>

                  <h3>{product.name}</h3>

                  <div className="trending-rating-row">
                    <span className="trending-rating">
                      <Star
                        size={11}
                        fill="currentColor"
                      />
                      {product.rating}
                    </span>

                    <span className="trending-review-count">
                      {Number(
                        product.reviewCount
                      ).toLocaleString("en-IN")}{" "}
                      ratings
                    </span>
                  </div>

                  <div className="trending-price-row">
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
                      {product.discount}% off
                    </span>
                  </div>

                  <button
                    type="button"
                    className="trending-cart-button"
                    onClick={() =>
                      onAddToCart?.(product)
                    }
                  >
                    <ShoppingBag size={15} />
                    Add to Cart
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="trend-discovery-strip">
          <div className="trend-discovery-icon">
            <Flame size={20} />
          </div>

          <div>
            <strong>
              Discover what people are loving
            </strong>

            <span>
              Trending products will be calculated from
              views, saves, carts, purchases and social
              engagement.
            </span>
          </div>

          <button
            type="button"
            onClick={onViewAll}
          >
            See all trends
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}