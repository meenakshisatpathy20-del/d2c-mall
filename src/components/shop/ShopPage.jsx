import { motion } from "framer-motion";
import {
  ChevronDown,
  Filter,
  Grid2X2,
  Heart,
  List,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterProducts,
  products as catalogProducts,
  sortProducts,
} from "../../data/catalog";
import { useShop } from "../../context/ShopContext";
import "./ShopPage.css";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Discount" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "beauty", label: "Beauty" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "home-living", label: "Home & Living" },
  { value: "electronics", label: "Electronics" },
  { value: "jewellery", label: "Jewellery" },
  { value: "footwear", label: "Footwear" },
];

const PRICE_OPTIONS = [
  { value: "0-499", label: "Under ₹500", min: 0, max: 499 },
  { value: "500-999", label: "₹500 – ₹999", min: 500, max: 999 },
  {
    value: "1000-1999",
    label: "₹1,000 – ₹1,999",
    min: 1000,
    max: 1999,
  },
  {
    value: "2000-4999",
    label: "₹2,000 – ₹4,999",
    min: 2000,
    max: 4999,
  },
  {
    value: "5000+",
    label: "₹5,000+",
    min: 5000,
    max: Infinity,
  },
];

const RATING_OPTIONS = [
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
  { value: 2, label: "2★ & above" },
];

const DISCOUNT_OPTIONS = [
  { value: 10, label: "10% & above" },
  { value: 20, label: "20% & above" },
  { value: 30, label: "30% & above" },
  { value: 40, label: "40% & above" },
  { value: 50, label: "50% & above" },
];

