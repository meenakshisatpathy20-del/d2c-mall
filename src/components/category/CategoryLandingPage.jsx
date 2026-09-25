import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Filter,
  Heart,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import {
  categories,
  getProductsByCategory,
  sortProducts,
} from "../../data/catalog";
import "./CategoryLandingPage.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getDiscount = (product) =>
  product.discount ||
  Math.round(((product.mrp - product.price) / product.mrp) * 100);

const categoryMeta = {
  women: {
    title: "Women",
    subtitle: "Fresh fashion, everyday essentials and statement pieces.",
    accent: "orange",
  },
  men: {
    title: "Men",
    subtitle: "Everyday fits, streetwear, accessories and more.",
    accent: "blue",
  },
  beauty: {
    title: "Beauty",
    subtitle: "Skincare, beauty essentials and products worth discovering.",
    accent: "pink",
  },
  lifestyle: {
    title: "Lifestyle",
    subtitle: "Products that make everyday living a little better.",
    accent: "green",
  },
  "home-living": {
    title: "Home & Living",
    subtitle: "Small upgrades, useful finds and pieces for your space.",
    accent: "navy",
  },
  electronics: {
    title: "Electronics",
    subtitle: "Everyday tech, audio, accessories and smart essentials.",
    accent: "blue",
  },
  jewellery: {
    title: "Jewellery",
    subtitle: "Minimal, modern and occasion-ready pieces.",
    accent: "gold",
  },
  footwear: {
    title: "Footwear",
    subtitle: "Sneakers, everyday pairs and styles that move with you.",
    accent: "orange",
  },
};

function CategoryProductCard({ product, onOpen, onAdd }) {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  return (
    <article className="category-product-card">
      <button
        className={`category-product-wishlist ${
          isWishlisted ? "active" : ""
        }`}
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
      >
        <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <button
        className="category-product-image"
        onClick={() => onOpen(product.id)}
      >
        <img src={product.image} alt={product.name} />

        {product.tags?.includes("new") && (
          <span className="category-new-badge">NEW</span>
        )}

        {getDiscount(product) > 0 && (
          <small>{getDiscount(product)}% OFF</small>
        )}
      </button>

      <div className="category-product-info">
        <span className="category-product-brand">{product.brand}</span>

        <button
          className="category-product-name"
          onClick={() => onOpen(product.id)}
        >
          {product.name}
        </button>

        <div className="category-product-rating">
          <span>
            <Star size={11} fill="currentColor" />
            {product.rating}
          </span>
          <small>({product.reviewCount || 0})</small>
        </div>

        <div className="category-product-price">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.mrp)}</del>
        </div>

        <div className="category-product-actions">
          <span>
            {product.stock <= 10
              ? `Only ${product.stock} left`
              : "Available now"}
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

