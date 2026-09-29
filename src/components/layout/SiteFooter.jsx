import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CreditCard, Globe, Mail, MapPin, PackageCheck, Phone, RotateCcw, Send, ShieldCheck, Store, Truck, Warehouse } from "lucide-react";
import { categories } from "../../data/catalog";
import { warehouses } from "../../data/logistics";
import { isEmail } from "../../lib/services/account";
import { toast } from "../../lib/toast";

const TRUST = [
  { icon: BadgeCheck, title: "100% authentic", text: "Every brand verified & onboarded directly" },
  { icon: Truck, title: "Fast delivery", text: "From 4 hubs · as fast as 24 hours" },
  { icon: RotateCcw, title: "Easy returns", text: "14-day returns with doorstep pickup" },
  { icon: ShieldCheck, title: "Secure payments", text: "Razorpay · UPI · Cards · COD" },
];

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  return (
    <footer className="footer">
      <div className="footer-trust">
        <div className="container grid grid-4">
          {TRUST.map((t) => (
            <div key={t.title} className="trust-item">
              <span className="trust-icon">
                <t.icon size={20} />
              </span>
              <div>
                <b>{t.title}</b>
                <p>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container footer-main">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-tile">
              <Store size={22} />
            </span>
            <span className="logo-text">
              <span className="logo-word">
                <span className="d2c">D2C</span>
                <span className="mall" style={{ color: "#ff8a3d" }}>MALL</span>
              </span>
              <span className="logo-tag" style={{ color: "#8792a6" }}>Direct-to-consumer store</span>
            </span>
          </Link>
          <p>India's home for homegrown direct-to-consumer brands — fashion, beauty, footwear, jewellery, electronics and home, delivered from our own fulfilment network.</p>
          <form
            className="footer-news"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isEmail(email)) return toast.error("Enter a valid email");
              toast("You're subscribed! Check your inbox for ₹100 off.");
              setEmail("");
            }}
          >
            <Mail size={16} />
            <input placeholder="Get drops & offers in your inbox" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <button type="submit" aria-label="Subscribe">
              <Send size={16} />
            </button>
          </form>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          {categories.map((c) => (
            <Link key={c.id} to={`/category/${c.id}`}>{c.name}</Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>Discover</h4>
          <Link to="/deals">Deals of the day</Link>
          <Link to="/new-arrivals">New arrivals</Link>
          <Link to="/trending">Trending</Link>
          <Link to="/brands">All brands</Link>
          <Link to="/d2c-street">D2C Street</Link>
          <Link to="/pulse">D2C Pulse</Link>
        </div>
        <div className="footer-col">
          <h4>Help</h4>
          <Link to="/orders">Track your order</Link>
          <Link to="/returns">Returns & refunds</Link>
          <Link to="/account/help">Help centre & FAQs</Link>
          <Link to="/account/help">Contact support</Link>
          <Link to="/delivery-location">Delivery & serviceability</Link>
          <Link to="/account">My account</Link>
        </div>
        <div className="footer-col">
          <h4>Business</h4>
          <Link to="/franchise">Franchise (FOFO / FOCO)</Link>
          <Link to="/franchise/apply">Apply for franchise</Link>
          <Link to="/franchise/status">Application status</Link>
          <Link to="/brands">Sell on D2C Mall</Link>
          <Link to="/admin/login">Warehouse & admin login</Link>
        </div>
      </div>

      <div className="container footer-hubs">
        <span className="footer-hubs-title">
          <Warehouse size={15} /> Our fulfilment hubs
        </span>
        {warehouses.map((w) => (
          <span key={w.id} className="hub-pill">
            <span className="dot" style={{ background: w.color }} /> {w.short}
          </span>
        ))}
        <span className="footer-contact">
          <Phone size={14} /> 1800-120-D2C (toll free) <Mail size={14} /> care@d2cmall.in <MapPin size={14} /> Bengaluru, India
        </span>
      </div>

      <div className="footer-bottom">
        <div className="container row between wrap gap-16">
          <span>© {new Date().getFullYear()} D2C Mall. All rights reserved.</span>
          <span className="row gap-16 wrap">
            <span className="row gap-6"><CreditCard size={14} /> UPI · Visa · Mastercard · RuPay · NetBanking · COD</span>
            <span className="row gap-6"><PackageCheck size={14} /> Shipping via Shiprocket</span>
            <span className="row gap-6"><Globe size={14} /> India (₹ INR)</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