function ProductCard({
  product,
  onProductClick,
}) {
  const {
    toggleWishlist,
    isWishlisted,
    addToCart,
  } = useShop();

  const image =
    product.images?.[0] ||
    product.image ||
    "";

  const discount =
    product.discount ??
    (product.mrp > product.price
      ? Math.round(
          ((product.mrp - product.price) /
            product.mrp) *
            100
        )
      : 0);

  const reviewCount =
    product.reviewCount ??
    product.reviews ??
    0;

  const stock =
    product.stock ??
    product.availableStock ??
    0;

  const outOfStock = stock <= 0;
  const wishlisted = isWishlisted?.(product);

  const handleAddToCart = (event) => {
    event.stopPropagation();

    if (!outOfStock) {
      addToCart(product, 1);
    }
  };

  const handleWishlist = (event) => {
    event.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <motion.article
      className="shop-product-card"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="shop-product-image-wrap"
        onClick={() => onProductClick?.(product)}
      >
        <img
          src={image}
          alt={product.name}
          className="shop-product-image"
        />

        <div className="shop-product-badges">
          {discount > 0 && (
            <span className="shop-discount-badge">
              {discount}% OFF
            </span>
          )}

          {product.tags?.includes("new") && (
            <span className="shop-new-badge">
              NEW
            </span>
          )}
        </div>

        <button
          type="button"
          className={`shop-wishlist-button ${
            wishlisted ? "active" : ""
          }`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <Heart
            size={18}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>

        {outOfStock && (
          <div className="shop-out-stock">
            Currently unavailable
          </div>
        )}

        {!outOfStock && stock <= 8 && (
          <div className="shop-low-stock">
            Only {stock} left
          </div>
        )}
      </div>

      <div className="shop-product-info">
        <span className="shop-product-brand">
          {product.brand}
        </span>

        <h3
          onClick={() => onProductClick?.(product)}
        >
          {product.name}
        </h3>

        {product.rating != null && (
          <div className="shop-product-rating">
            <span>
              <Star size={12} fill="currentColor" />
              {product.rating}
            </span>

            <small>
              {Number(reviewCount).toLocaleString(
                "en-IN"
              )}{" "}
              ratings
            </small>
          </div>
        )}

        <div className="shop-product-price">
          <strong>
            ₹
            {Number(
              product.price || 0
            ).toLocaleString("en-IN")}
          </strong>

          {product.mrp > product.price && (
            <del>
              ₹
              {Number(
                product.mrp
              ).toLocaleString("en-IN")}
            </del>
          )}

          {discount > 0 && (
            <span>{discount}% off</span>
          )}
        </div>

        <button
          type="button"
          className="shop-add-button"
          disabled={outOfStock}
          onClick={handleAddToCart}
        >
          {outOfStock
            ? "Currently unavailable"
            : "Add to Cart"}
        </button>
      </div>
    </motion.article>
  );
}

function FilterSection({
  title,
  children,
  open,
  onToggle,
}) {
  return (
    <div className="shop-filter-section">
      <button
        type="button"
        className="shop-filter-section-title"
        onClick={onToggle}
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          className={open ? "rotated" : ""}
        />
      </button>

      {open && (
        <div className="shop-filter-section-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ShopPage({
  products = catalogProducts,
  initialCategory = "",
  searchQuery = "",
  onProductClick,
}) {
  const { wishlist } = useShop();

  const [category, setCategory] =
    useState(initialCategory);

  const [search, setSearch] =
    useState(searchQuery);

  const [selectedBrands, setSelectedBrands] =
    useState([]);

  const [priceRange, setPriceRange] =
    useState(null);

  const [rating, setRating] =
    useState(null);

  const [discount, setDiscount] =
    useState(null);

  const [availability, setAvailability] =
    useState(false);

  const [sort, setSort] =
    useState("relevance");

  const [viewMode, setViewMode] =
    useState("grid");

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [openSections, setOpenSections] =
    useState({
      category: true,
      brand: true,
      price: true,
      rating: true,
      discount: true,
      availability: true,
    });

  const brands = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.brand)
          .filter(Boolean)
      ),
    ].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const normalizedSearch =
      search.trim().toLowerCase();

    if (normalizedSearch) {
      result = result.filter((product) => {
        const searchable = [
          product.name,
          product.brand,
          product.category,
          product.subCategory,
          product.sku,
          ...(product.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          normalizedSearch
        );
      });
    }

    if (category) {
      result = result.filter(
        (product) =>
          String(product.category)
            .toLowerCase() ===
          String(category).toLowerCase()
      );
    }

    if (selectedBrands.length > 0) {
      result = result.filter((product) =>
        selectedBrands.includes(product.brand)
      );
    }

    if (priceRange) {
      const option = PRICE_OPTIONS.find(
        (item) => item.value === priceRange
      );

      if (option) {
        result = result.filter(
          (product) =>
            product.price >= option.min &&
            product.price <= option.max
        );
      }
    }

    if (rating) {
      result = result.filter(
        (product) =>
          Number(product.rating || 0) >= rating
      );
    }

    if (discount) {
      result = result.filter((product) => {
        const productDiscount =
          product.discount ??
          (product.mrp > product.price
            ? Math.round(
                ((product.mrp -
                  product.price) /
                  product.mrp) *
                  100
              )
            : 0);

        return productDiscount >= discount;
      });
    }

    if (availability) {
      result = result.filter((product) => {
        const stock =
          product.stock ??
          product.availableStock ??
          0;

        return stock > 0;
      });
    }

    return sortProducts(result, sort);
  }, [
    products,
    search,
    category,
    selectedBrands,
    priceRange,
    rating,
    discount,
    availability,
    sort,
  ]);

  const activeFilterCount =
    (category ? 1 : 0) +
    selectedBrands.length +
    (priceRange ? 1 : 0) +
    (rating ? 1 : 0) +
    (discount ? 1 : 0) +
    (availability ? 1 : 0);

  const toggleSection = (section) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand]
    );
  };

  const clearFilters = () => {
    setCategory("");
    setSelectedBrands([]);
    setPriceRange(null);
    setRating(null);
    setDiscount(null);
    setAvailability(false);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
  };

  const filterContent = (
    <>
      <FilterSection
        title="Category"
        open={openSections.category}
        onToggle={() =>
          toggleSection("category")
        }
      >
        <div className="shop-filter-options">
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={
                category === option.value
                  ? "selected"
                  : ""
              }
            >
              <input
                type="radio"
                name="category"
                checked={
                  category === option.value
                }
                onChange={() =>
                  handleCategoryChange(
                    option.value
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Brand"
        open={openSections.brand}
        onToggle={() =>
          toggleSection("brand")
        }
      >
        <div className="shop-filter-options">
          {brands.map((brand) => (
            <label
              key={brand}
              className={
                selectedBrands.includes(brand)
                  ? "selected"
                  : ""
              }
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(
                  brand
                )}
                onChange={() =>
                  toggleBrand(brand)
                }
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Price"
        open={openSections.price}
        onToggle={() =>
          toggleSection("price")
        }
      >
        <div className="shop-filter-options">
          {PRICE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={
                priceRange === option.value
                  ? "selected"
                  : ""
              }
            >
              <input
                type="radio"
                name="price"
                checked={
                  priceRange === option.value
                }
                onChange={() =>
                  setPriceRange(option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Customer Rating"
        open={openSections.rating}
        onToggle={() =>
          toggleSection("rating")
        }
      >
        <div className="shop-filter-options">
          {RATING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={
                rating === option.value
                  ? "selected"
                  : ""
              }
            >
              <input
                type="radio"
                name="rating"
                checked={
                  rating === option.value
                }
                onChange={() =>
                  setRating(option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Discount"
        open={openSections.discount}
        onToggle={() =>
          toggleSection("discount")
        }
      >
        <div className="shop-filter-options">
          {DISCOUNT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={
                discount === option.value
                  ? "selected"
                  : ""
              }
            >
              <input
                type="radio"
                name="discount"
                checked={
                  discount === option.value
                }
                onChange={() =>
                  setDiscount(option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Availability"
        open={openSections.availability}
        onToggle={() =>
          toggleSection("availability")
        }
      >
        <div className="shop-filter-options">
          <label
            className={
              availability ? "selected" : ""
            }
          >
            <input
              type="checkbox"
              checked={availability}
              onChange={(event) =>
                setAvailability(
                  event.target.checked
                )
              }
            />
            <span>In stock only</span>
          </label>
        </div>
      </FilterSection>
    </>
  );

  return (
    <main className="shop-page">
      <section className="shop-top">
        <div>
          <div className="shop-breadcrumb">
            Home <span>/</span> Shop
          </div>

          <span className="shop-kicker">
            D2C MALL
          </span>

          <h1>
            Discover products
            <span> you'll love.</span>
          </h1>

          <p>
            Explore fashion, beauty, lifestyle,
            electronics and more from India's
            growing D2C marketplace.
          </p>
        </div>

        <div className="shop-top-stats">
          <div>
            <strong>{products.length}</strong>
            <span>products</span>
          </div>

          <div>
            <strong>{wishlist.length}</strong>
            <span>saved</span>
          </div>
        </div>
      </section>

      <section className="shop-toolbar">
        <div className="shop-search">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search products, brands, categories..."
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="shop-mobile-filter-button"
          onClick={() =>
            setMobileFiltersOpen(true)
          }
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span>{activeFilterCount}</span>
          )}
        </button>

        <div className="shop-toolbar-right">
          <span className="shop-result-count">
            {filteredProducts.length} products
          </span>

          <div className="shop-view-toggle">
            <button
              type="button"
              className={
                viewMode === "grid"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode("grid")
              }
              aria-label="Grid view"
            >
              <Grid2X2 size={16} />
            </button>

            <button
              type="button"
              className={
                viewMode === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode("list")
              }
              aria-label="List view"
            >
              <List size={17} />
            </button>
          </div>

          <label className="shop-sort">
            <span>Sort by</span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown size={15} />
          </label>
        </div>
      </section>

      <div className="shop-layout">
        <aside className="shop-sidebar">
          <div className="shop-sidebar-heading">
            <div>
              <Filter size={16} />
              <h2>Filters</h2>
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear all
              </button>
            )}
          </div>

          {filterContent}
        </aside>

        {mobileFiltersOpen && (
          <div className="shop-mobile-overlay">
            <motion.div
              className="shop-mobile-filter-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
            >
              <header>
                <div>
                  <Filter size={17} />
                  <h2>Filters</h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen(false)
                  }
                >
                  <X size={20} />
                </button>
              </header>

              <div className="shop-mobile-filter-content">
                {filterContent}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear all
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen(false)
                  }
                >
                  View {filteredProducts.length}{" "}
                  products
                </button>
              </footer>
            </motion.div>
          </div>
        )}

        <section className="shop-results">
          {activeFilterCount > 0 && (
            <div className="shop-active-filters">
              <span>Applied:</span>

              {category && (
                <button
                  type="button"
                  onClick={() =>
                    setCategory("")
                  }
                >
                  {
                    CATEGORY_OPTIONS.find(
                      (item) =>
                        item.value === category
                    )?.label
                  }
                  <X size={12} />
                </button>
              )}

              {selectedBrands.map((brand) => (
                <button
                  type="button"
                  key={brand}
                  onClick={() =>
                    toggleBrand(brand)
                  }
                >
                  {brand}
                  <X size={12} />
                </button>
              ))}

              {priceRange && (
                <button
                  type="button"
                  onClick={() =>
                    setPriceRange(null)
                  }
                >
                  {
                    PRICE_OPTIONS.find(
                      (item) =>
                        item.value === priceRange
                    )?.label
                  }
                  <X size={12} />
                </button>
              )}

              {rating && (
                <button
                  type="button"
                  onClick={() =>
                    setRating(null)
                  }
                >
                  {rating}★ & above
                  <X size={12} />
                </button>
              )}

              {discount && (
                <button
                  type="button"
                  onClick={() =>
                    setDiscount(null)
                  }
                >
                  {discount}%+ off
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="shop-no-results">
              <div>
                <Search size={28} />
              </div>

              <span>NOTHING MATCHED</span>

              <h2>
                We couldn't find those products.
              </h2>

              <p>
                Try another search or remove some
                filters to discover more from D2C Mall.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  clearFilters();
                }}
              >
                Show all products
              </button>
            </div>
          ) : (
            <div
              className={`shop-product-grid ${
                viewMode === "list"
                  ? "list-view"
                  : ""
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={onProductClick}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}