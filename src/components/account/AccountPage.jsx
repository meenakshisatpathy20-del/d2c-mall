import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./AccountPage.css";

const INITIAL_USER = {
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  phone: "+91 9876543210",
  gender: "Female",
  birthday: "15 August",
};

const INITIAL_ADDRESSES = [
  {
    id: "ADDR-01",
    type: "Home",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    line1: "24 Lake View Road",
    line2: "Morabadi",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834008",
    default: true,
  },
  {
    id: "ADDR-02",
    type: "Work",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    line1: "Business Park, Main Road",
    line2: "Harmu",
    city: "Ranchi",
    state: "Jharkhand",
    pincode: "834001",
    default: false,
  },
];

const ACCOUNT_MENU = [
  {
    id: "profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    id: "orders",
    label: "My Orders",
    icon: Package,
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  },
];

function AddressCard({
  address,
  onEdit,
  onDelete,
  onDefault,
}) {
  return (
    <article className="account-address-card">
      <div className="account-address-top">
        <div>
          <span className="account-address-type">
            {address.type}
          </span>

          {address.default && (
            <span className="account-default-badge">
              DEFAULT
            </span>
          )}
        </div>

        <div className="account-address-actions">
          <button
            type="button"
            onClick={() => onEdit?.(address)}
            aria-label="Edit address"
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(address.id)}
            aria-label="Delete address"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <strong>{address.name}</strong>

      <p>
        {address.line1}
        <br />
        {address.line2}
        <br />
        {address.city}, {address.state} -{" "}
        {address.pincode}
      </p>

      <span className="account-address-phone">
        {address.phone}
      </span>

      {!address.default && (
        <button
          type="button"
          className="account-make-default"
          onClick={() => onDefault?.(address.id)}
        >
          Make default
        </button>
      )}
    </article>
  );
}

