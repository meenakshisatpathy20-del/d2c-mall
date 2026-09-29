import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Heart,
  Maximize2,
  Package,
  Play,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { bankOffers, getBrand, getCategory, getCompleteTheLook, getProductById, getSimilarProducts, products } from "../../data/catalog";
import { coupons } from "../../data/coupons";
import { posts, getCreator } from "../../data/social";
import { useShop } from "../../context/ShopContext";
import { stockOf } from "../../lib/services/inventory";
import { evaluateCoupon } from "../../lib/pricing";
import { compact, cx, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import ProductCard from "../common/ProductCard";
import { DeliveryChecker } from "../common/DeliveryChecker";
import { Breadcrumbs, Empty, Img, Modal, Price, QtyStepper, Rail, RatingChip, SectionHead, useDocumentTitle } from "../common/ui";
import ShopTheLook from "../social/ShopTheLook";
import ProductReviews from "./ProductReviews";
import { BoughtTogether, EmiOffers, ProductQA } from "./ProductExtras";
import { toggleCompare, togglePriceAlert, toggleStockAlert, useAlerts, useCompare } from "../../lib/services/extras";
import { Bell, BellRing, GitCompareArrows } from "lucide-react";
import "./ProductDetailsPage.css";

const SIZE_CHART = {
  headers: ["Size", "Chest (in)", "Waist (in)", "Length (in)", "Shoulder (in)"],
  rows: [
    ["XS", "34", "28", "26", "16"],
    ["S", "36", "30", "27", "16.5"],
    ["M", "38", "32", "28", "17"],
    ["L", "40", "34", "29", "17.5"],
    ["XL", "42", "36", "30", "18"],
    ["XXL", "44", "38", "31", "18.5"],
  ],
};

function Gallery({ product }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [full, setFull] = useState(false);
  useEffect(() => setActive(0), [product.id]);
  const src = product.images[active];

  return (
    <div className="gallery">
      <div className="gallery-thumbs">
        {product.images.map((s, i) => (
          <button key={s} className={cx(i === active && "active")} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}>
            <Img src={s} alt="" label="" />
          </button>
        ))}
      </div>
      <div
        className="gallery-main"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setFull(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={src} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="gallery-img">
            <Img src={src} alt={product.name} label={product.brand} eager />
          </motion.div>
        </AnimatePresence>
        {zoom ? <div className="gallery-zoom" style={{ backgroundImage: `url(${src.replace(/w=\d+/, "w=1600")})`, backgroundPosition: `${zoom.x}% ${zoom.y}%` }} /> : null}
        <span className="gallery-hint">
          <Maximize2 size={13} /> Hover to zoom · click for full screen
        </span>
        <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); setActive((active - 1 + product.images.length) % product.images.length); }} aria-label="Previous image">
          <ChevronLeft size={18} />
        </button>
        <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); setActive((active + 1) % product.images.length); }} aria-label="Next image">
          <ChevronRight size={18} />
        </button>
        <div className="gallery-dots">
          {product.images.map((s, i) => (
            <span key={s} className={cx(i === active && "active")} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {full ? (
          <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="lightbox-close" onClick={() => setFull(false)} aria-label="Close">
              <X size={22} />
            </button>
            <button className="lightbox-nav prev" onClick={() => setActive((active - 1 + product.images.length) % product.images.length)} aria-label="Previous">
              <ChevronLeft size={26} />
            </button>
            <Img src={src.replace(/w=\d+/, "w=1600")} alt={product.name} className="lightbox-img" label={product.brand} />
            <button className="lightbox-nav next" onClick={() => setActive((active + 1) % product.images.length)} aria-label="Next">
              <ChevronRight size={26} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Accordion({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={cx("acc", open && "open")}>
      <button className="acc-head" onClick={() => setOpen(!open)}>
        {title} <ChevronDown size={18} />
      </button>
      {open ? <div className="acc-body">{children}</div> : null}
    </div>
  );
}

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = getProductById(productId);
  const { addToCart, buyNow, toggleWishlist, isWishlisted, addRecentlyViewed, inventory, userOrders, usage, cart } = useShop();
  const alerts = useAlerts();
  const compare = useCompare();
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [chart, setChart] = useState(false);
  const [look, setLook] = useState(null);

  useDocumentTitle(product ? `${product.brand} ${product.name}` : "Product not found");

  useEffect(() => {
    if (!product) return;
    addRecentlyViewed(product);
    setSize(null);
    setColor(product.colors[0]?.name || null);
    setQty(1);
    setSizeError(false);
  }, [product, addRecentlyViewed]);

  const bestCoupon = useMemo(() => {
    if (!product) return null;
    const items = [{ ...product, productId: product.id, qty: 1 }];
    return coupons
      .map((c) => ({ c, r: evaluateCoupon(c.code, { items, userOrders, usage }) }))
      .filter((x) => x.r.ok && x.r.discount > 0)
      .sort((a, b) => b.r.discount - a.r.discount)[0];
  }, [product, userOrders, usage]);

  if (!product) {
    return (
      <div className="page container">
        <Empty icon={<Package size={34} />} title="Product not found" text="This product may have been removed or the link is incorrect." action={<Link to="/shop" className="btn">Continue shopping</Link>} />
      </div>
    );
  }

  const brand = getBrand(product.brandId);
  const category = getCategory(product.category);
  const stock = stockOf(product.id, inventory).sellable;
  const inBag = cart.some((c) => c.productId === product.id && (!product.sizes.length || c.size === size));
  const wished = isWishlisted(product.id);
  const similar = getSimilarProducts(product);
  const lookItems = getCompleteTheLook(product);
  const reels = posts.filter((p) => p.productIds.includes(product.id) || p.productIds.some((id) => products.find((x) => x.id === id)?.category === product.category)).slice(0, 6);
  const alsoBought = products.filter((p) => p.category !== product.category && p.tags.includes("bestseller")).slice(0, 10);

  const validate = () => {
    if (product.sizes.length && !size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const add = () => {
    if (!validate()) return;
    if (inBag) {
      navigate("/cart");
      return;
    }
    addToCart(product, { size, color, qty });
  };

  const buy = () => {
    if (!validate()) return;
    if (buyNow(product, { size, color, qty })) navigate("/checkout");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Product link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="page pdp">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: category?.name, to: `/category/${product.category}` },
            { label: product.subcategory, to: `/category/${product.category}?sub=${encodeURIComponent(product.subcategory)}` },
            { label: product.name },
          ]}
        />

        <div className="pdp-grid">
          <Gallery product={product} />

          <div className="pdp-info">
            <div className="row between">
              <Link to={`/brands/${product.brandId}`} className="pdp-brand">
                {product.brand} <BadgeCheck size={16} className="text-blue" />
              </Link>
              <div className="row gap-4">
                <button className="icon-btn" onClick={share} aria-label="Share">
                  <Share2 size={18} />
                </button>
                <button className={cx("icon-btn", wished && "text-red")} onClick={() => toggleWishlist(product)} aria-label="Wishlist">
                  <Heart size={18} fill={wished ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
            <h1 className="pdp-name">{product.name}</h1>
            <a href="#reviews" className="row gap-6 wrap">
              <RatingChip rating={product.rating} />
              <span className="small muted">
                {compact(product.ratingCount)} ratings · {compact(product.reviewCount)} reviews
              </span>
            </a>

            <div className="social-proof">
              <span>
                <Eye size={14} /> {product.viewingNow} people viewing now
              </span>
              <span>
                <Flame size={14} /> {compact(product.soldLast24h)} bought in last 24h
              </span>
            </div>

            <div className="pdp-price">
              <Price price={product.price} mrp={product.mrp} size="lg" />
              <div className="row gap-6 wrap">
                <span className="xs text-green bold">inclusive of all taxes</span>
                {product.mrp > product.price ? <span className="badge badge-soft-green">You save {formatINR(product.mrp - product.price)}</span> : null}
              </div>
              <EmiOffers price={product.price} />
              {bestCoupon ? (
                <div className="best-price">
                  <Tag size={15} />
                  <span>
                    Best price <b>{formatINR(product.price - bestCoupon.r.discount)}</b> with code <b className="code">{bestCoupon.c.code}</b>
                  </span>
                </div>
              ) : null}
            </div>

            {product.colors.length ? (
              <div className="pdp-block">
                <span className="label">
                  Colour: <span className="muted">{color}</span>
                </span>
                <div className="swatches mt-8">
                  {product.colors.map((c) => (
                    <button key={c.name} className={cx("swatch lg", color === c.name && "active")} style={{ "--sw": c.value }} onClick={() => setColor(c.name)} aria-label={c.name} title={c.name} />
                  ))}
                </div>
              </div>
            ) : null}

            {product.sizes.length ? (
              <div className="pdp-block" id="size-picker">
                <div className="row between">
                  <span className="label">Select size</span>
                  {product.sizeChart ? (
                    <button className="link small" onClick={() => setChart(true)}>
                      <Ruler size={14} /> Size chart
                    </button>
                  ) : null}
                </div>
                <div className={cx("sizes mt-8", sizeError && "shake")}>
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      className={cx("size", size === s && "active")}
                      disabled={product.soldOutSizes?.includes(s)}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                    >
                      {s}
                      {!product.soldOutSizes?.includes(s) && stock <= 5 && size === s ? <em>{stock} left</em> : null}
                    </button>
                  ))}
                </div>
                {sizeError ? <p className="xs text-red bold mt-8">Please select a size to continue</p> : null}
                {product.soldOutSizes?.length ? (
                  <div className="row wrap gap-6 mt-8 xs">
                    <span className="muted">Size sold out? Get notified:</span>
                    {product.soldOutSizes.map((s) => {
                      const on = !!alerts.stock?.[`${product.id}__${s}`];
                      return (
                        <button key={s} className={cx("chip", on && "active-blue")} style={{ minHeight: 26, padding: "0 10px" }} onClick={() => toggleStockAlert(product.id, s)}>
                          {on ? <BellRing size={12} /> : <Bell size={12} />} {s}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                {product.sizeChart ? <p className="xs muted mt-8">82% say this fits true to size · model is 5'10" wearing M</p> : null}
              </div>
            ) : null}

            <div className="pdp-block row gap-16 wrap">
              <div className="row gap-6">
                <span className="label">Qty</span>
                <QtyStepper value={qty} max={Math.max(1, Math.min(stock, 10))} onChange={setQty} />
              </div>
              {stock <= 0 ? (
                <span className="badge badge-soft-red">Out of stock</span>
              ) : stock <= 5 ? (
                <span className="badge badge-soft-red">Hurry! Only {stock} left</span>
              ) : (
                <span className="badge badge-soft-green">In stock · ready to ship</span>
              )}
            </div>

            <div className="pdp-actions">
              {stock <= 0 ? (
                <button className={cx("btn btn-lg", alerts.stock?.[`${product.id}__-`] ? "btn-outline-blue" : "btn-dark")} onClick={() => toggleStockAlert(product.id, null)}>
                  <Bell size={19} /> {alerts.stock?.[`${product.id}__-`] ? "Alert set" : "Notify me"}
                </button>
              ) : (
                <button className="btn btn-lg" onClick={add}>
                  <ShoppingBag size={19} /> {inBag ? "Go to bag" : "Add to bag"}
                </button>
              )}
              <button className="btn btn-lg btn-blue" disabled={stock <= 0} onClick={buy}>
                <Zap size={19} /> Buy now
              </button>
              <button className={cx("btn btn-lg btn-outline", wished && "text-red")} onClick={() => toggleWishlist(product)}>
                <Heart size={19} fill={wished ? "currentColor" : "none"} /> {wished ? "Wishlisted" : "Wishlist"}
              </button>
            </div>

            <div className="row wrap gap-6">
              <button className={cx("btn btn-sm", alerts.price?.[product.id] ? "btn-outline-blue" : "btn-ghost")} onClick={() => togglePriceAlert(product)}>
                {alerts.price?.[product.id] ? <BellRing size={15} /> : <Bell size={15} />} {alerts.price?.[product.id] ? "Price alert on" : "Alert me on price drop"}
              </button>
              <button className={cx("btn btn-sm", compare.includes(product.id) ? "btn-outline-blue" : "btn-ghost")} onClick={() => toggleCompare(product)}>
                <GitCompareArrows size={15} /> {compare.includes(product.id) ? "Added to compare" : "Compare"}
              </button>
            </div>

            <DeliveryChecker product={product} />

            <div className="pdp-offers">
              <b className="row gap-6">
                <Sparkles size={16} className="text-orange" /> Available offers
              </b>
              {bankOffers.slice(0, 3).map((o) => (
                <div key={o.id} className="offer-line">
                  <Tag size={14} />
                  <span>
                    <b>{o.bank}:</b> {o.text}
                  </span>
                </div>
              ))}
              {coupons
                .filter((c) => c.expiresAt > Date.now())
                .slice(0, 2)
                .map((c) => (
                  <div key={c.code} className="offer-line">
                    <Tag size={14} />
                    <span>
                      <b>Coupon {c.code}:</b> {c.description}
                    </span>
                  </div>
                ))}
            </div>

            <div className="pdp-trust">
              <span>
                <ShieldCheck size={18} /> 100% authentic
              </span>
              <span>
                <Truck size={18} /> Free delivery over ₹499
              </span>
              <span>
                <Package size={18} /> {product.returnDays ? `${product.returnDays}-day returns` : "Non-returnable"}
              </span>
            </div>

            <div className="pdp-details">
              <Accordion title="Product details" defaultOpen>
                <p>{product.description}</p>
                <ul className="pdp-highlights">
                  {product.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Specifications">
                <div className="spec-grid">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k}>
                      <span className="xs muted">{k}</span>
                      <b className="small">{v}</b>
                    </div>
                  ))}
                </div>
              </Accordion>
              <Accordion title="Material & care">
                <p>{product.material}. Wash with similar colours. Do not bleach. Dry in shade to retain colour and texture.</p>
              </Accordion>
              <Accordion title="Returns, exchange & warranty">
                <p>
                  {product.returnDays
                    ? `Easy ${product.returnDays}-day returns${product.exchange ? " and size exchanges" : ""} with free doorstep pickup. Refunds are processed within 48 hours of pickup quality check.`
                    : "This is a hygiene product and cannot be returned once opened. Damaged or wrong items are replaced free of cost."}
                </p>
              </Accordion>
              <Accordion title={`Sold by ${product.brand}`}>
                <div className="row gap-16">
                  <span className="brand-logo" style={{ background: brand?.color }}>
                    {product.brand.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <b>{product.brand}</b>
                    <p className="small muted">
                      {brand?.tagline} Based in {brand?.city}, since {brand?.founded}.
                    </p>
                    <Link to={`/brands/${product.brandId}`} className="link small mt-4">
                      <Store size={14} /> Visit brand store
                    </Link>
                  </div>
                </div>
              </Accordion>
            </div>
          </div>
        </div>

        {lookItems.length ? (
          <section className="section">
            <SectionHead eyebrow={<><Sparkles size={13} /> Complete the look</>} title="Styled with" sub="Handpicked pieces that go with this" />
            <div className="look-row">
              <div className="look-main">
                <Img src={product.images[0]} alt={product.name} label={product.brand} />
                <b className="small">This item</b>
              </div>
              {lookItems.map((p) => (
                <div key={p.id} className="look-plus">
                  <span className="plus">+</span>
                  <ProductCard product={p} showDelivery={false} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {reels.length ? (
          <section className="section">
            <SectionHead eyebrow={<><Users size={13} /> Seen on D2C Street</>} eyebrowTone="blue" title="Reels & looks featuring this style" to="/d2c-street" action="Explore D2C Street" />
            <Rail itemWidth="minmax(180px, 200px)">
              {reels.map((post) => {
                const c = getCreator(post.creatorId);
                return (
                  <button key={post.id} className="pdp-reel" onClick={() => setLook(post)}>
                    <Img src={post.image} alt="" label={post.topic} />
                    <span className="pdp-reel-play">
                      <Play size={14} fill="currentColor" />
                    </span>
                    <span className="pdp-reel-meta">
                      <b>@{c.handle}</b>
                      <span className="xs">Shop this look · {post.productIds.length}</span>
                    </span>
                  </button>
                );
              })}
            </Rail>
          </section>
        ) : null}

        <BoughtTogether key={`fbt-${product.id}`} product={product} />

        <ProductReviews product={product} />

        <ProductQA product={product} />

        <section className="section">
          <SectionHead eyebrow="You may also like" title="Similar products" to={`/category/${product.category}`} action="View all" />
          <Rail>
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>

        <section className="section">
          <SectionHead eyebrow="Frequently bought together" title="Customers also bought" />
          <Rail>
            {alsoBought.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Rail>
        </section>
      </div>

      <div className="pdp-sticky">
        <div>
          <b className="small">{formatINR(product.price)}</b>
          <span className="xs strike faint"> {formatINR(product.mrp)}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => toggleWishlist(product)} aria-label="Wishlist">
          <Heart size={16} fill={wished ? "currentColor" : "none"} />
        </button>
        <button className="btn btn-sm grow" disabled={stock <= 0} onClick={add}>
          <ShoppingBag size={16} /> {inBag ? "Go to bag" : "Add to bag"}
        </button>
      </div>

      <Modal open={chart} onClose={() => setChart(false)} title="Size chart" size="mid">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {SIZE_CHART.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.rows.map((r) => (
                <tr key={r[0]} className={r[0] === size ? "hl" : ""}>
                  {r.map((c, i) => (
                    <td key={i}>{i === 0 ? <b>{c}</b> : c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice info mt-16">
          <Ruler size={16} /> Measure your chest at the fullest part, keeping the tape horizontal. Between sizes? Choose the larger one for a relaxed fit.
        </div>
      </Modal>
      <ShopTheLook key={look?.id} post={look} open={!!look} onClose={() => setLook(null)} />
    </div>
  );
}
