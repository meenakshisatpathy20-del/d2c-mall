import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useShop } from "../../context/ShopContext";
import "./ProductQuickView.css";

export default function ProductQuickView({
  product,
  open = false,
  onClose,
  onBuyNow,
  onViewDetails,
}) {
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    addRecentlyViewed,
  } = useShop();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(
    product?.sizes?.[0] || null
  );
  const [selectedColor, setSelectedColor] = useState(
    product?.colors?.[0] || null
  );
  const [activeImage, setActiveImage] = useState(0);
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product || !open) return;

    setQuantity(1);
    setSelectedSize(product.sizes?.[0] || null);
    setSelectedColor(product.colors?.[0] || null);
    setActiveImage(0);
    setPincode("");
    setDelivery(null);
    setAdded(false);

    addRecentlyViewed(product);
  }, [product?.id, open]);

  if (!product) return null;

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

  const handleAddToCart = () => {
    const success = addToCart(
      product,
      quantity,
      selectedSize,
      selectedColor
    );

    if (!success) return;

    setAdded(true);

    window.setTimeout(() => {
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

    /*
     * Temporary UI simulation.
     *
     * Final version:
     * pincode → backend → serviceability →
     * nearest warehouse → courier → ETA
     */
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="quickview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.section
            className="quickview-modal"
            initial={{
              opacity: 0,
              scale: 0.97,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 12,
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <button
              type="button"
              className="quickview-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="quickview-gallery">
              <div className="quickview-thumbnails">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={
                      activeImage === index
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveImage(index)
                    }
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                    />
                  </button>
                ))}
              </div>

              <div className="quickview-main-image">
                <img
                  src={images[activeImage]}
                  alt={product.name}
                />

                {discount > 0 && (
                  <span className="quickview-discount">
                    {discount}% OFF
                  </span>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="quickview-image-arrow left"
                      onClick={previousImage}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      className="quickview-image-arrow right"
                      onClick={nextImage}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className={`quickview-heart ${
                    isWishlisted(product.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleWishlist(product)
                  }
                  aria-label="Wishlist"
                >
                  <Heart
                    size={19}
                    fill={
                      isWishlisted(product.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              </div>
            </div>

            <div className="quickview-details">
              <div className="quickview-brand">
                {product.brand}
              </div>

              <h2>{product.name}</h2>

              {product.category && (
                <div className="quickview-category">
                  {product.category}
                  {product.subCategory
                    ? ` / ${product.subCategory}`
                    : ""}
                </div>
              )}

              <div className="quickview-rating-row">
                <span>
                  ★ {product.rating || "4.5"}
                </span>

                <small>
                  {Number(
                    product.reviews || 0
                  ).toLocaleString("en-IN")}{" "}
                  ratings
                </small>
              </div>

              <div className="quickview-price">
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
                  <span>{discount}% OFF</span>
                )}
              </div>

              {savings > 0 && (
                <p className="quickview-saving">
                  You save ₹
                  {savings.toLocaleString("en-IN")}
                </p>
              )}

              {product.tags?.length > 0 && (
                <div className="quickview-tags">
                  {product.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}

              {product.sizes?.length > 0 && (
                <div className="quickview-option">
                  <div>
                    <strong>Select Size</strong>
                    <button type="button">
                      Size Guide
                    </button>
                  </div>

                  <div className="quickview-size-list">
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
                <div className="quickview-option">
                  <div>
                    <strong>
                      Colour:{" "}
                      <span>{selectedColor}</span>
                    </strong>
                  </div>

                  <div className="quickview-color-list">
                    {product.colors.map(
                      (color) => (
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
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="quickview-stock">
                {stock > 0 ? (
                  <>
                    <Check size={13} />
                    {stock <= 8
                      ? `Only ${stock} left`
                      : "In stock"}
                  </>
                ) : (
                  "Currently unavailable"
                )}
              </div>

              <div className="quickview-quantity">
                <strong>Quantity</strong>

                <div>
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity(
                        (value) =>
                          Math.max(value - 1, 1)
                      )
                    }
                  >
                    <Minus size={13} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    disabled={
                      stock > 0 &&
                      quantity >= stock
                    }
                    onClick={() =>
                      setQuantity(
                        (value) => value + 1
                      )
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="quickview-delivery">
                <div className="delivery-heading">
                  <MapPin size={15} />

                  <div>
                    <strong>
                      Check delivery
                    </strong>

                    <span>
                      Enter your pincode for ETA
                    </span>
                  </div>
                </div>

                <div className="delivery-input">
                  <input
                    value={pincode}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(event) =>
                      setPincode(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="Enter pincode"
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
                        ? "delivery-success"
                        : "delivery-error"
                    }
                  >
                    {delivery.success && (
                      <Check size={13} />
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

              <div className="quickview-actions">
                <button
                  type="button"
                  className="quickview-add"
                  disabled={stock <= 0}
                  onClick={handleAddToCart}
                >
                  {added ? (
                    <>
                      <Check size={17} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={17} />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="quickview-buy"
                  disabled={stock <= 0}
                  onClick={handleBuyNow}
                >
                  <Zap
                    size={16}
                    fill="currentColor"
                  />
                  Buy Now
                </button>
              </div>

              <button
                type="button"
                className="quickview-full-details"
                onClick={() =>
                  onViewDetails?.(product)
                }
              >
                <Sparkles size={14} />
                View full product details
                <ArrowRight size={14} />
              </button>

              <div className="quickview-trust">
                <div>
                  <Check size={13} />
                  <span>
                    Genuine products
                  </span>
                </div>

                <div>
                  <Check size={13} />
                  <span>
                    Easy returns
                  </span>
                </div>

                <div>
                  <Check size={13} />
                  <span>
                    Secure checkout
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}