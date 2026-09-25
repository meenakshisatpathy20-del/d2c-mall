import { useMemo, useState } from "react";
import {
  ArrowRight,
  Flame,
  Heart,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  getBestSellingProducts,
  getProductById,
  getTrendingProducts,
  sortProducts,
} from "../../data/catalog";
import "./TrendingPage.css";

const trendFilters = [
  "All",
  "Fashion",
  "Beauty",
  "Footwear",
  "Jewellery",
  "Home",
  "Electronics",
];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getDiscount = (product) =>
  product.discount ||
  Math.round(((product.mrp - product.price) / product.mrp) * 100);

function TrendingCard({ product, rank, onOpen, onAdd }) {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  return (
    <article className="trending-product-card">
      <div className="trending-rank">
        <span>#{rank}</span>
        <TrendingUp size={13} />
      </div>

      <button
        className={`trending-wishlist ${isWishlisted ? "active" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
      >
        <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <button
        className="trending-product-image"
        onClick={() => onOpen(product.id)}
      >
        <img src={product.image} alt={product.name} />

        <span className="trending-live-badge">
          <Flame size={11} />
          TRENDING
        </span>

        {getDiscount(product) > 0 && (
          <small>{getDiscount(product)}% OFF</small>
        )}
      </button>

      <div className="trending-product-info">
        <span className="trending-brand">{product.brand}</span>

        <button
          className="trending-product-name"
          onClick={() => onOpen(product.id)}
        >
          {product.name}
        </button>

        <div className="trending-rating">
          <span>★ {product.rating}</span>
          <small>({product.reviewCount || 0})</small>
        </div>

        <div className="trending-price">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.mrp)}</del>
        </div>

        <div className="trending-card-footer">
          <span>
            {product.stock <= 10
              ? `Only ${product.stock} left`
              : "Popular right now"}
          </span>

          <button
            onClick={() => onAdd(product)}
            disabled={product.stock <= 0}
            aria-label="Add to cart"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function TrendingPage() {
  const navigate = useNavigate();
  const { addToCart } = useShop();

  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("trending");

  const products = useMemo(() => {
    let source = getTrendingProducts();

    if (!source.length) {
      source = [
        getProductById("d2c-women-001"),
        getProductById("d2c-men-001"),
        getProductById("d2c-beauty-001"),
        getProductById("d2c-footwear-001"),
        getProductById("d2c-jewellery-001"),
        getProductById("d2c-home-001"),
        getProductById("d2c-electronics-001"),
      ].filter(Boolean);
    }

    const categoryMap = {
      Fashion: ["women", "men"],
      Beauty: ["beauty"],
      Footwear: ["footwear"],
      Jewellery: ["jewellery"],
      Home: ["home-living"],
      Electronics: ["electronics"],
    };

    if (activeFilter !== "All") {
      source = source.filter((product) =>
        categoryMap[activeFilter]?.includes(product.category)
      );
    }

    if (sortBy === "rating") {
      return sortProducts(source, "rating");
    }

    if (sortBy === "price-low") {
      return sortProducts(source, "price-low");
    }

    if (sortBy === "price-high") {
      return sortProducts(source, "price-high");
    }

    return source;
  }, [activeFilter, sortBy]);

  const bestSelling = useMemo(() => {
    return getBestSellingProducts().filter(
      (product) => !products.some((item) => item.id === product.id)
    );
  }, [products]);

  return (
    <main className="trending-page">
      <section className="trending-hero">
        <div className="trending-hero-copy">
          <span className="trending-eyebrow">
            <Flame size={14} />
            D2C PULSE
          </span>

          <h1>
            See what's
            <br />
            <strong>moving.</strong>
          </h1>

          <p>
            The products people are discovering, saving, sharing and buying
            right now.
          </p>

          <div className="trending-hero-stats">
            <div>
              <strong>24K+</strong>
              <span>views today</span>
            </div>

            <div>
              <strong>8.9K</strong>
              <span>people shopping</span>
            </div>

            <div>
              <strong>92%</strong>
              <span>positive ratings</span>
            </div>
          </div>
        </div>

        <div className="trending-hero-visual">
          <div className="trend-orbit orbit-one" />
          <div className="trend-orbit orbit-two" />
          <div className="trend-core">
            <Flame size={34} />
            <strong>HOT</strong>
            <span>RIGHT NOW</span>
          </div>

          <div className="trend-floating-label trend-label-one">
            <Sparkles size={13} />
            <span>New drop</span>
          </div>

          <div className="trend-floating-label trend-label-two">
            <TrendingUp size={13} />
            <span>Fast rising</span>
          </div>
        </div>
      </section>

      <section className="trending-intro">
        <div>
          <span>LIVE SHOPPING SIGNALS</span>
          <h2>Trending right now</h2>
        </div>

        <button onClick={() => navigate("/social")}>
          Explore D2C Street
          <ArrowRight size={15} />
        </button>
      </section>

      <section className="trending-controls">
        <div className="trending-filters">
          {trendFilters.map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="trending">Trending</option>
          <option value="rating">Top Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </section>

      {products.length > 0 ? (
        <section className="trending-product-grid">
          {products.map((product, index) => (
            <TrendingCard
              key={product.id}
              product={product}
              rank={index + 1}
              onOpen={(id) => navigate(`/product/${id}`)}
              onAdd={addToCart}
            />
          ))}
        </section>
      ) : (
        <section className="trending-empty">
          <Flame size={30} />
          <h3>Nothing trending in this category yet</h3>
          <p>Try another category to explore popular products.</p>
          <button onClick={() => setActiveFilter("All")}>
            View all trends
          </button>
        </section>
      )}

      {bestSelling.length > 0 && (
        <section className="best-selling-strip">
          <div className="best-selling-heading">
            <div>
              <span>PROVEN PICKS</span>
              <h2>Best sellers</h2>
            </div>

            <button onClick={() => navigate("/shop")}>
              Shop all
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="best-selling-list">
            {bestSelling.slice(0, 4).map((product) => (
              <button
                key={product.id}
                className="best-selling-item"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img src={product.image} alt={product.name} />

                <span>
                  <small>{product.brand}</small>
                  <strong>{product.name}</strong>
                  <em>{formatPrice(product.price)}</em>
                </span>

                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="trending-social-banner">
        <div>
          <span>FROM THE COMMUNITY</span>
          <h2>Trendsetter or trend watcher?</h2>
          <p>
            See real people styling products, share your own looks and shop
            directly from the D2C community.
          </p>
        </div>

        <button onClick={() => navigate("/social")}>
          Enter D2C Street
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

export default TrendingPage;