function AddressModal({
  address,
  onClose,
  onSave,
}) {
  const editing = Boolean(address?.id);

  const [form, setForm] = useState(
    address || {
      type: "Home",
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      default: false,
    }
  );

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <motion.div
      className="account-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="account-address-modal"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <header>
          <div>
            <span>
              DELIVERY ADDRESS
            </span>
            <h2>
              {editing
                ? "Edit address"
                : "Add new address"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </header>

        <div className="account-address-form">
          <div className="account-address-type-selector">
            {["Home", "Work", "Other"].map(
              (type) => (
                <button
                  type="button"
                  key={type}
                  className={
                    form.type === type
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    update("type", type)
                  }
                >
                  {type}
                </button>
              )
            )}
          </div>

          <div className="account-form-grid">
            <label>
              <span>Full name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  update(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Full name"
              />
            </label>

            <label>
              <span>Phone number</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  update(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="+91"
              />
            </label>

            <label>
              <span>Pincode</span>
              <input
                value={form.pincode}
                onChange={(event) =>
                  update(
                    "pincode",
                    event.target.value
                  )
                }
                placeholder="6 digit pincode"
              />
            </label>

            <label>
              <span>City</span>
              <input
                value={form.city}
                onChange={(event) =>
                  update(
                    "city",
                    event.target.value
                  )
                }
                placeholder="City"
              />
            </label>

            <label className="full">
              <span>Address</span>
              <input
                value={form.line1}
                onChange={(event) =>
                  update(
                    "line1",
                    event.target.value
                  )
                }
                placeholder="House number, street, area"
              />
            </label>

            <label className="full">
              <span>Landmark / Area</span>
              <input
                value={form.line2}
                onChange={(event) =>
                  update(
                    "line2",
                    event.target.value
                  )
                }
                placeholder="Landmark, locality"
              />
            </label>

            <label>
              <span>State</span>
              <input
                value={form.state}
                onChange={(event) =>
                  update(
                    "state",
                    event.target.value
                  )
                }
                placeholder="State"
              />
            </label>
          </div>

          <label className="account-default-checkbox">
            <input
              type="checkbox"
              checked={form.default}
              onChange={(event) =>
                update(
                  "default",
                  event.target.checked
                )
              }
            />
            <span>
              Make this my default address
            </span>
          </label>
        </div>

        <footer>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary"
            onClick={() => onSave?.(form)}
          >
            {editing
              ? "Save Changes"
              : "Add Address"}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

function ProfileSection({
  user,
  onSave,
}) {
  const [editing, setEditing] =
    useState(false);

  const [form, setForm] =
    useState(user);

  const update = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <section className="account-content-section">
      <div className="account-section-heading">
        <div>
          <span>PERSONAL INFORMATION</span>
          <h2>Profile</h2>
          <p>
            Manage your personal details and preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (editing) {
              onSave?.(form);
            }

            setEditing(
              (current) => !current
            );
          }}
        >
          <Pencil size={14} />
          {editing
            ? "Save"
            : "Edit Profile"}
        </button>
      </div>

      <div className="account-profile-card">
        <div className="account-profile-avatar">
          {user.name
            .split(" ")
            .map(
              (item) =>
                item[0]
            )
            .join("")
            .slice(0, 2)}
        </div>

        <div className="account-profile-main">
          <strong>
            {user.name}
          </strong>

          <span>
            {user.email}
          </span>

          <span>
            {user.phone}
          </span>
        </div>

        <div className="account-member-badge">
          <ShieldCheck size={14} />
          Verified account
        </div>
      </div>

      <div className="account-form-grid profile-fields">
        <label>
          <span>Full name</span>
          <input
            disabled={!editing}
            value={form.name}
            onChange={(event) =>
              update(
                "name",
                event.target.value
              )
            }
          />
        </label>

        <label>
          <span>Email</span>
          <input
            disabled={!editing}
            value={form.email}
            onChange={(event) =>
              update(
                "email",
                event.target.value
              )
            }
          />
        </label>

        <label>
          <span>Phone number</span>
          <input
            disabled={!editing}
            value={form.phone}
            onChange={(event) =>
              update(
                "phone",
                event.target.value
              )
            }
          />
        </label>

        <label>
          <span>Gender</span>
          <select
            disabled={!editing}
            value={form.gender}
            onChange={(event) =>
              update(
                "gender",
                event.target.value
              )
            }
          >
            <option>
              Female
            </option>
            <option>
              Male
            </option>
            <option>
              Other
            </option>
            <option>
              Prefer not to say
            </option>
          </select>
        </label>

        <label>
          <span>Birthday</span>
          <input
            disabled={!editing}
            value={form.birthday}
            onChange={(event) =>
              update(
                "birthday",
                event.target.value
              )
            }
          />
        </label>
      </div>
    </section>
  );
}

function OrdersOverview({
  onNavigate,
}) {
  const orders = [
    {
      id: "D2C24090841",
      date: "23 Sep 2026",
      product: "Relaxed Fit Cotton Shirt",
      amount: 899,
      status: "Processing",
    },
    {
      id: "D2C24089116",
      date: "20 Sep 2026",
      product: "Hydrating Glow Face Serum",
      amount: 549,
      status: "Delivered",
    },
    {
      id: "D2C24088432",
      date: "18 Sep 2026",
      product: "Everyday Street Sneakers",
      amount: 1499,
      status: "Shipped",
    },
  ];

  return (
    <section className="account-content-section">
      <div className="account-section-heading">
        <div>
          <span>SHOPPING ACTIVITY</span>
          <h2>My Orders</h2>
          <p>
            Track recent purchases and manage returns.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onNavigate?.("orders")
          }
        >
          View All
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="account-order-list">
        {orders.map((order) => (
          <article
            key={order.id}
            className="account-order-row"
          >
            <div className="account-order-icon">
              <Package size={18} />
            </div>

            <div className="account-order-info">
              <strong>
                {order.product}
              </strong>
              <span>
                Order {order.id}
              </span>
              <small>
                {order.date}
              </small>
            </div>

            <strong className="account-order-price">
              ₹
              {order.amount.toLocaleString(
                "en-IN"
              )}
            </strong>

            <span
              className={`account-order-status ${order.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {order.status}
            </span>

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "orders"
                )
              }
            >
              <ChevronRight
                size={16}
              />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaymentsSection() {
  const methods = [
    {
      type: "UPI",
      value: "priya@upi",
      icon: Wallet,
    },
    {
      type: "Visa",
      value: "•••• 4821",
      icon: CreditCard,
    },
  ];

  return (
    <section className="account-content-section">
      <div className="account-section-heading">
        <div>
          <span>PAYMENT METHODS</span>
          <h2>Payments</h2>
          <p>
            Manage your saved payment preferences.
          </p>
        </div>

        <button type="button">
          <Plus size={14} />
          Add Method
        </button>
      </div>

      <div className="account-payment-list">
        {methods.map(
          ({
            type,
            value,
            icon: Icon,
          }) => (
            <article
              key={type}
              className="account-payment-card"
            >
              <div className="account-payment-icon">
                <Icon size={18} />
              </div>

              <div>
                <strong>
                  {type}
                </strong>
                <span>
                  {value}
                </span>
              </div>

              <button type="button">
                Remove
              </button>
            </article>
          )
        )}
      </div>

      <div className="account-payment-note">
        <ShieldCheck size={16} />
        <span>
          Payment information is securely handled by
          the payment provider during checkout.
        </span>
      </div>
    </section>
  );
}

function NotificationsSection() {
  const [preferences, setPreferences] =
    useState({
      orders: true,
      offers: true,
      recommendations: true,
      social: false,
    });

  const toggle = (key) => {
    setPreferences(
      (current) => ({
        ...current,
        [key]: !current[key],
      })
    );
  };

  return (
    <section className="account-content-section">
      <div className="account-section-heading">
        <div>
          <span>COMMUNICATION</span>
          <h2>Notifications</h2>
          <p>
            Choose what updates you want to receive.
          </p>
        </div>
      </div>

      <div className="account-notification-list">
        {[
          [
            "orders",
            "Order updates",
            "Shipping, delivery and return notifications.",
          ],
          [
            "offers",
            "Deals & offers",
            "Sale alerts, coupons and limited-time offers.",
          ],
          [
            "recommendations",
            "Recommendations",
            "Personalised products and shopping suggestions.",
          ],
          [
            "social",
            "D2C Street",
            "Updates from creators and community activity.",
          ],
        ].map(
          ([key, title, text]) => (
            <div
              className="account-notification-row"
              key={key}
            >
              <div>
                <strong>
                  {title}
                </strong>
                <span>
                  {text}
                </span>
              </div>

              <button
                type="button"
                className={
                  preferences[key]
                    ? "active"
                    : ""
                }
                onClick={() =>
                  toggle(key)
                }
                aria-label={`Toggle ${title}`}
              >
                <i />
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function SettingsSection() {
  return (
    <section className="account-content-section">
      <div className="account-section-heading">
        <div>
          <span>ACCOUNT CONTROLS</span>
          <h2>Settings</h2>
          <p>
            Security, privacy and account preferences.
          </p>
        </div>
      </div>

      <div className="account-settings-list">
        <button type="button">
          <div>
            <ShieldCheck size={17} />
          </div>
          <span>
            <strong>Password & Security</strong>
            <small>
              Manage login and security settings
            </small>
          </span>
          <ChevronRight size={16} />
        </button>

        <button type="button">
          <div>
            <Bell size={17} />
          </div>
          <span>
            <strong>Communication Preferences</strong>
            <small>
              Control email, SMS and WhatsApp updates
            </small>
          </span>
          <ChevronRight size={16} />
        </button>

        <button type="button">
          <div>
            <Clock3 size={17} />
          </div>
          <span>
            <strong>Recently Viewed</strong>
            <small>
              Manage products you recently explored
            </small>
          </span>
          <ChevronRight size={16} />
        </button>
      </div>

      <button
        type="button"
        className="account-logout"
      >
        <LogOut size={15} />
        Log out
      </button>
    </section>
  );
}

export default function AccountPage({
  user: externalUser,
  addresses: externalAddresses,
  onProfileSave,
  onAddressSave,
  onAddressDelete,
  onDefaultAddress,
  onNavigate,
}) {
  const [user, setUser] =
    useState(
      externalUser ||
        INITIAL_USER
    );

  const [addresses, setAddresses] =
    useState(
      externalAddresses ||
        INITIAL_ADDRESSES
    );

  const [activeSection, setActiveSection] =
    useState("profile");

  const [addressModal, setAddressModal] =
    useState(null);

  const updateProfile = async (
    nextUser
  ) => {
    setUser(nextUser);
    await onProfileSave?.(
      nextUser
    );
  };

  const saveAddress = async (
    nextAddress
  ) => {
    const address = {
      ...nextAddress,
      id:
        nextAddress.id ||
        `ADDR-${Date.now()}`,
    };

    setAddresses(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.id ===
              address.id
          );

        let next = exists
          ? current.map(
              (item) =>
                item.id ===
                address.id
                  ? address
                  : item
            )
          : [
              ...current,
              address,
            ];

        if (address.default) {
          next = next.map(
            (item) => ({
              ...item,
              default:
                item.id ===
                address.id,
            })
          );
        }

        return next;
      }
    );

    await onAddressSave?.(
      address
    );

    setAddressModal(null);
  };

  const deleteAddress = async (
    id
  ) => {
    setAddresses(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );

    await onAddressDelete?.(
      id
    );
  };

  const makeDefault = async (
    id
  ) => {
    setAddresses(
      (current) =>
        current.map(
          (item) => ({
            ...item,
            default:
              item.id === id,
          })
        )
    );

    await onDefaultAddress?.(
      id
    );
  };

  return (
    <main className="account-page">
      <section className="account-header">
        <div>
          <span>
            MY D2C MALL
          </span>
          <h1>
            Hello, {user.name.split(" ")[0]}.
          </h1>
          <p>
            Manage your profile, orders and shopping
            preferences.
          </p>
        </div>

        <div className="account-header-summary">
          <div>
            <strong>12</strong>
            <span>Orders</span>
          </div>

          <div>
            <strong>4</strong>
            <span>Wishlist</span>
          </div>

          <div>
            <strong>2</strong>
            <span>Addresses</span>
          </div>
        </div>
      </section>

      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-sidebar-profile">
            <div className="account-sidebar-avatar">
              {user.name
                .split(" ")
                .map(
                  (item) =>
                    item[0]
                )
                .join("")
                .slice(0, 2)}
            </div>

            <div>
              <strong>
                {user.name}
              </strong>
              <span>
                {user.email}
              </span>
            </div>
          </div>

          <nav>
            {ACCOUNT_MENU.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  type="button"
                  key={id}
                  className={
                    activeSection ===
                    id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveSection(
                      id
                    )
                  }
                >
                  <Icon size={16} />
                  <span>
                    {label}
                  </span>
                  <ChevronRight
                    size={13}
                  />
                </button>
              )
            )}
          </nav>

          <div className="account-sidebar-help">
            <ShieldCheck size={17} />

            <strong>
              Need help?
            </strong>

            <span>
              Our support team is here for your orders,
              returns and payments.
            </span>

            <button type="button">
              Help Center
              <ChevronRight size={13} />
            </button>
          </div>
        </aside>

        <div className="account-main">
          {activeSection ===
            "profile" && (
            <ProfileSection
              user={user}
              onSave={updateProfile}
            />
          )}

          {activeSection ===
            "orders" && (
            <OrdersOverview
              onNavigate={onNavigate}
            />
          )}

          {activeSection ===
            "addresses" && (
            <section className="account-content-section">
              <div className="account-section-heading">
                <div>
                  <span>
                    DELIVERY DETAILS
                  </span>
                  <h2>
                    Saved Addresses
                  </h2>
                  <p>
                    Save addresses for faster checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAddressModal(
                      "new"
                    )
                  }
                >
                  <Plus size={14} />
                  Add Address
                </button>
              </div>

              <div className="account-address-grid">
                {addresses.map(
                  (address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      onEdit={(item) =>
                        setAddressModal(
                          item
                        )
                      }
                      onDelete={
                        deleteAddress
                      }
                      onDefault={
                        makeDefault
                      }
                    />
                  )
                )}

                <button
                  type="button"
                  className="account-add-address"
                  onClick={() =>
                    setAddressModal(
                      "new"
                    )
                  }
                >
                  <Plus size={21} />
                  <strong>
                    Add new address
                  </strong>
                  <span>
                    Home, work or another delivery location
                  </span>
                </button>
              </div>
            </section>
          )}

          {activeSection ===
            "payments" && (
            <PaymentsSection />
          )}

          {activeSection ===
            "wishlist" && (
            <section className="account-content-section">
              <div className="account-empty-state">
                <Heart size={30} />
                <h2>
                  Your wishlist
                </h2>
                <p>
                  Your saved products will appear here.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate?.(
                      "wishlist"
                    )
                  }
                >
                  View Wishlist
                  <ChevronRight
                    size={14}
                  />
                </button>
              </div>
            </section>
          )}

          {activeSection ===
            "notifications" && (
            <NotificationsSection />
          )}

          {activeSection ===
            "settings" && (
            <SettingsSection />
          )}
        </div>
      </div>

      <AnimatePresence>
        {addressModal && (
          <AddressModal
            address={
              addressModal ===
              "new"
                ? null
                : addressModal
            }
            onClose={() =>
              setAddressModal(
                null
              )
            }
            onSave={saveAddress}
          />
        )}
      </AnimatePresence>
    </main>
  );
}