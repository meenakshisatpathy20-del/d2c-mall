import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext";
import "./ProductDetailsPage.css";

const SAMPLE_PRODUCT = {
  id: "p101",
  brand: "Roadster",
  name: "Men Relaxed Fit Oversized T-Shirt",
  category: "Men",
  subCategory: "T-Shirts",
  price: 599,
  mrp: 1199,
  discount: 50,
  rating: 4.4,
  reviews: 1842,
  stock: 18,
  sizes: ["S", "M", "L", "XL"],
  colors: ["Black", "White", "Olive"],
  images: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=85",
    "https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=1000&q=85",
  ],
  tags: ["Trending", "Best Seller"],
  description:
    "A relaxed everyday silhouette designed for easy styling, breathable comfort and effortless streetwear looks.",
};

const SAMPLE_REVIEWS = [
  {
    id: 1,
    name: "Aarav",
    rating: 5,
    title: "Exactly what I wanted",
    text:
      "The fit is relaxed without looking oversized. Fabric feels good and the colour looks exactly like the pictures.",
    date: "2 days ago",
    helpful: 42,
  },
  {
    id: 2,
    name: "Riya",
    rating: 4,
    title: "Good quality",
    text:
      "Nice material and comfortable for everyday use. Size guide was accurate.",
    date: "5 days ago",
    helpful: 27,
  },
  {
    id: 3,
    name: "Kabir",
    rating: 5,
    title: "Great value",
    text:
      "Bought it during the sale and the quality is much better than expected.",
    date: "1 week ago",
    helpful: 19,
  },
];

const SAMPLE_REELS = [
  {
    id: 1,
    creator: "@stylewithriya",
    caption: "3 ways to style an oversized tee",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    creator: "@streetbyarjun",
    caption: "Weekend streetwear fit",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    creator: "@thefitjournal",
    caption: "Easy summer layering",
    image:
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80",
  },
];

const SAMPLE_SIMILAR = [
  {
    id: "p201",
    brand: "WROGN",
    name: "Men Printed Casual T-Shirt",
    price: 699,
    mrp: 1399,
    discount: 50,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "p202",
    brand: "HRX",
    name: "Men Solid Regular Fit T-Shirt",
    price: 549,
    mrp: 1099,
    discount: 50,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f37f2096?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "p203",
    brand: "Roadster",
    name: "Men Graphic Printed Tee",
    price: 629,
    mrp: 1299,
    discount: 52,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80",
  },
];

