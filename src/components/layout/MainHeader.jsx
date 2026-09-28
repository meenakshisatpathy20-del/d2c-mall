import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Flame,
  Heart,
  History,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  User,
  Warehouse,
  X,
  Zap,
  LifeBuoy,
  Home,
  Users,
  Activity,
} from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { brands, categories, getSearchSuggestions } from "../../data/catalog";
import { logout, useCurrentUser } from "../../lib/services/account";
import { useStore } from "../../lib/store";
import { cx, formatINR, initials } from "../../lib/format";
import { Drawer, Img } from "../common/ui";
import "./MainHeader.css";

const TRENDING_SEARCHES = ["oversized tee", "sneakers", "niacinamide", "kurta", "headphones", "gold necklace", "linen shirt"];
const PROMOS = [
  "100% brand certified · every product verified",
  "Free delivery on orders over ₹499",
  "Easy 14-day returns & exchanges",
  "Use WELCOME100 for ₹100 off your first order",
];

function useRecentSearches() {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("d2c_recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const add = (q) => {
    const next = [q, ...list.filter((x) => x !== q)].slice(0, 6);
    setList(next);
    try {
      localStorage.setItem("d2c_recent_searches", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const clear = () => {
    setList([]);
    try {
      localStorage.removeItem("d2c_recent_searches");
    } catch {
      /* ignore */
    }
  };
  return { list, add, clear };
}

function SearchBox({ onDone }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [listening, setListening] = useState(false);
  const recent = useRecentSearches();
  const boxRef = useRef(null);

  const sugg = useMemo(() => getSearchSuggestions(q, 5), [q]);
  const flat = useMemo(
    () => [
      ...sugg.products.map((p) => ({ type: "product", to: `/product/${p.id}`, p })),
      ...sugg.brands.map((b) => ({ type: "brand", to: `/brands/${b.id}`, b })),
      ...sugg.categories.map((c) => ({ type: "cat", to: `/category/${c.id}${c.sub ? `?sub=${encodeURIComponent(c.sub)}` : ""}`, c })),
    ],
    [sugg]
  );

  useEffect(() => {
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (query) => {
    const term = String(query || q).trim();
    if (!term) return;
    recent.add(term);
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    onDone?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && flat[active]) {
      e.preventDefault();
      navigate(flat[active].to);
      setOpen(false);
      onDone?.();
    } else if (e.key === "Escape") setOpen(false);
  };

  const voice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setQ(text);
      go(text);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const hasSR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="hsearch" ref={boxRef}>
      <form
        className={cx("hsearch-form", open && "focused")}
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        role="search"
      >
        <Search size={18} className="hsearch-icon" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, brands, categories or SKU"
          aria-label="Search"
        />
        {q ? (
          <button type="button" className="hsearch-clear" onClick={() => setQ("")} aria-label="Clear search">
            <X size={15} />
          </button>
        ) : null}
        {hasSR ? (
          <button type="button" className={cx("hsearch-mic", listening && "on")} onClick={voice} aria-label="Voice search">
            <Mic size={17} />
          </button>
        ) : null}
      </form>

      <AnimatePresence>
        {open ? (
          <motion.div className="hsearch-pop" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
            {!q.trim() ? (
              <>
                {recent.list.length ? (
                  <div className="hs-sec">
                    <div className="hs-title">
                      Recent searches
                      <button type="button" onClick={recent.clear}>Clear</button>
                    </div>
                    {recent.list.map((r) => (
                      <button key={r} type="button" className="hs-row" onClick={() => { setQ(r); go(r); }}>
                        <History size={15} /> {r}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="hs-sec">
                  <div className="hs-title">Trending searches</div>
                  <div className="row wrap gap-6">
                    {TRENDING_SEARCHES.map((t) => (
                      <button key={t} type="button" className="chip" onClick={() => { setQ(t); go(t); }}>
                        <TrendingUp size={13} /> {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="hs-sec">
                  <div className="hs-title">Popular brands</div>
                  <div className="row wrap gap-6">
                    {brands.slice(0, 8).map((b) => (
                      <Link key={b.id} to={`/brands/${b.id}`} className="chip" onClick={() => setOpen(false)}>
                        <span className="brand-dot" style={{ background: b.color }} /> {b.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            ) : flat.length ? (
              <>
                {sugg.products.length ? (
                  <div className="hs-sec">
                    <div className="hs-title">Products</div>
                    {sugg.products.map((p, i) => (
                      <Link key={p.id} to={`/product/${p.id}`} className={cx("hs-product", active === i && "active")} onClick={() => { setOpen(false); onDone?.(); }}>
                        <Img src={p.images[0]} alt="" className="hs-thumb" label={p.brand} />
                        <span className="grow">
                          <b>{p.name}</b>
                          <span className="xs muted">
                            {p.brand} · {p.sku}
                          </span>
                        </span>
                        <span className="bold small">{formatINR(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
                {sugg.brands.length ? (
                  <div className="hs-sec">
                    <div className="hs-title">Brands</div>
                    {sugg.brands.map((b, i) => (
                      <Link key={b.id} to={`/brands/${b.id}`} className={cx("hs-row", active === sugg.products.length + i && "active")} onClick={() => setOpen(false)}>
                        <Store size={15} /> {b.name} <span className="xs muted">· {b.tagline}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
                {sugg.categories.length ? (
                  <div className="hs-sec">
                    <div className="hs-title">Categories</div>
                    {sugg.categories.map((c, i) => (
                      <Link
                        key={c.label}
                        to={`/category/${c.id}${c.sub ? `?sub=${encodeURIComponent(c.sub)}` : ""}`}
                        className={cx("hs-row", active === sugg.products.length + sugg.brands.length + i && "active")}
                        onClick={() => setOpen(false)}
                      >
                        <LayoutGrid size={15} /> {c.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <button type="button" className="hs-all" onClick={() => go()}>
                  See all results for "{q}" <Search size={14} />
                </button>
              </>
            ) : (
              <div className="hs-sec center small muted">
                No matches for "{q}". Try a brand, category or SKU like <b>D2C-MEN-001</b>.
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    { to: "/account", icon: User, label: "My Profile" },
    { to: "/orders", icon: Package, label: "Orders" },
    { to: "/returns", icon: RotateCcw, label: "Returns & Refunds" },
    { to: "/wishlist", icon: Heart, label: "Wishlist" },
    { to: "/account/notifications", icon: Bell, label: "Notifications" },
    { to: "/account/help", icon: LifeBuoy, label: "Help & Support" },
  ];

  return (
    <div className="hacc" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="hacc-btn" onClick={() => (user ? setOpen((o) => !o) : navigate("/login"))}>
        {user ? <span className="avatar sm">{initials(user.name)}</span> : <User size={20} />}
        <span className="hacc-text">
          <b>{user ? `Hi, ${user.name.split(" ")[0]}` : "Login"}</b>
          <span>{user ? "Account" : "Sign up"}</span>
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="hacc-pop" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            {user ? (
              <div className="hacc-head">
                <span className="avatar">{initials(user.name)}</span>
                <div>
                  <b>{user.name}</b>
                  <div className="xs muted">{user.email}</div>
                </div>
              </div>
            ) : (
              <div className="hacc-head col" style={{ alignItems: "stretch" }}>
                <b>Welcome to D2C Mall</b>
                <span className="xs muted">Access your orders, wishlist & D2C Street</span>
                <Link to="/login" className="btn btn-sm btn-block mt-8" onClick={() => setOpen(false)}>
                  Login / Sign up
                </Link>
              </div>
            )}
            <div className="hacc-list">
              {items.map((it) => (
                <Link key={it.to} to={user ? it.to : `/login?next=${encodeURIComponent(it.to)}`} onClick={() => setOpen(false)}>
                  <it.icon size={16} /> {it.label}
                </Link>
              ))}
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    navigate("/");
                  }}
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MegaMenu({ category, onClose }) {
  const featured = brands.filter((b) => b.category === category.id);
  return (
    <motion.div className="mega" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }}>
      <div className="container mega-inner">
        <div className="mega-col">
          <span className="mega-title" style={{ color: category.accent }}>{category.name}</span>
          <Link to={`/category/${category.id}`} onClick={onClose} className="bold">
            Shop all {category.name}
          </Link>
          {category.subcategories.map((s) => (
            <Link key={s} to={`/category/${category.id}?sub=${encodeURIComponent(s)}`} onClick={onClose}>
              {s}
            </Link>
          ))}
        </div>
        <div className="mega-col">
          <span className="mega-title">Featured brands</span>
          {featured.map((b) => (
            <Link key={b.id} to={`/brands/${b.id}`} onClick={onClose}>
              {b.name}
            </Link>
          ))}
          <span className="mega-title mt-8">Discover</span>
          <Link to="/new-arrivals" onClick={onClose}>New arrivals</Link>
          <Link to="/deals" onClick={onClose}>Deals of the day</Link>
          <Link to="/trending" onClick={onClose}>Trending now</Link>
        </div>
        <Link to={`/category/${category.id}`} className="mega-feature" onClick={onClose}>
          <Img src={category.image} alt={category.name} label={category.name} />
          <div className="mega-feature-copy">
            <span className="eyebrow light">Just in</span>
            <b>{category.tagline}</b>
            <span className="small">Explore {category.name} →</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

export default function MainHeader() {
  const { cartCount, wishlistCount, openCart, pincode, openPincode } = useShop();
  const user = useCurrentUser();
  const notifications = useStore((s) => s.notifications);
  const unread = user ? notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  const [mega, setMega] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [promo, setPromo] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const timer = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setPromo((p) => (p + 1) % PROMOS.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMega(null);
    setDrawer(false);
  }, [location.pathname, location.search]);

  const enter = (cat) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMega(cat), 120);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMega(null), 160);
  };

  const megaCat = categories.find((c) => c.id === mega);

  return (
    <>
      <header className={cx("header", scrolled && "scrolled")}>
        <div className="topbar">
          <div className="container topbar-inner">
            <div className="topbar-promo">
              <span className="live-dot" />
              <AnimatePresence mode="wait">
                <motion.span key={promo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  {PROMOS[promo]}
                </motion.span>
              </AnimatePresence>
            </div>
            <nav className="topbar-links">
              <Link to="/pulse"><Activity size={13} /> D2C Pulse</Link>
              <Link to="/orders"><Package size={13} /> Track order</Link>
              <Link to="/franchise"><Store size={13} /> Franchise</Link>
              <Link to="/account/help"><LifeBuoy size={13} /> Help</Link>
              <Link to="/admin/login" className="topbar-ops"><Warehouse size={13} /> Warehouse & Admin</Link>
            </nav>
          </div>
        </div>

        <div className="container header-main">
          <button className="icon-btn header-burger" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>

          <Link to="/" className="logo" aria-label="D2C Mall home">
            <span className="logo-tile">
              <Store size={22} />
            </span>
            <span className="logo-text">
              <span className="logo-word">
                <span className="d2c">D2C</span>
                <span className="mall">MALL</span>
              </span>
              <span className="logo-tag">Direct-to-consumer store</span>
            </span>
          </Link>

          <div className="header-search">
            <SearchBox />
          </div>

          <button type="button" className="deliver" onClick={openPincode}>
            <MapPin size={18} />
            <span>
              <span className="deliver-label">Deliver to</span>
              <b>{pincode ? `${pincode.city?.split(" ")[0] || ""} ${pincode.pincode}` : "Select pincode"}</b>
            </span>
            <ChevronDown size={15} />
          </button>

          <div className="header-actions">
            <AccountMenu user={user} />
            <Link to={user ? "/account/notifications" : "/login"} className="hicon" aria-label="Notifications">
              <Bell size={20} />
              {unread ? <span className="hcount">{unread}</span> : null}
              <span className="hicon-label">Alerts</span>
            </Link>
            <Link to="/wishlist" className="hicon" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount ? <span className="hcount">{wishlistCount}</span> : null}
              <span className="hicon-label">Wishlist</span>
            </Link>
            <button type="button" className="hicon" onClick={openCart} aria-label="Bag">
              <ShoppingBag size={20} />
              {cartCount ? <span className="hcount orange">{cartCount}</span> : null}
              <span className="hicon-label">Bag</span>
            </button>
          </div>
        </div>

        <div className="header-mobile-search container">
          <SearchBox />
        </div>

        <nav className="catnav" onMouseLeave={leave}>
          <div className="container catnav-inner">
            <Link to="/shop" className="catnav-all">
              <LayoutGrid size={16} /> All categories
            </Link>
            {categories.map((c) => (
              <NavLink
                key={c.id}
                to={`/category/${c.id}`}
                className={({ isActive }) => cx("catnav-link", (isActive || mega === c.id) && "active")}
                onMouseEnter={() => enter(c.id)}
              >
                {c.name}
              </NavLink>
            ))}
            <span className="catnav-sep" />
            <NavLink to="/deals" className="catnav-link hot" onMouseEnter={() => enter(null)}>
              <Flame size={15} /> Deals <span className="hot-badge">HOT</span>
            </NavLink>
            <NavLink to="/new-arrivals" className="catnav-link green" onMouseEnter={() => enter(null)}>
              <Sparkles size={15} /> New
            </NavLink>
            <NavLink to="/d2c-street" className="catnav-link purple" onMouseEnter={() => enter(null)}>
              <Users size={15} /> D2C Street
            </NavLink>
            <NavLink to="/pulse" className="catnav-link blue" onMouseEnter={() => enter(null)}>
              <Zap size={15} /> Pulse
            </NavLink>
            <NavLink to="/franchise" className="catnav-link orange" onMouseEnter={() => enter(null)}>
              <Store size={15} /> Franchise
            </NavLink>
          </div>
          <AnimatePresence>{megaCat ? <div onMouseEnter={() => enter(megaCat.id)}><MegaMenu category={megaCat} onClose={() => setMega(null)} /></div> : null}</AnimatePresence>
        </nav>
      </header>

      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left" width="min(88vw, 360px)">
        <div className="mdrawer">
          <div className="mdrawer-head">
            {user ? (
              <>
                <span className="avatar">{initials(user.name)}</span>
                <div className="grow">
                  <b>{user.name}</b>
                  <div className="xs" style={{ opacity: 0.8 }}>{user.email}</div>
                </div>
              </>
            ) : (
              <Link to="/login" className="btn btn-white btn-sm">
                Login / Sign up
              </Link>
            )}
            <button className="icon-btn" style={{ color: "#fff" }} onClick={() => setDrawer(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
          <div className="mdrawer-body">
            <span className="mdrawer-title">Shop by category</span>
            {categories.map((c) => (
              <Link key={c.id} to={`/category/${c.id}`} className="mdrawer-cat">
                <Img src={c.image} alt="" className="mdrawer-thumb" label={c.name} />
                {c.name}
              </Link>
            ))}
            <span className="mdrawer-title">Discover</span>
            <Link to="/deals" className="mdrawer-link"><Flame size={16} /> Deals of the day</Link>
            <Link to="/new-arrivals" className="mdrawer-link"><Sparkles size={16} /> New arrivals</Link>
            <Link to="/trending" className="mdrawer-link"><TrendingUp size={16} /> Trending</Link>
            <Link to="/brands" className="mdrawer-link"><Store size={16} /> All brands</Link>
            <Link to="/d2c-street" className="mdrawer-link"><Users size={16} /> D2C Street</Link>
            <Link to="/pulse" className="mdrawer-link"><Activity size={16} /> D2C Pulse</Link>
            <span className="mdrawer-title">Account</span>
            <Link to="/account" className="mdrawer-link"><User size={16} /> My profile</Link>
            <Link to="/orders" className="mdrawer-link"><Package size={16} /> Orders</Link>
            <Link to="/returns" className="mdrawer-link"><RotateCcw size={16} /> Returns</Link>
            <Link to="/account/help" className="mdrawer-link"><LifeBuoy size={16} /> Help centre</Link>
            <Link to="/franchise" className="mdrawer-link"><Store size={16} /> Franchise opportunities</Link>
            <Link to="/admin/login" className="mdrawer-link"><ShieldCheck size={16} /> Warehouse & admin login</Link>
          </div>
        </div>
      </Drawer>
    </>
  );
}

export function MobileTabBar() {
  const { cartCount, openCart } = useShop();
  const user = useCurrentUser();
  return (
    <nav className="tabbar">
      <NavLink to="/" end className={({ isActive }) => cx(isActive && "active")}>
        <Home size={20} /> Home
      </NavLink>
      <NavLink to="/shop" className={({ isActive }) => cx(isActive && "active")}>
        <LayoutGrid size={20} /> Shop
      </NavLink>
      <NavLink to="/d2c-street" className={({ isActive }) => cx(isActive && "active")}>
        <Users size={20} /> Street
      </NavLink>
      <button type="button" onClick={openCart}>
        <span className="tab-icon">
          <ShoppingBag size={20} />
          {cartCount ? <span className="hcount orange">{cartCount}</span> : null}
        </span>
        Bag
      </button>
      <NavLink to={user ? "/account" : "/login"} className={({ isActive }) => cx(isActive && "active")}>
        <User size={20} /> {user ? "Me" : "Login"}
      </NavLink>
    </nav>
  );
}