function CategoryLandingPage() {
  const navigate = useNavigate();
  const { category } = useParams();
  const { addToCart } = useShop();

  const [sortBy, setSortBy] = useState("relevance");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    brands: [],
    maxPrice: 5000,
    minRating: 0,
    discount: 0,
    availability: "all",
  });

  const categoryData = categoryMeta[category] || {
    title:
      categories.find((item) => item.slug === category)?.name || "Category",
    subtitle: "Explore products from across D2C Mall.",
    accent: "blue",
  };

  const categoryProducts = useMemo(
    () => getProductsByCategory(category),
    [category]
  );

  const availableBrands = useMemo(
    () =>
      [...new Set(categoryProducts.map((product) => product.brand).filter(Boolean))],
    [categoryProducts]
  );

  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter((product) => {
      const brandMatch =
        filters.brands.length === 0 ||
        filters.brands.includes(product.brand);

      const priceMatch = product.price <= filters.maxPrice;

      const ratingMatch = Number(product.rating || 0) >= filters.minRating;

      const discountMatch = getDiscount(product) >= filters.discount;

      const availabilityMatch =
        filters.availability === "all"
          ? true
          : filters.availability === "in-stock"
            ? product.stock > 0
            : product.stock > 0 && product.stock <= 10;

      return (
        brandMatch &&
        priceMatch &&
        ratingMatch &&
        discountMatch &&
        availabilityMatch
      );
    });

    return sortProducts(result, sortBy);
  }, [categoryProducts, filters, sortBy]);

  const toggleBrand = (brand) => {
    setFilters((current) => ({
      ...current,
      brands: current.brands.includes(brand)
        ? current.brands.filter((item) => item !== brand)
        : [...current.brands, brand],
    }));
  };

  const clearFilters = () => {
    setFilters({
      brands: [],
      maxPrice: 5000,
      minRating: 0,
      discount: 0,
      availability: "all",
    });
  };

  const filterContent = (
    <div className="category-filter-content">
      <div className="category-filter-header">
        <div>
          <span>FILTERS</span>
          <h3>Refine products</h3>
        </div>

        <button onClick={clearFilters}>Clear all</button>
      </div>

      <div className="category-filter-section">
        <div className="category-filter-title">
          <strong>Brand</strong>
          <ChevronDown size={15} />
        </div>

        <div className="category-brand-options">
          {availableBrands.map((brand) => (
            <label key={brand}>
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="category-filter-section">
        <div className="category-filter-title">
          <strong>Price</strong>
          <span>₹0 - ₹{filters.maxPrice}</span>
        </div>

        <input
          className="category-price-range"
          type="range"
          min="0"
          max="5000"
          step="100"
          value={filters.maxPrice}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              maxPrice: Number(event.target.value),
            }))
          }
        />
      </div>

      <div className="category-filter-section">
        <div className="category-filter-title">
          <strong>Rating</strong>
        </div>

        {[4.5, 4, 3.5].map((rating) => (
          <label className="category-radio-option" key={rating}>
            <input
              type="radio"
              name="category-rating"
              checked={filters.minRating === rating}
              onChange={() =>
                setFilters((current) => ({
                  ...current,
                  minRating: rating,
                }))
              }
            />
            <span>{rating}+ ★</span>
          </label>
        ))}
      </div>

      <div className="category-filter-section">
        <div className="category-filter-title">
          <strong>Discount</strong>
        </div>

        {[10, 30, 50].map((discount) => (
          <label className="category-radio-option" key={discount}>
            <input
              type="radio"
              name="category-discount"
              checked={filters.discount === discount}
              onChange={() =>
                setFilters((current) => ({
                  ...current,
                  discount,
                }))
              }
            />
            <span>{discount}% and above</span>
          </label>
        ))}
      </div>

      <div className="category-filter-section">
        <div className="category-filter-title">
          <strong>Availability</strong>
        </div>

        <label className="category-radio-option">
          <input
            type="radio"
            name="availability"
            checked={filters.availability === "all"}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                availability: "all",
              }))
            }
          />
          <span>All products</span>
        </label>

        <label className="category-radio-option">
          <input
            type="radio"
            name="availability"
            checked={filters.availability === "in-stock"}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                availability: "in-stock",
              }))
            }
          />
          <span>In stock</span>
        </label>

        <label className="category-radio-option">
          <input
            type="radio"
            name="availability"
            checked={filters.availability === "low-stock"}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                availability: "low-stock",
              }))
            }
          />
          <span>Low stock</span>
        </label>
      </div>

      <button
        className="category-mobile-apply"
        onClick={() => setMobileFiltersOpen(false)}
      >
        Apply filters
      </button>
    </div>
  );

  return (
    <main className={`category-page category-${categoryData.accent}`}>
      <section className="category-hero">
        <div className="category-breadcrumb">
          <button onClick={() => navigate("/")}>Home</button>
          <span>/</span>
          <strong>{categoryData.title}</strong>
        </div>

        <div className="category-hero-content">
          <div>
            <span>SHOP THE CATEGORY</span>
            <h1>{categoryData.title}</h1>
            <p>{categoryData.subtitle}</p>

            <div className="category-hero-stats">
              <div>
                <strong>{categoryProducts.length}+</strong>
                <span>products</span>
              </div>

              <div>
                <strong>Fast</strong>
                <span>delivery options</span>
              </div>

              <div>
                <strong>Easy</strong>
                <span>returns</span>
              </div>
            </div>
          </div>

          <div className="category-hero-art">
            <div className="category-art-block art-main">
              <span>EDIT</span>
              <strong>01</strong>
            </div>
            <div className="category-art-block art-secondary">
              <span>NEW</span>
              <strong>02</strong>
            </div>
            <div className="category-art-block art-tertiary">
              <span>DROP</span>
              <strong>03</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="category-main">
        <div className="category-toolbar">
          <div>
            <span>{filteredProducts.length} products</span>
            <h2>Explore {categoryData.title}</h2>
          </div>

          <div className="category-toolbar-actions">
            <button
              className="category-mobile-filter-button"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter size={15} />
              Filters
            </button>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>

        <div className="category-content">
          <aside className="category-sidebar">{filterContent}</aside>

          <section className="category-results">
            {filteredProducts.length > 0 ? (
              <div className="category-product-grid">
                {filteredProducts.map((product) => (
                  <CategoryProductCard
                    key={product.id}
                    product={product}
                    onOpen={(id) => navigate(`/product/${id}`)}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="category-empty">
                <Filter size={30} />
                <h3>No products match your filters</h3>
                <p>Try removing a filter to see more products.</p>
                <button onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="category-discovery-banner">
        <div>
          <span>KEEP DISCOVERING</span>
          <h2>Not sure what to pick?</h2>
          <p>
            Explore trending products, new arrivals and community looks across
            D2C Mall.
          </p>
        </div>

        <button onClick={() => navigate("/trending")}>
          See what's trending
          <ArrowRight size={16} />
        </button>
      </section>

      {mobileFiltersOpen && (
        <div className="category-filter-overlay">
          <div className="category-mobile-filter">
            <div className="category-mobile-filter-top">
              <strong>Filters</strong>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {filterContent}
          </div>
        </div>
      )}
    </main>
  );
}

export default CategoryLandingPage;