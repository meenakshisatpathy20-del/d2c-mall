import { useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Copy, FileText, Gift, Share2, Star, Ticket, Users } from "lucide-react";
import { useStore } from "../../lib/store";
import { updateUser } from "../../lib/services/account";
import { coinsSummary, isGstin, isPan, redeemGiftCard, referralCode } from "../../lib/services/extras";
import { deriveOrderStatus } from "../../lib/orderModel";
import { coupons } from "../../data/coupons";
import { productMap } from "../../data/catalog";
import { formatDate, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Empty, Field, Img } from "../common/ui";

const copy = (text, msg = "Copied") => {
  navigator.clipboard?.writeText(text).then(() => toast(msg), () => toast(text));
};

/* ---------------- My coupons ---------------- */

export function MyCoupons({ user }) {
  const usage = useStore((s) => s.couponUsage) || {};
  const now = Date.now();
  const list = coupons.map((c) => {
    const used = usage[user.id]?.[c.code] || 0;
    const expired = c.expiresAt && c.expiresAt < now;
    const exhausted = c.perUserLimit && used >= c.perUserLimit;
    return { ...c, used, state: expired ? "Expired" : exhausted ? "Used" : "Available" };
  });
  const available = list.filter((c) => c.state === "Available");
  const other = list.filter((c) => c.state !== "Available");
  const Row = ({ c }) => (
    <div className={`acx-coupon ${c.state !== "Available" ? "is-off" : ""}`}>
      <div className="acx-coupon-l">
        <Ticket size={18} />
        <b>{c.type === "percent" ? `${c.value}%` : c.type === "flat" ? formatINR(c.value) : "FREE"}</b>
        <span className="xs">{c.type === "shipping" ? "SHIPPING" : "OFF"}</span>
      </div>
      <div className="acx-coupon-r">
        <div className="row between gap-10">
          <b>{c.title}</b>
          <span className={`acx-state ${c.state === "Available" ? "on" : ""}`}>{c.state}</span>
        </div>
        <p className="xs muted">{c.description}</p>
        <div className="row between mt-8">
          <span className="xs faint">{c.expiresAt ? `Valid till ${formatDate(c.expiresAt)}` : "No expiry"}{c.minCart ? ` · Min. order ${formatINR(c.minCart)}` : ""}</span>
          <button className="coupon-code" disabled={c.state !== "Available"} onClick={() => copy(c.code, `${c.code} copied — apply it in your bag`)}>
            {c.code} <Copy size={12} />
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="col gap-16">
      <div className="card card-pad">
        <h3 className="acc-title">My coupons</h3>
        <p className="small muted">{available.length} coupons available for you. Tap a code to copy it and apply it in your bag.</p>
        <div className="acx-coupons mt-12">{available.map((c) => <Row key={c.code} c={c} />)}</div>
      </div>
      {other.length ? (
        <div className="card card-pad">
          <h3 className="acc-title">Used & expired</h3>
          <div className="acx-coupons mt-12">{other.map((c) => <Row key={c.code} c={c} />)}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- My reviews & ratings ---------------- */

export function MyReviews({ user }) {
  const orders = useStore((s) => s.orders).filter((o) => o.userId === user.id && deriveOrderStatus(o) === "delivered");
  const reviews = useStore((s) => s.userReviews) || {};
  const mine = Object.entries(reviews).flatMap(([pid, arr]) => arr.filter((r) => r.userId === user.id || r.name === user.name).map((r) => ({ ...r, pid })));
  const reviewed = new Set(mine.map((r) => r.pid));
  const pending = [...new Map(orders.flatMap((o) => o.items).map((i) => [i.productId, i])).values()].filter((i) => !reviewed.has(i.productId));
  return (
    <div className="col gap-16">
      <div className="card card-pad">
        <h3 className="acc-title">Rate your purchases</h3>
        {pending.length ? (
          <div className="col gap-10 mt-12">
            {pending.map((i) => {
              const p = productMap[i.productId];
              return (
                <div key={i.productId} className="row between soft-panel gap-10">
                  <span className="row gap-10" style={{ minWidth: 0 }}>
                    <Img src={p?.images[0]} alt="" label={p?.brand} style={{ width: 44, height: 44, borderRadius: 8, flex: "none" }} />
                    <span className="ellipsis small"><b>{i.name}</b></span>
                  </span>
                  <Link to={`/product/${i.productId}#reviews`} className="btn btn-outline btn-sm">
                    <Star size={14} /> Rate
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="small muted mt-8">You're all caught up — nothing waiting for a review.</p>
        )}
      </div>
      <div className="card card-pad">
        <h3 className="acc-title">Your reviews ({mine.length})</h3>
        {mine.length ? (
          <div className="col gap-10 mt-12">
            {mine.map((r) => (
              <div key={r.id} className="soft-panel">
                <div className="row between">
                  <Link to={`/product/${r.pid}`} className="small bold">{productMap[r.pid]?.name || r.pid}</Link>
                  <span className="acx-rating">{r.rating} <Star size={11} fill="#fff" /></span>
                </div>
                {r.title ? <b className="small">{r.title}</b> : null}
                <p className="small muted">{r.text || r.body}</p>
                <span className="xs faint">{formatDate(r.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Star size={28} />} title="No reviews yet" text="Your ratings help thousands of shoppers choose better." />
        )}
      </div>
    </div>
  );
}

/* ---------------- Gift cards ---------------- */

export function GiftCards({ user }) {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const r = redeemGiftCard(user.id, code, pin);
    if (!r.ok) return toast.error(r.error);
    toast(`${formatINR(r.amount)} added to your D2C credits`);
    setCode("");
    setPin("");
  };
  const ledger = user.walletLedger || [];
  return (
    <div className="col gap-16">
      <div className="wallet-card">
        <div>
          <span className="xs">Gift card & credits balance</span>
          <b>{formatINR(user.credits || 0)}</b>
          <p className="xs">Use it on any order at checkout. Balance never expires.</p>
        </div>
        <Gift size={40} />
      </div>
      <form className="card card-pad" onSubmit={submit}>
        <h3 className="acc-title">Add a gift card</h3>
        <div className="acx-form mt-12">
          <Field label="Gift card number"><input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="D2C-GIFT-XXXX-XXXX" required /></Field>
          <Field label="PIN"><input className="input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="4–6 digit PIN" inputMode="numeric" required /></Field>
          <button className="btn btn-blue">Add to balance</button>
        </div>
        <p className="xs faint mt-8">Demo cards: D2C-GIFT-0500-2026 / D2C-GIFT-1000-2026 / D2C-GIFT-2500-2026 · PIN 2026</p>
      </form>
      <div className="card card-pad">
        <h3 className="acc-title">Wallet activity</h3>
        {ledger.length ? (
          <div className="col mt-8">
            {ledger.map((l) => (
              <div key={l.id} className="row between acx-ledger">
                <span className="small">{l.note}<br /><span className="xs faint">{formatDate(l.at)}</span></span>
                <b className={l.type === "credit" ? "text-green" : "text-red"}>{l.type === "credit" ? "+" : "−"}{formatINR(l.amount)}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted mt-8">No wallet activity yet.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- D2C Coins ---------------- */

export function CoinsPanel({ user }) {
  const orders = useStore((s) => s.orders);
  const { balance, pending, ledger } = coinsSummary(user, orders);
  return (
    <div className="col gap-16">
      <div className="wallet-card acx-coins-card">
        <div>
          <span className="xs">D2C Coins</span>
          <b>{balance.toLocaleString("en-IN")} coins</b>
          <p className="xs">1 coin = ₹1 · use up to 30% of an order's value · {pending} coins pending on active orders</p>
        </div>
        <Coins size={40} />
      </div>
      <div className="acx-steps">
        {[
          ["Shop", "Earn 2% back as coins on every delivered order"],
          ["Redeem", "Toggle “Use D2C Coins” at checkout"],
          ["Level up", "Silver → Gold → Platinum for faster delivery & early sales"],
        ].map(([t, d], i) => (
          <div key={t} className="card card-pad">
            <span className="acx-step-n">{i + 1}</span>
            <b>{t}</b>
            <p className="xs muted">{d}</p>
          </div>
        ))}
      </div>
      <div className="card card-pad">
        <h3 className="acc-title">Coin history</h3>
        <div className="col mt-8">
          {ledger.map((l) => (
            <div key={l.id} className="row between acx-ledger">
              <span className="small">{l.note}<br /><span className="xs faint">{formatDate(l.at)}</span></span>
              <b className={l.amount >= 0 ? "text-green" : "text-red"}>{l.amount >= 0 ? "+" : ""}{l.amount}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Refer & earn ---------------- */

export function ReferEarn({ user }) {
  const code = referralCode(user);
  const link = `${window.location.origin}/login?ref=${code}`;
  const msg = `Shop India's best D2C brands on D2C Mall! Use my code ${code} to get ₹100 off your first order: ${link}`;
  const share = () => {
    if (navigator.share) navigator.share({ title: "D2C Mall", text: msg }).catch(() => {});
    else copy(msg, "Invite message copied");
  };
  const referrals = user.referrals || [];
  return (
    <div className="col gap-16">
      <div className="acx-refer">
        <div>
          <span className="eyebrow" style={{ color: "#ffb37a" }}>Refer & earn</span>
          <h2>Give ₹100, get ₹150</h2>
          <p className="small">Friends get ₹100 off their first order. You get ₹150 in D2C credits once their order is delivered.</p>
          <div className="acx-refcode">
            <b>{code}</b>
            <button className="btn btn-sm" onClick={() => copy(code, "Referral code copied")}><Copy size={14} /> Copy</button>
          </div>
          <div className="row gap-10 mt-12 wrap">
            <a className="btn btn-green btn-sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            <button className="btn btn-glass btn-sm" onClick={share}><Share2 size={14} /> More options</button>
          </div>
        </div>
        <Users size={72} className="acx-refer-ic" />
      </div>
      <div className="card card-pad">
        <h3 className="acc-title">Your referrals</h3>
        <div className="row gap-16 mt-8 wrap">
          <span className="small">Invited: <b>{referrals.length}</b></span>
          <span className="small">Earned: <b className="text-green">{formatINR(referrals.filter((r) => r.status === "rewarded").length * 150)}</b></span>
        </div>
        {!referrals.length ? <p className="small muted mt-8">No referrals yet — share your code to start earning.</p> : null}
      </div>
    </div>
  );
}

/* ---------------- PAN & GST ---------------- */

export function TaxDetails({ user }) {
  const [pan, setPan] = useState(user.pan || "");
  const [panName, setPanName] = useState(user.panName || user.name || "");
  const [gstin, setGstin] = useState(user.gstin || "");
  const [biz, setBiz] = useState(user.businessName || "");
  const savePan = (e) => {
    e.preventDefault();
    if (!isPan(pan)) return toast.error("Enter a valid 10-character PAN, e.g. ABCDE1234F");
    updateUser(user.id, { pan: pan.toUpperCase(), panName });
    toast("PAN saved");
  };
  const saveGst = (e) => {
    e.preventDefault();
    if (!isGstin(gstin)) return toast.error("Enter a valid 15-character GSTIN, e.g. 27ABCDE1234F1Z5");
    if (!biz.trim()) return toast.error("Enter the registered business name");
    updateUser(user.id, { gstin: gstin.toUpperCase(), businessName: biz.trim() });
    toast("GST details saved — they'll be pre-filled at checkout");
  };
  const mask = (v) => (v ? `${v.slice(0, 2)}${"•".repeat(v.length - 4)}${v.slice(-2)}` : "");
  return (
    <div className="col gap-16">
      <form className="card card-pad" onSubmit={savePan}>
        <h3 className="acc-title row gap-6"><FileText size={18} /> PAN card</h3>
        <p className="xs muted">Quoting PAN is required for a purchase above ₹2,00,000 in a single transaction (Rule 114B, Income-tax Rules, 1962). Stored masked: {user.pan ? <b>{mask(user.pan)}</b> : "not added"}</p>
        <div className="acx-form mt-12">
          <Field label="PAN number"><input className="input" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" /></Field>
          <Field label="Name on PAN"><input className="input" value={panName} onChange={(e) => setPanName(e.target.value)} /></Field>
          <button className="btn btn-blue">Save PAN</button>
        </div>
      </form>
      <form className="card card-pad" onSubmit={saveGst}>
        <h3 className="acc-title row gap-6"><FileText size={18} /> GST details for business purchases</h3>
        <p className="xs muted">Add your GSTIN to receive a GST tax invoice with your business name so you can claim input tax credit.</p>
        <div className="acx-form mt-12">
          <Field label="GSTIN"><input className="input" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))} placeholder="27ABCDE1234F1Z5" /></Field>
          <Field label="Registered business name"><input className="input" value={biz} onChange={(e) => setBiz(e.target.value)} /></Field>
          <button className="btn btn-blue">Save GST details</button>
        </div>
        {user.gstin ? <p className="xs text-green mt-8">Saved: {user.gstin} · {user.businessName}</p> : null}
      </form>
    </div>
  );
}
