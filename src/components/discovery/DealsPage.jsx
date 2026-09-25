import { useMemo, useState } from "react";
import { ChevronRight, Clock3, Flame, Heart, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  getFlashDealProducts,
  getProductById,
  sortProducts,
} from "../../data/catalog";
import "./DealsPage.css";

const dealCollections = [
  {
    id: "flash",
    title: "Flash Deals",
    subtitle: "Limited-time prices. While stock lasts.",
    icon: Zap,
  },
  {
    id: "trending",
    title: "Trending Deals",
    subtitle: "What shoppers are picking right now.",
    icon: Flame,
  },
  {
    id: "beauty",
    title: "Beauty Steals",
    subtitle: "Glow-up essentials at better prices.",
    icon: Sparkles,
  },
];

const dealFilters = ["All Deals", "Under ₹999", "50%+ Off", "Low Stock"];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getDiscount = (product) =>
  product.discount ||
  Math.round(((product.mrp - product.price) / product.mrp) * 100);

function DealCard({ product, onOpen, onAdd }) {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const discount = getDiscount(product);

  return (
    <article className="deal-product-card">
      <button
        className={`deal-wishlist ${isWishlisted ? "active" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
      >
        <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <button className="deal-product-image" onClick={() => onOpen(product.id)}>
        <img src={product.image} alt={product.name} />
        <span className="deal-discount-badge">{discount}% OFF</span>
        {product.stock <= 10 && (
          <span className="deal-stock-badge">Only {product.stock} left</span>
        )}
      </button>

      <div className="deal-product-info">
        <span className="deal-brand">{product.brand}</span>
        <button className="deal-product-name" onClick={() => onOpen(product.id)}>
          {product.name}
        </button>

        <div className="deal-rating-row">
          <span>★ {product.rating}</span>
          <small>({product.reviewCount || 0})</small>
        </div>

        <div className="deal-price-row">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.mrp)}</del>
        </div>

        <button
          className="deal-add-button"
          onClick={() => onAdd(product)}
          disabled={product.stock <= 0}
        >
          <ShoppingBag size={15} />
          {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

function DealsPage() {
  const navigate = useNavigate();
  const { addToCart } = useShop();

  const [activeFilter, setActiveFilter] = useState("All Deals");

  const deals = useMemo(() => {
    let products = getFlashDealProducts();

    if (!products.length) {
      products = sortProducts(
        [
          getProductById("d2c-women-001"),
          getProductById("d2c-men-001"),
          getProductById("d2c-beauty-001"),
          getProductById("d2c-footwear-001"),
          getProductById("d2c-jewellery-001"),
          getProductById("d2c-home-001"),
        ].filter(Boolean),
        "discount"
      );
    }

    if (activeFilter === "Under ₹999") {
      products = products.filter((product) => product.price <= 999);
    }

    if (activeFilter === "50%+ Off") {
      products = products.filter((product) => getDiscount(product) >= 50);
    }

    if (activeFilter === "Low Stock") {
      products = products.filter((product) => product.stock > 0 && product.stock <= 10);
    }

    return products;
  }, [activeFilter]);

  const beautyDeals = deals.filter(
    (product) =>
      product.category === "beauty" ||
      product.subCategory?.toLowerCase().includes("beauty")
  );

  const trendingDeals = deals.filter(
    (product) => product.tags?.includes("trending") || product.trending
  );

  return (
    <main className="deals-page">
      <section className="deals-hero">
        <div className="deals-hero-copy">
          <span className="deals-eyebrow">
            <Flame size={14} />
            D2C DAILY DEALS
          </span>

          <h1>
            Big picks.
            <br />
            <strong>Better prices.</strong>
          </h1>

          <p>
            Discover limited-time offers across fashion, beauty, electronics,
            home and more.
          </p>

          <div className="deals-hero-actions">
            <button
              className="deals-primary-button"
              onClick={() => document.getElementById("deal-grid")?.scrollIntoView({ behavior: "smooth" })}
            >
              Shop deals
              <ChevronRight size={17} />
            </button>

            <button
              className="deals-secondary-button"
              onClick={() => navigate("/trending")}
            >
              Explore trending
            </button>
          </div>
        </div>

        <div className="deals-hero-visual">
          <div className="deals-price-circle">
            <small>UP TO</small>
            <strong>50%</strong>
            <span>OFF</span>
          </div>

          <div className="deals-floating-card deals-floating-one">
            <Zap size={16} />
            <span>Flash prices</span>
          </div>

          <div className="deals-floating-card deals-floating-two">
            <ShoppingBag size={16} />
            <span>Shop now</span>
          </div>
        </div>
      </section>

      <section className="deals-ticker">
        <div>
          <Clock3 size={15} />
          <strong>LIMITED TIME</strong>
          <span>Deals refresh regularly</span>
        </div>
        <div>
          <Zap size={15} />
          <strong>FAST MOVING</strong>
          <span>Popular picks can sell out quickly</span>
        </div>
        <div>
          <Sparkles size={15} />
          <strong>NEW DROPS</strong>
          <span>Fresh offers across categories</span>
        </div>
      </section>

      <section className="deals-main" id="deal-grid">
        <div className="deals-section-heading">
          <div>
            <span>SHOP THE DROP</span>
            <h2>Today’s deals</h2>
          </div>

          <div className="deals-filter-row">
            {dealFilters.map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? "active" : ""}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {deals.length ? (
          <div className="deal-product-grid">
            {deals.map((product) => (
              <DealCard
                key={product.id}
                product={product}
                onOpen={(id) => navigate(`/product/${id}`)}
                onAdd={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="deals-empty">
            <Sparkles size={28} />
            <h3>No deals match this filter</h3>
            <p>Try another deal collection.</p>
            <button onClick={() => setActiveFilter("All Deals")}>
              View all deals
            </button>
          </div>
        )}
      </section>

      {trendingDeals.length > 0 && (
        <section className="deal-collection-section">
          <div className="deals-section-heading">
            <div>
              <span>WHAT’S MOVING</span>
              <h2>Trending for less</h2>
            </div>
            <button
              className="deals-view-all"
              onClick={() => navigate("/trending")}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          <div className="deal-mini-grid">
            {trendingDeals.slice(0, 4).map((product) => (
              <DealCard
                key={product.id}
                product={product}
                onOpen={(id) => navigate(`/product/${id}`)}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {beautyDeals.length > 0 && (
        <section className="deal-collection-section beauty-deals-section">
          <div className="deals-section-heading">
            <div>
              <span>BEAUTY EDIT</span>
              <h2>Beauty steals</h2>
            </div>
            <button
              className="deals-view-all"
              onClick={() => navigate("/category/beauty")}
            >
              Shop beauty <ChevronRight size={15} />
            </button>
          </div>

          <div className="deal-mini-grid">
            {beautyDeals.slice(0, 4).map((product) => (
              <DealCard
                key={product.id}
                product={product}
                onOpen={(id) => navigate(`/product/${id}`)}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      <section className="deal-collections">
        {dealCollections.map((collection) => {
          const Icon = collection.icon;

          return (
            <button
              key={collection.id}
              className="deal-collection-card"
              onClick={() => {
                if (collection.id === "beauty") {
                  navigate("/category/beauty");
                } else if (collection.id === "trending") {
                  navigate("/trending");
                } else {
                  document.getElementById("deal-grid")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className="deal-collection-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{collection.title}</strong>
                <small>{collection.subtitle}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </section>
    </main>
  );
}

export default DealsPage;