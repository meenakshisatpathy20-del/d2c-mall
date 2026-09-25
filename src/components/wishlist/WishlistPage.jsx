import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { useShop } from "../../context/ShopContext";
import "./WishlistPage.css";

export default function WishlistPage({
  onProductClick,
  onContinueShopping,
}) {
  const {
    wishlist,
    wishlistCount,
    toggleWishlist,
    moveWishlistToCart,
    addToCart,
  } = useShop();

  const handleMoveAllToCart = () => {
    wishlist.forEach((product) => {
      const stock =
        product.stock ??
        product.availableStock ??
        0;

      if (stock > 0) {
        addToCart(product, 1);
      }
    });
  };

  if (wishlist.length === 0) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-page-empty">
          <div className="wishlist-page-heart">
            <Heart size={32} />
          </div>

          <span>YOUR SAVED COLLECTION</span>

          <h1>Your wishlist is empty</h1>

          <p>
            Save products you love and build your own
            collection. We'll keep them here until
            you're ready to shop.
          </p>

          <button
            type="button"
            onClick={onContinueShopping}
          >
            Discover products
            <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-page-heading">
        <div>
          <div className="wishlist-page-breadcrumb">
            Home <span>/</span> Wishlist
          </div>

          <p>YOUR COLLECTION</p>

          <h1>
            Wishlist{" "}
            <small>
              {wishlistCount}{" "}
              {wishlistCount === 1
                ? "item"
                : "items"}
            </small>
          </h1>

          <span>
            Products you've saved for later.
          </span>
        </div>

        <button
          type="button"
          className="wishlist-move-all"
          onClick={handleMoveAllToCart}
        >
          <ShoppingBag size={15} />
          Move available to cart
        </button>
      </section>

      <section className="wishlist-page-tools">
        <div>
          <strong>{wishlistCount}</strong>
          <span>saved products</span>
        </div>

        <div>
          <Check size={14} />
          <span>
            We'll keep your saved products here
          </span>
        </div>
      </section>

      <section className="wishlist-page-grid">
        {wishlist.map((product, index) => {
          const stock =
            product.stock ??
            product.availableStock ??
            0;

          const outOfStock = stock <= 0;

          const discount =
            product.discount ??
            (product.mrp > product.price
              ? Math.round(
                  ((product.mrp - product.price) /
                    product.mrp) *
                    100
                )
              : 0);

          const image =
            product.images?.[0] ||
            product.image ||
            "";

          const reviewCount =
            product.reviewCount ??
            product.reviews ??
            0;

          return (
            <motion.article
              key={product.id}
              className="wishlist-page-card"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.25,
                delay: Math.min(
                  index * 0.04,
                  0.25
                ),
              }}
            >
              <button
                type="button"
                className="wishlist-page-image"
                onClick={() =>
                  onProductClick?.(product)
                }
              >
                <img
                  src={image}
                  alt={product.name}
                />

                {discount > 0 && (
                  <span>
                    {discount}% OFF
                  </span>
                )}

                {outOfStock && (
                  <div className="wishlist-sold-overlay">
                    Currently unavailable
                  </div>
                )}
              </button>

              <div className="wishlist-page-card-info">
                <div className="wishlist-page-card-top">
                  <div>
                    <span>{product.brand}</span>

                    <h2>{product.name}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleWishlist(product)
                    }
                    aria-label="Remove from wishlist"
                  >
                    <Heart
                      size={17}
                      fill="currentColor"
                    />
                  </button>
                </div>

                {product.rating != null && (
                  <div className="wishlist-page-rating">
                    <span>
                      ★ {product.rating}
                    </span>

                    <small>
                      {Number(
                        reviewCount
                      ).toLocaleString("en-IN")}{" "}
                      ratings
                    </small>
                  </div>
                )}

                <div className="wishlist-page-price">
                  <strong>
                    ₹
                    {Number(
                      product.price || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                  {product.mrp >
                    product.price && (
                    <del>
                      ₹
                      {Number(
                        product.mrp
                      ).toLocaleString("en-IN")}
                    </del>
                  )}

                  {discount > 0 && (
                    <span>
                      {discount}% off
                    </span>
                  )}
                </div>

                {outOfStock ? (
                  <button
                    type="button"
                    className="wishlist-notify"
                  >
                    Notify when available
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wishlist-move"
                    onClick={() =>
                      moveWishlistToCart(product)
                    }
                  >
                    <ShoppingBag size={14} />
                    Move to Cart
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="wishlist-discovery">
        <div>
          <span>D2C DISCOVERY</span>

          <h2>
            Your next favourite could be
            waiting.
          </h2>

          <p>
            Explore new drops, trending products and
            community picks across D2C Mall.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinueShopping}
        >
          Continue shopping
          <ArrowRight size={15} />
        </button>
      </section>
    </main>
  );
}