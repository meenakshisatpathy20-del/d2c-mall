import { useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { getNewArrivals, sortProducts } from "../../data/catalog";
import "./NewArrivalsPage.css";

const filters = ["All", "Women", "Men", "Beauty", "Lifestyle", "Home", "Electronics"];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getDiscount = (product) =>
  product.discount ||
  Math.round(((product.mrp - product.price) / product.mrp) * 100);

function NewArrivalCard({ product, onOpen, onAdd }) {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  return (
    <article className="new-arrival-card">
      <button
        className={`new-arrival-wishlist ${isWishlisted ? "active" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
      >
        <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <button
        className="new-arrival-image"
        onClick={() => onOpen(product.id)}
      >
        <img src={product.image} alt={product.name} />
        <span>NEW</span>

        {getDiscount(product) > 0 && (
          <small>{getDiscount(product)}% OFF</small>
        )}
      </button>

      <div className="new-arrival-info">
        <span className="new-arrival-brand">{product.brand}</span>

        <button
          className="new-arrival-name"
          onClick={() => onOpen(product.id)}
        >
          {product.name}
        </button>

        <div className="new-arrival-rating">
          <span>★ {product.rating}</span>
          <small>({product.reviewCount || 0})</small>
        </div>

        <div className="new-arrival-price">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.mrp)}</del>
        </div>

        <button
          className="new-arrival-add"
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

function NewArrivalsPage() {
  const navigate = useNavigate();
  const { addToCart } = useShop();

  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const arrivals = useMemo(() => {
    let products = getNewArrivals();

    if (activeFilter !== "All") {
      const categoryMap = {
        Women: "women",
        Men: "men",
        Beauty: "beauty",
        Lifestyle: "lifestyle",
        Home: "home-living",
        Electronics: "electronics",
      };

      products = products.filter(
        (product) => product.category === categoryMap[activeFilter]
      );
    }

    return sortProducts(products, sortBy);
  }, [activeFilter, sortBy]);

  return (
    <main className="new-arrivals-page">
      <section className="new-arrivals-hero">
        <div className="new-arrivals-hero-content">
          <span className="new-arrivals-eyebrow">
            <Sparkles size={14} />
            JUST DROPPED
          </span>

          <h1>
            Fresh in.
            <br />
            <strong>Made to discover.</strong>
          </h1>

          <p>
            New styles, new brands and new everyday favourites,
            updated for the way you shop now.
          </p>

          <button
            className="new-arrivals-hero-button"
            onClick={() =>
              document
                .getElementById("new-arrival-grid")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore new arrivals
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="new-arrivals-hero-art">
          <div className="new-arrival-art-card art-card-one">
            <span>01</span>
            <strong>NEW</strong>
          </div>

          <div className="new-arrival-art-card art-card-two">
            <span>02</span>
            <strong>DROP</strong>
          </div>

          <div className="new-arrival-art-card art-card-three">
            <span>03</span>
            <strong>EDIT</strong>
          </div>
        </div>
      </section>

      <section className="new-arrivals-intro">
        <div>
          <span>THE LATEST EDIT</span>
          <h2>What’s new at D2C</h2>
        </div>

        <p>
          Browse the latest additions across fashion, beauty, lifestyle,
          electronics and home.
        </p>
      </section>

      <section className="new-arrivals-controls" id="new-arrival-grid">
        <div className="new-arrival-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? "active" : ""}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="new-arrival-sort">
          <SlidersHorizontal size={15} />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>
      </section>

      {arrivals.length > 0 ? (
        <section className="new-arrival-grid">
          {arrivals.map((product) => (
            <NewArrivalCard
              key={product.id}
              product={product}
              onOpen={(id) => navigate(`/product/${id}`)}
              onAdd={addToCart}
            />
          ))}
        </section>
      ) : (
        <section className="new-arrivals-empty">
          <Sparkles size={30} />
          <h3>No new arrivals in this category yet</h3>
          <p>Explore another category or check back for the next drop.</p>
          <button onClick={() => setActiveFilter("All")}>
            View all new arrivals
          </button>
        </section>
      )}

      <section className="new-arrivals-bottom-banner">
        <div>
          <span>KEEP DISCOVERING</span>
          <h2>New today. Trending tomorrow.</h2>
          <p>
            Follow the D2C social hub to discover looks, creators and products
            people are talking about.
          </p>
        </div>

        <button onClick={() => navigate("/social")}>
          Explore D2C Street
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

export default NewArrivalsPage;