export default function ProductDetailsPage({
  product = SAMPLE_PRODUCT,
  reviews = SAMPLE_REVIEWS,
  reels = SAMPLE_REELS,
  similarProducts = SAMPLE_SIMILAR,
  onBack,
  onProductClick,
  onBuyNow,
}) {
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    addRecentlyViewed,
  } = useShop();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.[0] || null
  );
  const [selectedColor, setSelectedColor] = useState(
    product.colors?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [openInfo, setOpenInfo] = useState("description");
  const [likedReviews, setLikedReviews] = useState([]);
  const [added, setAdded] = useState(false);

  const images =
    product.images?.length > 0
      ? product.images
      : [product.image];

  const stock =
    product.stock ??
    product.availableStock ??
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

  const savings = Math.max(
    (product.mrp || product.price) -
      product.price,
    0
  );

  useEffect(() => {
    if (!product) return;

    addRecentlyViewed(product);

    setSelectedSize(product.sizes?.[0] || null);
    setSelectedColor(product.colors?.[0] || null);
    setQuantity(1);
    setActiveImage(0);
  }, [product?.id]);

  const handleAddToCart = () => {
    const success = addToCart(
      product,
      quantity,
      selectedSize,
      selectedColor
    );

    if (!success) return;

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    const success = addToCart(
      product,
      quantity,
      selectedSize,
      selectedColor
    );

    if (!success) return;

    onBuyNow?.({
      product,
      quantity,
      selectedSize,
      selectedColor,
    });
  };

  const checkDelivery = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setDelivery({
        success: false,
        message: "Enter a valid 6-digit pincode.",
      });
      return;
    }

    setDelivery({
      success: true,
      message: "Delivery available",
      eta: "Expected delivery in 2–4 days",
    });
  };

  const nextImage = () => {
    setActiveImage(
      (current) => (current + 1) % images.length
    );
  };

  const previousImage = () => {
    setActiveImage(
      (current) =>
        (current - 1 + images.length) %
        images.length
    );
  };

  const toggleReviewLike = (reviewId) => {
    setLikedReviews((current) =>
      current.includes(reviewId)
        ? current.filter((id) => id !== reviewId)
        : [...current, reviewId]
    );
  };

  return (
    <main className="product-details-page">
      <div className="product-page-topbar">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={15} />
          Back to shopping
        </button>

        <div>
          Home <span>/</span> {product.category}{" "}
          <span>/</span> {product.subCategory}
        </div>
      </div>

      <section className="product-main-section">
        <div className="product-gallery">
          <div className="product-thumbnails">
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={
                  activeImage === index ? "active" : ""
                }
                onClick={() => setActiveImage(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                />
              </button>
            ))}
          </div>

          <div className="product-main-image">
            <img
              src={images[activeImage]}
              alt={product.name}
            />

            {discount > 0 && (
              <span className="product-page-discount">
                {discount}% OFF
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-gallery-arrow left"
                  onClick={previousImage}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  className="product-gallery-arrow right"
                  onClick={nextImage}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <button
              type="button"
              className={`product-page-wishlist ${
                isWishlisted(product.id)
                  ? "active"
                  : ""
              }`}
              onClick={() => toggleWishlist(product)}
            >
              <Heart
                size={21}
                fill={
                  isWishlisted(product.id)
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>
        </div>

        <div className="product-information">
          <span className="product-brand">
            {product.brand}
          </span>

          <h1>{product.name}</h1>

          <p className="product-category-line">
            {product.category}
            {product.subCategory
              ? ` / ${product.subCategory}`
              : ""}
          </p>

          <div className="product-rating-line">
            <span>
              ★ {product.rating || "4.5"}
            </span>

            <strong>
              {Number(
                product.reviews || 0
              ).toLocaleString("en-IN")}
            </strong>

            <small>Ratings & Reviews</small>
          </div>

          <div className="product-price-block">
            <strong>
              ₹
              {Number(
                product.price
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
              <span>{discount}% OFF</span>
            )}
          </div>

          {savings > 0 && (
            <p className="product-saving">
              You save ₹
              {savings.toLocaleString("en-IN")} on this
              product
            </p>
          )}

          <div className="product-pulse">
            <div>
              <Zap size={14} fill="currentColor" />
              <strong>D2C Pulse</strong>
            </div>

            <span>
              Trending right now
            </span>
          </div>

          {product.sizes?.length > 0 && (
            <div className="product-choice">
              <div className="product-choice-heading">
                <strong>Select Size</strong>
                <button type="button">
                  Size Guide
                </button>
              </div>

              <div className="product-size-options">
                {product.sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    className={
                      selectedSize === size
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedSize(size)
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="product-choice">
              <div className="product-choice-heading">
                <strong>
                  Colour:{" "}
                  <span>{selectedColor}</span>
                </strong>
              </div>

              <div className="product-color-options">
                {product.colors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={
                      selectedColor === color
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedColor(color)
                    }
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-quantity">
            <strong>Quantity</strong>

            <div>
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity((value) =>
                    Math.max(value - 1, 1)
                  )
                }
              >
                <Minus size={14} />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                disabled={
                  stock > 0 &&
                  quantity >= stock
                }
                onClick={() =>
                  setQuantity((value) => value + 1)
                }
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="product-stock-status">
            {stock > 0 ? (
              <>
                <Check size={14} />
                {stock <= 8
                  ? `Only ${stock} left`
                  : "In stock and ready to ship"}
              </>
            ) : (
              "Currently unavailable"
            )}
          </div>

          <div className="product-delivery-box">
            <div className="product-delivery-title">
              <MapPin size={17} />

              <div>
                <strong>
                  Check delivery to your location
                </strong>

                <span>
                  Enter pincode for availability,
                  courier and ETA
                </span>
              </div>
            </div>

            <div className="product-pincode">
              <input
                value={pincode}
                maxLength={6}
                inputMode="numeric"
                placeholder="Enter pincode"
                onChange={(event) =>
                  setPincode(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
              />

              <button
                type="button"
                onClick={checkDelivery}
              >
                Check
              </button>
            </div>

            {delivery && (
              <div
                className={
                  delivery.success
                    ? "product-delivery-success"
                    : "product-delivery-error"
                }
              >
                {delivery.success && (
                  <Check size={14} />
                )}

                <span>
                  {delivery.message}

                  {delivery.eta && (
                    <>
                      <br />
                      {delivery.eta}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="product-action-row">
            <button
              type="button"
              className="product-add-cart"
              disabled={stock <= 0}
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <Check size={18} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart
                </>
              )}
            </button>

            <button
              type="button"
              className="product-buy-now"
              disabled={stock <= 0}
              onClick={handleBuyNow}
            >
              <Zap size={17} fill="currentColor" />
              Buy Now
            </button>

            <button
              type="button"
              className="product-share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: `Check out ${product.name} on D2C Mall`,
                    url: window.location.href,
                  });
                }
              }}
              aria-label="Share product"
            >
              <Share2 size={17} />
            </button>
          </div>

          <div className="product-trust-row">
            <div>
              <Truck size={15} />
              <span>
                Fast delivery
              </span>
            </div>

            <div>
              <Check size={15} />
              <span>
                Genuine product
              </span>
            </div>

            <div>
              <ArrowLeft
                size={15}
                style={{
                  transform: "rotate(180deg)",
                }}
              />
              <span>
                Easy returns
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="product-content-section">
        <div className="product-info-column">
          <div className="product-accordions">
            <Accordion
              title="Product Description"
              open={openInfo === "description"}
              onClick={() =>
                setOpenInfo(
                  openInfo === "description"
                    ? null
                    : "description"
                )
              }
            >
              <p>
                {product.description ||
                  "Designed for everyday comfort and easy styling. Check the size guide and product details before ordering."}
              </p>
            </Accordion>

            <Accordion
              title="About the Product"
              open={openInfo === "about"}
              onClick={() =>
                setOpenInfo(
                  openInfo === "about"
                    ? null
                    : "about"
                )
              }
            >
              <div className="product-spec-grid">
                <span>Brand</span>
                <strong>{product.brand}</strong>

                <span>Category</span>
                <strong>{product.category}</strong>

                <span>Fit</span>
                <strong>Relaxed</strong>

                <span>Occasion</span>
                <strong>Casual</strong>

                <span>Availability</span>
                <strong>
                  {stock > 0
                    ? "In Stock"
                    : "Unavailable"}
                </strong>
              </div>
            </Accordion>

            <Accordion
              title="Shipping & Returns"
              open={openInfo === "shipping"}
              onClick={() =>
                setOpenInfo(
                  openInfo === "shipping"
                    ? null
                    : "shipping"
                )
              }
            >
              <p>
                Delivery availability and ETA depend
                on your pincode, inventory location and
                courier serviceability. Return eligibility
                is determined by the product's return
                policy.
              </p>
            </Accordion>

            <Accordion
              title="Authenticity & Brand"
              open={openInfo === "authenticity"}
              onClick={() =>
                setOpenInfo(
                  openInfo === "authenticity"
                    ? null
                    : "authenticity"
                )
              }
            >
              <p>
                Product and brand information will be
                supplied from the D2C Mall product
                catalogue and merchant records.
              </p>
            </Accordion>
          </div>
        </div>

        <aside className="product-style-tip">
          <div className="style-tip-icon">
            <Sparkles size={18} />
          </div>

          <span>STYLE NOTE</span>

          <h3>
            Keep it relaxed.
          </h3>

          <p>
            Pair this silhouette with clean sneakers
            and straight-fit bottoms for an effortless
            everyday street look.
          </p>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("social-style")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            See styling inspiration
            <ArrowRight size={14} />
          </button>
        </aside>
      </section>

      <section
        className="product-social-section"
        id="social-style"
      >
        <div className="product-section-heading">
          <div>
            <span>D2C STREET</span>
            <h2>See it in real life</h2>
            <p>
              Discover how the community is styling
              this product.
            </p>
          </div>

          <button type="button">
            Explore all
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="product-reels">
          {reels.map((reel) => (
            <article
              className="product-reel"
              key={reel.id}
            >
              <img
                src={reel.image}
                alt={reel.caption}
              />

              <div className="product-reel-overlay">
                <span>{reel.creator}</span>
                <p>{reel.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-reviews-section">
        <div className="product-section-heading">
          <div>
            <span>COMMUNITY VOICE</span>
            <h2>Ratings & reviews</h2>
          </div>

          <div className="product-review-summary">
            <strong>{product.rating || 4.5}</strong>
            <div>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    fill="currentColor"
                  />
                ))}
              </div>

              <span>
                Based on{" "}
                {Number(
                  product.reviews || 0
                ).toLocaleString("en-IN")}{" "}
                ratings
              </span>
            </div>
          </div>
        </div>

        <div className="product-review-list">
          {reviews.map((review) => {
            const liked = likedReviews.includes(
              review.id
            );

            return (
              <article
                className="product-review"
                key={review.id}
              >
                <div className="review-user">
                  <div>
                    {review.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span>
                    {review.name}
                  </span>
                </div>

                <div className="review-main">
                  <div className="review-rating">
                    {Array.from({
                      length: review.rating,
                    }).map((_, index) => (
                      <Star
                        key={index}
                        size={11}
                        fill="currentColor"
                      />
                    ))}
                  </div>

                  <h3>{review.title}</h3>

                  <p>{review.text}</p>

                  <div className="review-footer">
                    <span>{review.date}</span>

                    <button
                      type="button"
                      className={
                        liked ? "liked" : ""
                      }
                      onClick={() =>
                        toggleReviewLike(
                          review.id
                        )
                      }
                    >
                      <ThumbsUp size={12} />
                      Helpful{" "}
                      {review.helpful +
                        (liked ? 1 : 0)}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="product-similar-section">
        <div className="product-section-heading">
          <div>
            <span>YOU MAY ALSO LIKE</span>
            <h2>Complete the look</h2>
          </div>
        </div>

        <div className="similar-product-grid">
          {similarProducts.map((item) => (
            <button
              type="button"
              className="similar-product-card"
              key={item.id}
              onClick={() =>
                onProductClick?.(item)
              }
            >
              <div>
                <img
                  src={item.image}
                  alt={item.name}
                />

                <span>
                  {item.discount}% OFF
                </span>
              </div>

              <p>{item.brand}</p>

              <h3>{item.name}</h3>

              <div>
                <strong>
                  ₹
                  {Number(
                    item.price
                  ).toLocaleString("en-IN")}
                </strong>

                <del>
                  ₹
                  {Number(
                    item.mrp
                  ).toLocaleString("en-IN")}
                </del>
              </div>

              <small>
                ★ {item.rating}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="shop-look-section">
        <div className="shop-look-copy">
          <span>SHOP THE LOOK</span>

          <h2>
            One product.
            <br />
            Multiple possibilities.
          </h2>

          <p>
            Build the full look from products
            discovered together by the D2C community.
          </p>

          <button type="button">
            Shop this look
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="shop-look-image">
          <img
            src={
              images[0]
            }
            alt="Shop the look"
          />

          <span className="look-pin pin-one">
            <i />
            Tee
          </span>

          <span className="look-pin pin-two">
            <i />
            Sneakers
          </span>

          <span className="look-pin pin-three">
            <i />
            Accessories
          </span>
        </div>
      </section>
    </main>
  );
}

function Accordion({
  title,
  open,
  onClick,
  children,
}) {
  return (
    <div
      className={`product-accordion ${
        open ? "open" : ""
      }`}
    >
      <button type="button" onClick={onClick}>
        <span>{title}</span>
        <ChevronDown size={17} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="accordion-content"
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}