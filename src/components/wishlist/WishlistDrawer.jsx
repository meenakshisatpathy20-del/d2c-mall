import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  Heart,
  ShoppingBag,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import "./WishlistDrawer.css";

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN");

export default function WishlistDrawer({
  open = false,
  items = [],
  onClose,
  onRemove,
  onMoveToCart,
  onViewProduct,
  onBrowseAll,
}) {
  const wishlistItems = items || [];

  const availableItems = useMemo(
    () =>
      wishlistItems.filter(
        (item) =>
          item.stock === undefined ||
          item.stock === null ||
          item.stock > 0
      ),
    [wishlistItems]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="wishlist-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 34,
            }}
          >
            <header className="wishlist-header">
              <div>
                <span className="wishlist-kicker">
                  <Heart size={13} fill="currentColor" />
                  YOUR COLLECTION
                </span>

                <h2>
                  Wishlist{" "}
                  <small>
                    {wishlistItems.length}{" "}
                    {wishlistItems.length === 1
                      ? "item"
                      : "items"}
                  </small>
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close wishlist"
              >
                <X size={20} />
              </button>
            </header>

            {wishlistItems.length === 0 ? (
              <div className="wishlist-empty">
                <div className="wishlist-empty-icon">
                  <Heart size={27} />
                </div>

                <h3>Nothing saved yet</h3>

                <p>
                  Save products you love and come back to
                  them whenever you're ready.
                </p>

                <button
                  type="button"
                  onClick={onBrowseAll}
                >
                  Discover products
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="wishlist-content">
                  <div className="wishlist-summary">
                    <div>
                      <strong>
                        {wishlistItems.length}
                      </strong>
                      <span>saved</span>
                    </div>

                    <div>
                      <strong>
                        {availableItems.length}
                      </strong>
                      <span>available</span>
                    </div>

                    <div>
                      <Bell size={14} />
                      <span>
                        We'll show price changes
                      </span>
                    </div>
                  </div>

                  <div className="wishlist-items">
                    {wishlistItems.map((item) => {
                      const stock =
                        item.stock ??
                        item.availableStock ??
                        null;

                      const outOfStock =
                        stock !== null && stock <= 0;

                      const discount =
                        item.discount ??
                        (item.mrp > item.price
                          ? Math.round(
                              ((item.mrp -
                                item.price) /
                                item.mrp) *
                                100
                            )
                          : 0);

                      const image =
                        item.images?.[0] ||
                        item.image ||
                        "";

                      const reviewCount =
                        item.reviewCount ??
                        item.reviews ??
                        0;

                      return (
                        <article
                          className={`wishlist-item ${
                            outOfStock
                              ? "out-of-stock"
                              : ""
                          }`}
                          key={item.id}
                        >
                          <button
                            type="button"
                            className="wishlist-image"
                            onClick={() =>
                              onViewProduct?.(item)
                            }
                          >
                            <img
                              src={image}
                              alt={item.name}
                            />

                            {discount > 0 && (
                              <span>
                                {discount}% OFF
                              </span>
                            )}
                          </button>

                          <div className="wishlist-item-info">
                            <div className="wishlist-item-top">
                              <div>
                                <span>
                                  {item.brand}
                                </span>

                                <h3>
                                  {item.name}
                                </h3>
                              </div>

                              <button
                                type="button"
                                className="wishlist-remove"
                                onClick={() =>
                                  onRemove?.(item)
                                }
                                aria-label="Remove from wishlist"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {item.rating != null && (
                              <div className="wishlist-rating">
                                <span>
                                  ★ {item.rating}
                                </span>

                                {reviewCount != null && (
                                  <small>
                                    {Number(
                                      reviewCount
                                    ).toLocaleString(
                                      "en-IN"
                                    )}{" "}
                                    ratings
                                  </small>
                                )}
                              </div>
                            )}

                            <div className="wishlist-price">
                              <strong>
                                ₹{money(item.price)}
                              </strong>

                              {item.mrp >
                                item.price && (
                                <del>
                                  ₹{money(item.mrp)}
                                </del>
                              )}

                              {discount > 0 && (
                                <span>
                                  {discount}% off
                                </span>
                              )}
                            </div>

                            {item.previousPrice &&
                              item.previousPrice >
                                item.price && (
                                <div className="wishlist-price-drop">
                                  <Zap
                                    size={11}
                                    fill="currentColor"
                                  />
                                  Price dropped by ₹
                                  {money(
                                    item.previousPrice -
                                      item.price
                                  )}
                                </div>
                              )}

                            {outOfStock ? (
                              <div className="wishlist-stock-out">
                                Currently unavailable
                              </div>
                            ) : stock !== null &&
                              stock <= 8 ? (
                              <div className="wishlist-stock-low">
                                <Zap
                                  size={11}
                                  fill="currentColor"
                                />
                                Only {stock} left
                              </div>
                            ) : (
                              <div className="wishlist-stock">
                                <Check size={11} />
                                In stock
                              </div>
                            )}

                            <button
                              type="button"
                              className="wishlist-cart-button"
                              disabled={outOfStock}
                              onClick={() =>
                                onMoveToCart?.(item)
                              }
                            >
                              <ShoppingBag size={14} />
                              {outOfStock
                                ? "Notify Me"
                                : "Move to Cart"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <footer className="wishlist-footer">
                  <div>
                    <Heart
                      size={15}
                      fill="currentColor"
                    />

                    <span>
                      Your wishlist is synced with your
                      account.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onBrowseAll}
                  >
                    Continue shopping
                    <ArrowRight size={14} />
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}