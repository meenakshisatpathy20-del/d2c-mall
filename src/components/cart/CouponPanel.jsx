import { useState } from "react";
import { Check, ChevronRight, Tag, X } from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { evaluateCoupon, listCouponsForCart } from "../../lib/pricing";
import { cx, formatDate, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Modal } from "../common/ui";

/** Coupon input + list with eligibility (min cart, expiry, usage limit, category, first order). */
export default function CouponPanel({ paymentMethod }) {
  const { cart, summary, appliedCoupon, applyCoupon, userOrders, usage } = useShop();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const items = cart.filter((i) => !i.outOfStock);
  const ctx = { items, userOrders, usage, paymentMethod };

  const apply = (c) => {
    const res = evaluateCoupon(c, ctx);
    if (!res.ok) {
      setError(res.reason);
      return false;
    }
    applyCoupon(res.coupon.code);
    setError("");
    setCode("");
    setOpen(false);
    toast(`${res.coupon.code} applied · you save ${res.freeShipping ? "on delivery" : formatINR(res.discount)}`);
    return true;
  };

  const list = listCouponsForCart(ctx);
  const invalidApplied = appliedCoupon && !summary.couponCode;

  return (
    <div className="card card-pad coupon-panel">
      <div className="row between">
        <b className="row gap-6">
          <Tag size={17} className="text-orange" /> Coupons
        </b>
        <button className="btn btn-outline-orange btn-sm" onClick={() => setOpen(true)}>
          {summary.couponCode ? "Change" : "Apply"}
        </button>
      </div>
      {summary.couponCode ? (
        <div className="coupon-applied mt-12">
          <Check size={16} />
          <div className="grow">
            <b>{summary.couponCode}</b> applied
            <div className="xs">
              You save {summary.couponDiscount ? formatINR(summary.couponDiscount) : "on delivery"}
            </div>
          </div>
          <button className="icon-btn sm" onClick={() => applyCoupon(null)} aria-label="Remove coupon">
            <X size={15} />
          </button>
        </div>
      ) : invalidApplied ? (
        <div className="notice warn mt-12">
          {appliedCoupon}: {summary.couponResult?.reason}
        </div>
      ) : (
        <p className="xs muted mt-8">{list.filter((x) => x.result.ok).length} coupons available for your bag</p>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Apply coupon">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            apply(code);
          }}
        >
          <input className="input" placeholder="Enter coupon code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoFocus />
          <button className="btn" type="submit" disabled={!code}>
            Check
          </button>
        </form>
        {error ? <p className="xs text-red bold mt-8">{error}</p> : null}
        <div className="col gap-10 mt-16">
          {list.map(({ coupon, result }) => (
            <div key={coupon.code} className={cx("coupon-opt", !result.ok && "disabled")}>
              <div className="row between">
                <span className="coupon-code">{coupon.code}</span>
                <button className="link small" disabled={!result.ok} onClick={() => apply(coupon.code)}>
                  {appliedCoupon === coupon.code ? "Applied" : "Apply"} <ChevronRight size={14} />
                </button>
              </div>
              <b className="small mt-8" style={{ display: "block" }}>
                {coupon.title}
                {result.ok && result.discount ? <span className="text-green"> · Save {formatINR(result.discount)}</span> : null}
              </b>
              <p className="xs muted">{coupon.description}</p>
              <p className="xs faint">
                {coupon.minCart ? `Min order ${formatINR(coupon.minCart)} · ` : ""}
                {coupon.maxDiscount ? `Max ${formatINR(coupon.maxDiscount)} · ` : ""}
                {coupon.perUserLimit ? `${coupon.perUserLimit} use(s) per user · ` : ""}
                Expires {formatDate(coupon.expiresAt)}
              </p>
              {!result.ok ? <p className="xs text-red bold mt-4">{result.reason}</p> : null}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export function PriceDetails({ summary, children, title = "Price details" }) {
  return (
    <div className="card card-pad price-details">
      <b className="xs muted" style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {title} ({summary.itemCount} item{summary.itemCount === 1 ? "" : "s"})
      </b>
      <div className="pd-row">
        <span>Total MRP</span>
        <span>{formatINR(summary.mrpTotal)}</span>
      </div>
      <div className="pd-row">
        <span>Discount on MRP</span>
        <span className="text-green">−{formatINR(summary.productDiscount)}</span>
      </div>
      <div className="pd-row">
        <span>Coupon discount</span>
        {summary.couponDiscount ? <span className="text-green">−{formatINR(summary.couponDiscount)}</span> : <span className="muted">{summary.couponCode ? "Free delivery" : "—"}</span>}
      </div>
      <div className="pd-row">
        <span>Delivery fee</span>
        {summary.shipping ? (
          <span>{formatINR(summary.shipping)}</span>
        ) : (
          <span className="text-green">
            <span className="strike faint">₹49</span> FREE
          </span>
        )}
      </div>
      {summary.codFee ? (
        <div className="pd-row">
          <span>COD handling fee</span>
          <span>{formatINR(summary.codFee)}</span>
        </div>
      ) : null}
      {summary.giftWrapFee ? (
        <div className="pd-row">
          <span>Gift wrap</span>
          <span>{formatINR(summary.giftWrapFee)}</span>
        </div>
      ) : null}
      {summary.coinsUsed ? (
        <div className="pd-row">
          <span>D2C Coins redeemed</span>
          <span className="text-green">−{formatINR(summary.coinsUsed)}</span>
        </div>
      ) : null}
      {summary.creditsUsed ? (
        <div className="pd-row">
          <span>D2C credits used</span>
          <span className="text-green">−{formatINR(summary.creditsUsed)}</span>
        </div>
      ) : null}
      <hr className="divider" style={{ margin: "4px 0" }} />
      <div className="pd-row total">
        <span>Total amount</span>
        <span>{formatINR(summary.total)}</span>
      </div>
      {summary.savings ? <div className="pd-save">🎉 You're saving {formatINR(summary.savings)} on this order</div> : null}
      {summary.coinsEarn ? <div className="xs muted center">You'll earn <b className="text-orange">{summary.coinsEarn} D2C Coins</b> when this order is delivered</div> : null}
      {children}
    </div>
  );
}
