import "./MainHeader.css";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  MapPin,
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ChevronDown,
  Mic,
  PackageSearch,
  Store,
  Sparkles,
  Flame,
  Clock3,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const defaultCategories = [
  { label: "Women", path: "/category/women" },
  { label: "Men", path: "/category/men" },
  { label: "Beauty", path: "/category/beauty" },
  { label: "Lifestyle", path: "/category/lifestyle" },
  { label: "Home & Living", path: "/category/home-living" },
  { label: "Electronics", path: "/category/electronics" },
  { label: "Jewellery", path: "/category/jewellery" },
];

const discoveryLinks = [
  {
    label: "Deals",
    path: "/deals",
    icon: Flame,
    accent: "#ff6b00",
  },
  {
    label: "New Arrivals",
    path: "/new-arrivals",
    icon: Sparkles,
    accent: "#08a66a",
  },
  {
    label: "Trending",
    path: "/trending",
    icon: Clock3,
    accent: "#2457ff",
  },
];

function MainHeader({
  cartCount = 0,
  wishlistCount = 0,
  categories = defaultCategories,
  currentPincode = "",
  onLocationClick,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setMobileOpen(false);
    setCategoryOpen(false);
  }, [location.pathname]);

  const submitSearch = (event) => {
    event.preventDefault();

    const value = searchValue.trim();

    if (!value) {
      navigate("/shop");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const openLocation = () => {
    if (onLocationClick) {
      onLocationClick();
      return;
    }

    navigate("/delivery-location");
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="d2c-header">
        <div className="d2c-top-strip">
          <div className="d2c-top-inner">
            <div className="d2c-top-left">
              <span className="d2c-trust">
                <span className="d2c-trust-dot" />
                100% Brand Certified
              </span>

              <span className="d2c-top-separator" />

              <span>Free express delivery on orders over ₹499</span>

              <span className="d2c-top-separator" />

              <span>Pan-India delivery</span>
            </div>

            <button
              type="button"
              className="d2c-warehouse-link"
              onClick={() => navigate("/admin/login")}
            >
              <Store size={15} />
              Warehouse Operations
            </button>
          </div>
        </div>

        <div className="d2c-main-header">
          <div className="d2c-main-inner">
            <button
              type="button"
              className="d2c-mobile-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>

            <button
              type="button"
              className="d2c-logo"
              onClick={() => navigate("/")}
              aria-label="D2C Mall home"
            >
              <span className="d2c-logo-mark">
                <Store size={24} strokeWidth={2.5} />
              </span>

              <span className="d2c-logo-text">
                <strong>
                  D2C<span>MALL</span>
                </strong>
                <small>DIRECT-TO-CONSUMER STORE</small>
              </span>
            </button>

            <form
              className="d2c-search"
              onSubmit={submitSearch}
              role="search"
            >
              <Search size={21} className="d2c-search-icon" />

              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search products, brands, categories..."
                aria-label="Search products"
              />

              {searchValue && (
                <button
                  type="button"
                  className="d2c-search-clear"
                  onClick={() => setSearchValue("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="button"
                className="d2c-voice-search"
                aria-label="Voice search"
                onClick={() => navigate("/search?voice=true")}
              >
                <Mic size={19} />
              </button>
            </form>

            <div className="d2c-header-actions">
              <button
                type="button"
                className="d2c-location"
                onClick={openLocation}
              >
                <MapPin size={21} />

                <span>
                  <small>DELIVER TO</small>
                  <strong>{currentPincode || "110001"}</strong>
                </span>

                <ChevronDown size={15} />
              </button>

              <button
                type="button"
                className="d2c-header-pill d2c-shop-pill"
                onClick={() => navigate("/shop")}
              >
                Shop
              </button>

              <button
                type="button"
                className="d2c-header-pill d2c-franchise-pill"
                onClick={() => navigate("/franchise")}
              >
                <Store size={17} />
                Franchise
              </button>

              <button
                type="button"
                className={`d2c-icon-action ${
                  isActive("/wishlist") ? "active" : ""
                }`}
                onClick={() => navigate("/wishlist")}
                aria-label="Wishlist"
              >
                <Heart
                  size={22}
                  fill={isActive("/wishlist") ? "currentColor" : "none"}
                />

                {wishlistCount > 0 && (
                  <span className="d2c-count">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`d2c-orders-action ${
                  isActive("/orders") ? "active" : ""
                }`}
                onClick={() => navigate("/orders")}
              >
                <PackageSearch size={22} />

                <span className="d2c-orders-label">
                  <strong>Orders</strong>
                  <small>Track</small>
                </span>
              </button>

              <button
                type="button"
                className={`d2c-cart-action ${
                  isActive("/cart") ? "active" : ""
                }`}
                onClick={() => navigate("/cart")}
                aria-label="Shopping bag"
              >
                <ShoppingBag size={23} />

                {cartCount > 0 && (
                  <span className="d2c-count d2c-cart-count">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="d2c-account-action"
                onClick={() => navigate("/account")}
              >
                <UserRound size={21} />

                <span>
                  <strong>Hello, User</strong>
                  <small>Account</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <nav className="d2c-category-nav">
          <div className="d2c-category-inner">
            <div className="d2c-category-dropdown">
              <button
                type="button"
                className={`d2c-category-button ${
                  categoryOpen ? "open" : ""
                }`}
                onClick={() => setCategoryOpen((value) => !value)}
              >
                <Menu size={18} />
                Categories
                <ChevronDown size={15} />
              </button>

              <AnimatePresence>
                {categoryOpen && (
                  <motion.div
                    className="d2c-category-menu"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="d2c-category-menu-heading">
                      <span>SHOP BY CATEGORY</span>
                      <button
                        type="button"
                        onClick={() => navigate("/shop")}
                      >
                        View all
                      </button>
                    </div>

                    <div className="d2c-category-grid">
                      {categories.map((category) => (
                        <button
                          type="button"
                          key={category.path}
                          className="d2c-category-item"
                          onClick={() => navigate(category.path)}
                        >
                          <span>{category.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="d2c-primary-links">
              {categories.slice(0, 6).map((category) => (
                <button
                  type="button"
                  key={category.path}
                  className={isActive(category.path) ? "active" : ""}
                  onClick={() => navigate(category.path)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="d2c-discovery-links">
              {discoveryLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.path}
                    className={isActive(item.path) ? "active" : ""}
                    onClick={() => navigate(item.path)}
                    style={{ "--link-accent": item.accent }}
                  >
                    <Icon size={15} />
                    {item.label}

                    {item.label === "Deals" && (
                      <span className="d2c-hot-badge">HOT</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="d2c-franchise-link"
              onClick={() => navigate("/franchise")}
            >
              <Store size={17} />
              Franchise Opportunities
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="d2c-mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              className="d2c-mobile-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 330,
                damping: 32,
              }}
            >
              <div className="d2c-mobile-drawer-header">
                <button
                  type="button"
                  className="d2c-logo"
                  onClick={() => {
                    navigate("/");
                    setMobileOpen(false);
                  }}
                >
                  <span className="d2c-logo-mark">
                    <Store size={22} />
                  </span>

                  <span className="d2c-logo-text">
                    <strong>
                      D2C<span>MALL</span>
                    </strong>
                    <small>DIRECT-TO-CONSUMER STORE</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="d2c-drawer-close"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                >
                  <X size={22} />
                </button>
              </div>

              <button
                type="button"
                className="d2c-mobile-account"
                onClick={() => {
                  navigate("/account");
                  setMobileOpen(false);
                }}
              >
                <span className="d2c-mobile-account-icon">
                  <UserRound size={20} />
                </span>

                <span>
                  <strong>Hello, User</strong>
                  <small>View your account</small>
                </span>
              </button>

              <div className="d2c-mobile-section">
                <span className="d2c-mobile-heading">SHOP</span>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/shop");
                    setMobileOpen(false);
                  }}
                >
                  All Products
                </button>

                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.path}
                    onClick={() => {
                      navigate(category.path);
                      setMobileOpen(false);
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="d2c-mobile-section">
                <span className="d2c-mobile-heading">DISCOVER</span>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/trending");
                    setMobileOpen(false);
                  }}
                >
                  Trending
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/new-arrivals");
                    setMobileOpen(false);
                  }}
                >
                  New Arrivals
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/deals");
                    setMobileOpen(false);
                  }}
                >
                  Deals
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/social");
                    setMobileOpen(false);
                  }}
                >
                  D2C Street
                </button>
              </div>

              <div className="d2c-mobile-section">
                <span className="d2c-mobile-heading">YOUR D2C MALL</span>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/orders");
                    setMobileOpen(false);
                  }}
                >
                  My Orders
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/wishlist");
                    setMobileOpen(false);
                  }}
                >
                  Wishlist
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/franchise");
                    setMobileOpen(false);
                  }}
                >
                  Franchise Opportunities
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MainHeader;