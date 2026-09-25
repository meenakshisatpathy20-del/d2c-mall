import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { useShop } from "../../context/ShopContext";
import "./CartDrawer.css";

const FREE_SHIPPING_LIMIT = 999;

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN");

export default function CartDrawer({
  open,
  onClose,
  onCheckout,
  onViewProduct,
}) {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartMrpTotal,
    productSavings,
    incrementCartItem,
    decrementCartItem,
    removeFromCart,
  } = useShop();

  const shipping = useMemo(() => {
    if (cartSubtotal === 0) return 0;

    return cartSubtotal >= FREE_SHIPPING_LIMIT
      ? 0
      : 49;
  }, [cartSubtotal]);

  const grandTotal = cartSubtotal + shipping;

  const amountForFreeShipping = Math.max(
    FREE_SHIPPING_LIMIT - cartSubtotal,
    0
  );

  const freeShippingProgress = Math.min(
    (cartSubtotal / FREE_SHIPPING_LIMIT) * 100,
    100
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 340,
              damping: 34,
            }}
          >
            <header className="cart-header">
              <div>
                <span className="cart-kicker">
                  <ShoppingBag size={12} />
                  YOUR BAG
                </span>

                <h2>
                  Shopping Cart{" "}
                  <small>
                    {cartCount}{" "}
                    {cartCount === 1
                      ? "item"
                      : "items"}
                  </small>
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </header>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">
                  <ShoppingBag size={27} />
                </div>

                <h3>Your bag is waiting</h3>

                <p>
                  Discover products, save your favourites
                  and add something you love.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                >
                  Start shopping
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="cart-content">
                  <div className="cart-shipping-banner">
                    {amountForFreeShipping > 0 ? (
                      <>
                        <div>
                          <span>
                            Add ₹
                            {money(
                              amountForFreeShipping
                            )}{" "}
                            more for FREE delivery
                          </span>

                          <span>
                            ₹{money(cartSubtotal)} / ₹
                            {money(
                              FREE_SHIPPING_LIMIT
                            )}
                          </span>
                        </div>

                        <div className="shipping-progress">
                          <span
                            style={{
                              width: `${freeShippingProgress}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="shipping-unlocked">
                        <Check size={14} />
                        Free delivery unlocked
                      </div>
                    )}
                  </div>

                  <div className="cart-items">
                    {cart.map((item) => {
                      const cartKey = [
                        item.id,
                        item.selectedSize ||
                          "default-size",
                        item.selectedColor ||
                          "default-color",
                      ].join("__");

                      const stock =
                        item.stock ??
                        item.availableStock ??
                        Infinity;

                      const image =
                        item.images?.[0] ||
                        item.image ||
                        "";

                      return (
                        <article
                          className="cart-item"
                          key={cartKey}
                        >
                          <button
                            type="button"
                            className="cart-item-image"
                            onClick={() =>
                              onViewProduct?.(item)
                            }
                          >
                            <img
                              src={image}
                              alt={item.name}
                            />
                          </button>

                          <div className="cart-item-info">
                            <div className="cart-item-top">
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
                                className="cart-remove"
                                onClick={() =>
                                  removeFromCart(
                                    cartKey
                                  )
                                }
                                aria-label="Remove item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {(item.selectedSize ||
                              item.selectedColor) && (
                              <div className="cart-variants">
                                {item.selectedSize && (
                                  <span>
                                    Size:{" "}
                                    <strong>
                                      {
                                        item.selectedSize
                                      }
                                    </strong>
                                  </span>
                                )}

                                {item.selectedColor && (
                                  <span>
                                    Colour:{" "}
                                    <strong>
                                      {
                                        item.selectedColor
                                      }
                                    </strong>
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="cart-item-price">
                              <strong>
                                ₹{money(item.price)}
                              </strong>

                              {item.mrp >
                                item.price && (
                                <del>
                                  ₹
                                  {money(
                                    item.mrp
                                  )}
                                </del>
                              )}
                            </div>

                            <div className="cart-item-bottom">
                              <div className="cart-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decrementCartItem(
                                      cartKey
                                    )
                                  }
                                >
                                  <Minus size={12} />
                                </button>

                                <span>
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    item.quantity >=
                                    stock
                                  }
                                  onClick={() =>
                                    incrementCartItem(
                                      cartKey
                                    )
                                  }
                                >
                                  <Plus size={12} />
                                </button>
                              </div>

                              {stock <= 8 && (
                                <span className="cart-stock">
                                  Only {stock} left
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="cart-benefits">
                    <div>
                      <Check size={14} />
                      <span>
                        Genuine products
                      </span>
                    </div>

                    <div>
                      <Check size={14} />
                      <span>
                        Easy returns
                      </span>
                    </div>

                    <div>
                      <Check size={14} />
                      <span>
                        Secure payments
                      </span>
                    </div>
                  </div>

                  <section className="cart-summary">
                    <div className="cart-summary-heading">
                      <h3>Price Details</h3>
                    </div>

                    <div>
                      <span>
                        MRP{" "}
                        <small>
                          ({cartCount} items)
                        </small>
                      </span>

                      <strong>
                        ₹{money(cartMrpTotal)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Product discount
                      </span>

                      <strong className="cart-green">
                        -₹{money(productSavings)}
                      </strong>
                    </div>

                    <div>
                      <span>Shipping</span>

                      <strong
                        className={
                          shipping === 0
                            ? "cart-green"
                            : ""
                        }
                      >
                        {shipping === 0
                          ? "FREE"
                          : `₹${money(shipping)}`}
                      </strong>
                    </div>

                    <div className="cart-total-row">
                      <span>Total Amount</span>

                      <strong>
                        ₹{money(grandTotal)}
                      </strong>
                    </div>

                    {productSavings > 0 && (
                      <div className="cart-you-save">
                        You are saving ₹
                        {money(productSavings)} on this
                        order
                      </div>
                    )}
                  </section>
                </div>

                <footer className="cart-footer">
                  <div className="cart-footer-total">
                    <span>Total</span>

                    <strong>
                      ₹{money(grandTotal)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="cart-checkout"
                    onClick={() =>
                      onCheckout?.({
                        items: cart,
                        subtotal: cartSubtotal,
                        shipping,
                        total: grandTotal,
                      })
                    }
                  >
                    Proceed to Checkout
                    <ChevronRight size={17} />
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