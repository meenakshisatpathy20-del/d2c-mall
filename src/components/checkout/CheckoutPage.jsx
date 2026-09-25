import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useShop } from "../../context/ShopContext";
import "./CheckoutPage.css";

const FREE_SHIPPING_LIMIT = 999;

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const initialAddress = {
  fullName: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  type: "Home",
};

const PAYMENT_OPTIONS = [
  {
    id: "upi",
    title: "UPI",
    description: "Google Pay, PhonePe, Paytm and more",
    icon: Smartphone,
  },
  {
    id: "card",
    title: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay and more",
    icon: CreditCard,
  },
  {
    id: "netbanking",
    title: "Net Banking",
    description: "All major Indian banks",
    icon: Wallet,
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Package,
  },
];

export default function CheckoutPage({
  checkoutData,
  onBack,
  onPlaceOrder,
  onAddressSaved,
}) {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartMrpTotal,
    productSavings,
  } = useShop();

  const [address, setAddress] =
    useState(initialAddress);

  const [savedAddress, setSavedAddress] =
    useState(null);

  const [paymentMethod, setPaymentMethod] =
    useState("upi");

  const [coupon, setCoupon] = useState("");

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [couponMessage, setCouponMessage] =
    useState("");

  const [checkingDelivery, setCheckingDelivery] =
    useState(false);

  const [deliveryChecked, setDeliveryChecked] =
    useState(false);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [errors, setErrors] = useState({});

  const shipping = useMemo(() => {
    if (cartSubtotal === 0) return 0;

    return cartSubtotal >= FREE_SHIPPING_LIMIT
      ? 0
      : 49;
  }, [cartSubtotal]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;

    return Math.min(
      Math.round(
        cartSubtotal * appliedCoupon.percent
      ) / 100,
      appliedCoupon.maxDiscount
    );
  }, [cartSubtotal, appliedCoupon]);

  const grandTotal = Math.max(
    cartSubtotal +
      shipping -
      couponDiscount,
    0
  );

  const updateAddress = (field, value) => {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    if (field === "pincode") {
      setDeliveryChecked(false);
    }
  };

  const validateAddress = () => {
    const nextErrors = {};

    if (!address.fullName.trim()) {
      nextErrors.fullName =
        "Enter your full name";
    }

    if (!/^[6-9]\d{9}$/.test(address.phone)) {
      nextErrors.phone =
        "Enter a valid 10-digit mobile number";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        address.email
      )
    ) {
      nextErrors.email =
        "Enter a valid email address";
    }

    if (!address.addressLine.trim()) {
      nextErrors.addressLine =
        "Enter your address";
    }

    if (!address.city.trim()) {
      nextErrors.city = "Enter your city";
    }

    if (!address.state.trim()) {
      nextErrors.state = "Enter your state";
    }

    if (!/^\d{6}$/.test(address.pincode)) {
      nextErrors.pincode =
        "Enter a valid 6-digit pincode";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const checkDelivery = async () => {
    if (!/^\d{6}$/.test(address.pincode)) {
      setErrors((current) => ({
        ...current,
        pincode:
          "Enter a valid 6-digit pincode",
      }));

      return;
    }

    setCheckingDelivery(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 900)
    );

    setCheckingDelivery(false);
    setDeliveryChecked(true);
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      setCouponMessage(
        "Enter a coupon code"
      );
      return;
    }

    const coupons = {
      D2C10: {
        code: "D2C10",
        percent: 10,
        maxDiscount: 250,
      },
      FIRST15: {
        code: "FIRST15",
        percent: 15,
        maxDiscount: 500,
      },
    };

    const selected = coupons[code];

    if (!selected) {
      setAppliedCoupon(null);
      setCouponMessage(
        "This coupon is not available"
      );
      return;
    }

    if (cartSubtotal < 499) {
      setAppliedCoupon(null);
      setCouponMessage(
        "Add products worth ₹499 to use this coupon"
      );
      return;
    }

    setAppliedCoupon(selected);
    setCouponMessage(
      `${selected.code} applied successfully`
    );
  };

  const saveAddress = () => {
    if (!validateAddress()) return;

    setSavedAddress(address);
    onAddressSaved?.(address);
  };

  const handlePlaceOrder = async () => {
    if (!savedAddress) {
      const valid = validateAddress();

      if (!valid) return;

      setSavedAddress(address);
      onAddressSaved?.(address);
    }

    if (!deliveryChecked) {
      await checkDelivery();
      return;
    }

    setPlacingOrder(true);

    const orderPayload = {
      items: cart,
      customer: savedAddress || address,
      paymentMethod,
      coupon: appliedCoupon,
      pricing: {
        mrp: cartMrpTotal,
        productSavings,
        shipping,
        couponDiscount,
        total: grandTotal,
      },
    };

    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    onPlaceOrder?.(orderPayload);

    setPlacingOrder(false);
  };

  if (cart.length === 0) {
    return (
      <main className="checkout-page checkout-empty">
        <div className="checkout-empty-icon">
          <Package size={34} />
        </div>

        <span>CHECKOUT</span>

        <h1>Your cart is empty</h1>

        <p>
          Add products to your cart before
          continuing to checkout.
        </p>

        <button
          type="button"
          onClick={onBack}
        >
          Continue shopping
          <ChevronRight size={16} />
        </button>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <button
          type="button"
          onClick={onBack}
          className="checkout-back"
        >
          <ArrowLeft size={17} />
          Back to shopping
        </button>

        <div className="checkout-brand">
          <strong>D2C</strong>
          <span>MALL</span>
        </div>

        <div className="checkout-secure">
          <ShieldCheck size={16} />
          Secure Checkout
        </div>
      </header>

      <div className="checkout-progress">
        <div className="checkout-step active">
          <span>1</span>
          <div>
            <strong>Address</strong>
            <small>Delivery details</small>
          </div>
        </div>

        <div className="checkout-progress-line" />

        <div
          className={`checkout-step ${
            savedAddress
              ? "active"
              : ""
          }`}
        >
          <span>2</span>
          <div>
            <strong>Delivery</strong>
            <small>Serviceability & ETA</small>
          </div>
        </div>

        <div className="checkout-progress-line" />

        <div
          className={`checkout-step ${
            deliveryChecked
              ? "active"
              : ""
          }`}
        >
          <span>3</span>
          <div>
            <strong>Payment</strong>
            <small>Choose payment</small>
          </div>
        </div>
      </div>

      <div className="checkout-layout">
        <section className="checkout-main">
          <motion.section
            className="checkout-section"
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="checkout-section-heading">
              <div className="checkout-section-icon">
                <MapPin size={18} />
              </div>

              <div>
                <span>STEP 1</span>
                <h2>Delivery Address</h2>
                <p>
                  Where should we deliver your
                  order?
                </p>
              </div>
            </div>

            <div className="checkout-address-form">
              <label>
                Full name
                <input
                  value={address.fullName}
                  onChange={(event) =>
                    updateAddress(
                      "fullName",
                      event.target.value
                    )
                  }
                  placeholder="Enter full name"
                />
                {errors.fullName && (
                  <small>{errors.fullName}</small>
                )}
              </label>

              <label>
                Mobile number
                <input
                  value={address.phone}
                  onChange={(event) =>
                    updateAddress(
                      "phone",
                      event.target.value.replace(
                        /\D/g,
                        ""
                      ).slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                />
                {errors.phone && (
                  <small>{errors.phone}</small>
                )}
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={address.email}
                  onChange={(event) =>
                    updateAddress(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <small>{errors.email}</small>
                )}
              </label>

              <label className="checkout-full">
                Address
                <textarea
                  value={address.addressLine}
                  onChange={(event) =>
                    updateAddress(
                      "addressLine",
                      event.target.value
                    )
                  }
                  placeholder="House / flat / street / area"
                  rows={3}
                />
                {errors.addressLine && (
                  <small>
                    {errors.addressLine}
                  </small>
                )}
              </label>

              <label>
                City
                <input
                  value={address.city}
                  onChange={(event) =>
                    updateAddress(
                      "city",
                      event.target.value
                    )
                  }
                  placeholder="City"
                />
                {errors.city && (
                  <small>{errors.city}</small>
                )}
              </label>

              <label>
                State
                <input
                  value={address.state}
                  onChange={(event) =>
                    updateAddress(
                      "state",
                      event.target.value
                    )
                  }
                  placeholder="State"
                />
                {errors.state && (
                  <small>{errors.state}</small>
                )}
              </label>

              <label>
                Pincode
                <div className="checkout-pincode">
                  <input
                    value={address.pincode}
                    onChange={(event) =>
                      updateAddress(
                        "pincode",
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="6-digit pincode"
                  />

                  <button
                    type="button"
                    onClick={checkDelivery}
                    disabled={checkingDelivery}
                  >
                    {checkingDelivery
                      ? "Checking..."
                      : "Check"}
                  </button>
                </div>

                {errors.pincode && (
                  <small>
                    {errors.pincode}
                  </small>
                )}
              </label>

              <label>
                Landmark
                <input
                  value={address.landmark}
                  onChange={(event) =>
                    updateAddress(
                      "landmark",
                      event.target.value
                    )
                  }
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="checkout-address-types">
              {["Home", "Work", "Other"].map(
                (type) => (
                  <button
                    type="button"
                    key={type}
                    className={
                      address.type === type
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      updateAddress(
                        "type",
                        type
                      )
                    }
                  >
                    {type}
                  </button>
                )
              )}
            </div>

            {deliveryChecked && (
              <motion.div
                className="checkout-delivery-result"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <Check size={17} />
                </div>

                <section>
                  <strong>
                    Delivery available
                  </strong>

                  <p>
                    Your pincode is serviceable.
                    Delivery options will be
                    selected based on warehouse
                    stock and courier availability.
                  </p>
                </section>
              </motion.div>
            )}

            <button
              type="button"
              className="checkout-save-address"
              onClick={saveAddress}
            >
              {savedAddress
                ? "Address Saved"
                : "Save & Continue"}
              <ChevronRight size={16} />
            </button>
          </motion.section>

          <motion.section
            className="checkout-section"
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ delay: 0.08 }}
          >
            <div className="checkout-section-heading">
              <div className="checkout-section-icon">
                <Truck size={18} />
              </div>

              <div>
                <span>STEP 2</span>
                <h2>Delivery & Fulfilment</h2>
                <p>
                  Your order will be fulfilled
                  from the best available location.
                </p>
              </div>
            </div>

            <div className="checkout-delivery-card">
              <div className="checkout-delivery-icon">
                <Truck size={20} />
              </div>

              <div>
                <strong>
                  Standard Delivery
                </strong>

                <span>
                  Estimated delivery: 3–6
                  business days
                </span>

                <small>
                  Final ETA will be calculated
                  from warehouse stock,
                  destination and courier SLA.
                </small>
              </div>

              <strong>
                {shipping === 0
                  ? "FREE"
                  : `₹${money(shipping)}`}
              </strong>
            </div>

            <div className="checkout-confidence">
              <div>
                <Check size={15} />
                <span>
                  Stock availability checked
                </span>
              </div>

              <div>
                <Check size={15} />
                <span>
                  Courier serviceability checked
                </span>
              </div>

              <div>
                <Check size={15} />
                <span>
                  Delivery estimate calculated
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="checkout-section"
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ delay: 0.12 }}
          >
            <div className="checkout-section-heading">
              <div className="checkout-section-icon">
                <CreditCard size={18} />
              </div>

              <div>
                <span>STEP 3</span>
                <h2>Payment Method</h2>
                <p>
                  Choose how you'd like to pay.
                </p>
              </div>
            </div>

            <div className="checkout-payment-options">
              {PAYMENT_OPTIONS.map(
                (option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      type="button"
                      key={option.id}
                      className={`checkout-payment-option ${
                        paymentMethod ===
                        option.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setPaymentMethod(
                          option.id
                        )
                      }
                    >
                      <div className="checkout-payment-radio">
                        {paymentMethod ===
                          option.id && (
                          <span />
                        )}
                      </div>

                      <Icon size={19} />

                      <div>
                        <strong>
                          {option.title}
                        </strong>
                        <span>
                          {option.description}
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {paymentMethod === "cod" && (
              <div className="checkout-cod-note">
                Cash on Delivery availability
                will be confirmed against your
                delivery pincode and order value.
              </div>
            )}
          </motion.section>
        </section>

        <aside className="checkout-summary">
          <div className="checkout-summary-heading">
            <div>
              <span>YOUR ORDER</span>
              <h2>Order Summary</h2>
            </div>

            <strong>
              {cartCount} items
            </strong>
          </div>

          <div className="checkout-order-items">
            {cart.map((item) => {
              const image =
                item.images?.[0] ||
                item.image ||
                "";

              return (
                <div
                  className="checkout-order-item"
                  key={[
                    item.id,
                    item.selectedSize ||
                      "default",
                    item.selectedColor ||
                      "default",
                  ].join("__")}
                >
                  <div className="checkout-order-image">
                    <img
                      src={image}
                      alt={item.name}
                    />

                    <span>
                      {item.quantity}
                    </span>
                  </div>

                  <div>
                    <span>
                      {item.brand}
                    </span>

                    <strong>
                      {item.name}
                    </strong>

                    {(item.selectedSize ||
                      item.selectedColor) && (
                      <small>
                        {item.selectedSize &&
                          `Size ${item.selectedSize}`}
                        {item.selectedSize &&
                          item.selectedColor &&
                          " · "}
                        {item.selectedColor &&
                          item.selectedColor}
                      </small>
                    )}
                  </div>

                  <strong>
                    ₹
                    {money(
                      item.price *
                        item.quantity
                    )}
                  </strong>
                </div>
              );
            })}
          </div>

          <div className="checkout-coupon">
            <div>
              <input
                value={coupon}
                onChange={(event) => {
                  setCoupon(
                    event.target.value
                  );
                  setCouponMessage("");
                }}
                placeholder="Coupon code"
              />

              <button
                type="button"
                onClick={applyCoupon}
              >
                Apply
              </button>
            </div>

            {couponMessage && (
              <span
                className={
                  appliedCoupon
                    ? "success"
                    : "error"
                }
              >
                {couponMessage}
              </span>
            )}

            <small>
              Try D2C10 or FIRST15
            </small>
          </div>

          <div className="checkout-price-details">
            <div>
              <span>
                MRP ({cartCount} items)
              </span>

              <strong>
                ₹{money(cartMrpTotal)}
              </strong>
            </div>

            <div>
              <span>Product discount</span>

              <strong className="positive">
                -₹{money(productSavings)}
              </strong>
            </div>

            <div>
              <span>Shipping</span>

              <strong
                className={
                  shipping === 0
                    ? "positive"
                    : ""
                }
              >
                {shipping === 0
                  ? "FREE"
                  : `₹${money(shipping)}`}
              </strong>
            </div>

            {couponDiscount > 0 && (
              <div>
                <span>
                  Coupon discount
                </span>

                <strong className="positive">
                  -₹{money(couponDiscount)}
                </strong>
              </div>
            )}

            <div className="checkout-total">
              <span>Total</span>

              <strong>
                ₹{money(grandTotal)}
              </strong>
            </div>
          </div>

          <div className="checkout-saving">
            You're saving ₹
            {money(
              productSavings +
                couponDiscount
            )}{" "}
            on this order
          </div>

          <button
            type="button"
            className="checkout-place-order"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder
              ? "Processing..."
              : paymentMethod === "cod"
              ? "Place Order"
              : "Continue to Payment"}

            {!placingOrder && (
              <ChevronRight size={18} />
            )}
          </button>

          <div className="checkout-trust">
            <div>
              <ShieldCheck size={15} />
              Secure checkout
            </div>

            <div>
              <Check size={15} />
              Easy returns
            </div>

            <div>
              <Package size={15} />
              Genuine products
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}