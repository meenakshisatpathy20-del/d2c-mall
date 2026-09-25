import { useMemo, useState } from "react";
import {
  ChevronDown,
  Filter,
  Grid2X2,
  Heart,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { products as catalogProducts } from "../../data/catalog";
import "./SearchResultsPage.css";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Discount" },
];

export default function SearchResultsPage({
  products = catalogProducts,
  initialQuery = "",
  onProductClick,
  onWishlist,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState("relevance");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [view, setView] = useState("grid");

  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    price: "all",
    rating: "all",
    discount: "all",
    availability: "all",
  });

  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category))]
        .filter(Boolean)
        .sort(),
    [products]
  );

  const brands = useMemo(
    () =>
      [...new Set(products.map((product) => product.brand))]
        .filter(Boolean)
        .sort(),
    [products]
  );

  const toggleFilter = (type, value) => {
    setFilters((current) => {
      const selected = current[type];

      return {
        ...current,
        [type]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery) {
      result = result.filter((product) =>
        [
          product.name,
          product.brand,
          product.category,
          product.subCategory,
          product.sku,
          ...(product.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    }

    if (filters.category.length) {
      result = result.filter((product) =>
        filters.category.includes(product.category)
      );
    }

    if (filters.brand.length) {
      result = result.filter((product) =>
        filters.brand.includes(product.brand)
      );
    }

    if (filters.price !== "all") {
      result = result.filter((product) => {
        if (filters.price === "under500") {
          return product.price < 500;
        }

        if (filters.price === "500to1000") {
          return product.price >= 500 && product.price <= 1000;
        }

        if (filters.price === "1000to2000") {
          return product.price > 1000 && product.price <= 2000;
        }

        if (filters.price === "above2000") {
          return product.price > 2000;
        }

        return true;
      });
    }

    if (filters.rating !== "all") {
      const minimumRating = Number(filters.rating);

      result = result.filter(
        (product) => Number(product.rating || 0) >= minimumRating
      );
    }

    if (filters.discount !== "all") {
      const minimumDiscount = Number(filters.discount);

      result = result.filter(
        (product) => Number(product.discount || 0) >= minimumDiscount
      );
    }

    if (filters.availability === "inStock") {
      result = result.filter(
        (product) =>
          Number(product.stock ?? product.availableStock ?? 0) > 0
      );
    }

    if (sort === "priceLow") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (sort === "priceHigh") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    if (sort === "rating") {
      result.sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    }

    if (sort === "discount") {
      result.sort(
        (a, b) =>
          Number(b.discount || 0) - Number(a.discount || 0)
      );
    }

    if (sort === "newest") {
      result.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();

        if (dateA && dateB) {
          return dateB - dateA;
        }

        return String(b.id || "").localeCompare(String(a.id || ""));
      });
    }

    return result;
  }, [products, query, filters, sort]);

  const clearFilters = () => {
    setFilters({
      category: [],
      brand: [],
      price: "all",
      rating: "all",
      discount: "all",
      availability: "all",
    });
  };

  const activeFilterCount =
    filters.category.length +
    filters.brand.length +
    Number(filters.price !== "all") +
    Number(filters.rating !== "all") +
    Number(filters.discount !== "all") +
    Number(filters.availability !== "all");

  return (
    <main className="search-page">
      <section className="search-top">
        <div className="search-breadcrumb">
          Home <span>/</span> Search
        </div>

        <div className="search-heading-row">
          <div>
            <p className="search-eyebrow">D2C DISCOVERY</p>

            <h1>
              {query
                ? `Results for "${query}"`
                : "Explore everything you love"}
            </h1>

            <p className="search-result-count">
              {filteredProducts.length.toLocaleString("en-IN")} products
            </p>
          </div>

          <div className="search-controls">
            <div className="search-box">
              <Search size={16} />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, brands, categories..."
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sort-box">
              <SlidersHorizontal size={15} />

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </section>

      <div className="search-layout">
        <aside className="desktop-filter-panel">
          <FilterPanel
            filters={filters}
            categories={categories}
            brands={brands}
            toggleFilter={toggleFilter}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
          />
        </aside>

        {mobileFilters && (
          <div className="mobile-filter-overlay">
            <div className="mobile-filter-panel">
              <div className="mobile-filter-header">
                <h2>Filters</h2>

                <button
                  type="button"
                  onClick={() => setMobileFilters(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <FilterPanel
                filters={filters}
                categories={categories}
                brands={brands}
                toggleFilter={toggleFilter}
                setFilters={setFilters}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </div>
        )}

        <section className="product-results">
          <div className="results-toolbar">
            <button
              type="button"
              className="mobile-filter-trigger"
              onClick={() => setMobileFilters(true)}
            >
              <Filter size={15} />
              Filters

              {activeFilterCount > 0 && (
                <b>{activeFilterCount}</b>
              )}
            </button>

            <div className="result-toolbar-right">
              <span>
                Showing {filteredProducts.length} products
              </span>

              <div className="view-switcher">
                <button
                  type="button"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <Grid2X2 size={15} />
                </button>

                <button
                  type="button"
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <div>
                <Search size={26} />
              </div>

              <h2>No products found</h2>

              <p>
                Try another search or remove a few filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  clearFilters();
                }}
              >
                Clear search & filters
              </button>
            </div>
          ) : (
            <div
              className={`results-grid ${
                view === "list" ? "list-view" : ""
              }`}
            >
              {filteredProducts.map((product, index) => (
                <ProductResultCard
                  key={product.id}
                  product={product}
                  index={index}
                  onProductClick={onProductClick}
                  onWishlist={onWishlist}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterPanel({
  filters,
  categories,
  brands,
  toggleFilter,
  setFilters,
  clearFilters,
  activeFilterCount,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-heading">
        <div>
          <span>REFINE</span>
          <h2>Filters</h2>
        </div>

        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      <FilterSection title="Category">
        {categories.map((category) => (
          <Checkbox
            key={category}
            label={category}
            checked={filters.category.includes(category)}
            onChange={() =>
              toggleFilter("category", category)
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Brand">
        {brands.map((brand) => (
          <Checkbox
            key={brand}
            label={brand}
            checked={filters.brand.includes(brand)}
            onChange={() => toggleFilter("brand", brand)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Price">
        {[
          ["under500", "Under ₹500"],
          ["500to1000", "₹500 – ₹1,000"],
          ["1000to2000", "₹1,000 – ₹2,000"],
          ["above2000", "Above ₹2,000"],
        ].map(([value, label]) => (
          <Radio
            key={value}
            label={label}
            checked={filters.price === value}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                price: value,
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Customer Rating">
        {[
          ["4", "4★ & above"],
          ["3", "3★ & above"],
        ].map(([value, label]) => (
          <Radio
            key={value}
            label={label}
            checked={filters.rating === value}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                rating: value,
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Discount">
        {[
          ["70", "70% & above"],
          ["50", "50% & above"],
          ["30", "30% & above"],
        ].map(([value, label]) => (
          <Radio
            key={value}
            label={label}
            checked={filters.discount === value}
            onChange={() =>
              setFilters((current) => ({
                ...current,
                discount: value,
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Availability">
        <Checkbox
          label="In Stock"
          checked={filters.availability === "inStock"}
          onChange={() =>
            setFilters((current) => ({
              ...current,
              availability:
                current.availability === "inStock"
                  ? "all"
                  : "inStock",
            }))
          }
        />
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="filter-section">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="filter-option">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span className="custom-check">
        {checked && "✓"}
      </span>

      <span>{label}</span>
    </label>
  );
}

function Radio({ label, checked, onChange }) {
  return (
    <label className="filter-option">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
      />

      <span className="custom-radio">
        {checked && <i />}
      </span>

      <span>{label}</span>
    </label>
  );
}

function ProductResultCard({
  product,
  index,
  onProductClick,
  onWishlist,
}) {
  const image =
    product.images?.[0] ||
    product.image ||
    "";

  const stock = Number(
    product.stock ??
      product.availableStock ??
      0
  );

  const reviewCount =
    product.reviewCount ??
    product.reviews ??
    0;

  const discount =
    product.discount ??
    (product.mrp > product.price
      ? Math.round(
          ((product.mrp - product.price) /
            product.mrp) *
            100
        )
      : 0);

  return (
    <motion.article
      className="result-product-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index * 0.025, 0.2),
      }}
    >
      <div className="result-product-image">
        <button
          type="button"
          className="result-product-image-button"
          onClick={() => onProductClick?.(product)}
        >
          <img
            src={image}
            alt={product.name}
          />

          {product.tags?.[0] && (
            <span className="result-product-tag">
              {product.tags[0]}
            </span>
          )}

          {discount > 0 && (
            <span className="result-discount">
              {discount}% OFF
            </span>
          )}
        </button>

        <button
          type="button"
          className="result-wishlist"
          onClick={(event) => {
            event.stopPropagation();
            onWishlist?.(product);
          }}
          aria-label="Add to wishlist"
        >
          <Heart size={17} />
        </button>
      </div>

      <div className="result-product-info">
        <p>{product.brand}</p>

        <h3>{product.name}</h3>

        <div className="result-rating">
          <span>★ {product.rating || "4.5"}</span>

          <small>
            (
            {Number(reviewCount).toLocaleString(
              "en-IN"
            )}
            )
          </small>
        </div>

        <div className="result-price">
          <strong>
            ₹
            {Number(product.price || 0).toLocaleString(
              "en-IN"
            )}
          </strong>

          {product.mrp > product.price && (
            <del>
              ₹
              {Number(product.mrp).toLocaleString(
                "en-IN"
              )}
            </del>
          )}

          {discount > 0 && (
            <span>{discount}%</span>
          )}
        </div>

        {stock > 0 && stock <= 8 && (
          <div className="result-low-stock">
            Only {stock} left
          </div>
        )}

        {stock <= 0 && (
          <div className="result-low-stock">
            Currently unavailable
          </div>
        )}

        <button
          type="button"
          className="result-view-button"
          onClick={() => onProductClick?.(product)}
        >
          View product
        </button>
      </div>
    </motion.article>
  );
}