import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Wallet,
  Warehouse,
  XCircle,
  Zap,
} from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { saveAddress, useCurrentUser } from "../../lib/services/account";
import { planFulfilment } from "../../lib/delivery";
import { computeSummary } from "../../lib/pricing";
import { PAYMENT_METHODS, paymentMode } from "../../lib/services/payments";
import { coinsSummary, isGstin } from "../../lib/services/extras";
import { live } from "../../lib/api";
import { useStore } from "../../lib/store";
import { Coins, FileText, Gift, MessageSquare } from "lucide-react";
import { collectPayment, placeOrder } from "../../lib/services/orders";
import { cx, dayLabel, formatINR } from "../../lib/format";
import { randomId } from "../../lib/crypto";
import { toast } from "../../lib/toast";
import AddressForm from "../account/AddressForm";
import CouponPanel, { PriceDetails } from "../cart/CouponPanel";
import { Empty, Img, Modal, useDocumentTitle } from "../common/ui";
import "./CheckoutPage.css";

const METHOD_ICONS = { upi: Smartphone, card: CreditCard, netbanking: Landmark, wallet: Wallet, cod: Banknote };

const STAGES = [
  { key: "validating", label: "Validating bag & prices" },
  { key: "reserving", label: "Reserving stock at warehouse" },
  { key: "creating_payment", label: "Creating secure payment order" },
  { key: "awaiting_payment", label: "Waiting for payment" },
  { key: "verifying", label: "Verifying payment signature" },
  { key: "confirming", label: "Confirming order & creating shipments" },
];

function Steps({ step }) {
  const steps = ["Bag", "Address", "Delivery", "Payment"];
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <span key={s} className="row gap-6" style={{ flex: i < steps.length - 1 ? 1 : "none" }}>
          <span className={cx("step", i < step && "done", i === step && "active")}>
            <span className="num">{i < step ? <Check size={13} /> : i + 1}</span> {s}
          </span>
          {i < steps.length - 1 ? <span className={cx("bar", i < step && "done")} /> : null}
        </span>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { cart, inventory, appliedCoupon, userOrders, usage, setPincode } = useShop();
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState(() => user?.addresses?.find((a) => a.isDefault)?.id || user?.addresses?.[0]?.id);
  const [editing, setEditing] = useState(null);
  const [speed, setSpeed] = useState("standard");
  const [courierChoice, setCourierChoice] = useState({});
  const [method, setMethod] = useState("upi");
  const [stage, setStage] = useState(null);
  const [failure, setFailure] = useState(null);
  const idem = useRef(`idem_${randomId(16)}`);
  const [busy, setBusy] = useState(false);
  const allOrders = useStore((st) => st.orders);
  const [ex, setEx] = useState({ giftWrap: false, giftMessage: "", gst: Boolean(user?.gstin), gstin: user?.gstin || "", businessName: user?.businessName || "", instructions: "", slot: "Anytime", useCredits: false, useCoins: false });
  const coinBal = useMemo(() => (user ? coinsSummary(user, allOrders).balance : 0), [user, allOrders]);
  const walletAllowed = paymentMode() !== "live" || live("db");

  const lines = useMemo(() => cart.filter((i) => !i.outOfStock).map((i) => ({ ...i, qty: Math.min(i.qty, i.stock) })), [cart]);
  const address = user?.addresses?.find((a) => a.id === addressId);
  const plan = useMemo(
    () => (address ? planFulfilment(address.pincode, lines.map((l) => ({ productId: l.productId, qty: l.qty, weightKg: l.weightKg })), inventory) : null),
    [address, lines, inventory]
  );
  const summary = useMemo(
    () =>
      computeSummary({
        items: lines,
        couponCode: appliedCoupon,
        userOrders,
        usage,
        paymentMethod: method,
        deliverySpeed: plan?.expressAvailable ? speed : "standard",
        giftWrap: ex.giftWrap,
        credits: walletAllowed && ex.useCredits ? user?.credits || 0 : 0,
        coins: walletAllowed && ex.useCoins ? coinBal : 0,
      }),
    [lines, appliedCoupon, userOrders, usage, method, speed, plan, ex, user, coinBal, walletAllowed]
  );
  const codDisabledReason = !plan?.codAvailable ? "COD isn't available for this pincode" : !summary.codAvailable ? "COD available on orders up to ₹20,000" : lines.some((l) => !l.product.cod) ? "Some items aren't eligible for COD" : null;

  useEffect(() => {
    if (address) setPincode(address.pincode, { city: address.city, state: address.state });
  }, [address, setPincode]);

  useEffect(() => {
    if (method === "cod" && codDisabledReason) setMethod("upi");
  }, [method, codDisabledReason]);

  if (!lines.length && !stage) {
    return (
      <div className="page container">
        <Empty icon={<Package size={34} />} title="Your bag is empty" text="Add products to your bag before checking out." action={<Link to="/shop" className="btn">Continue shopping</Link>} />
      </div>
    );
  }

  const submitAddress = (a) => {
    const id = saveAddress(user.id, { ...a, id: editing === "new" ? undefined : editing });
    setAddressId(id);
    setEditing(null);
    toast("Address saved");
  };

  const pay = async () => {
    if (busy) return;
    if (ex.gst && !isGstin(ex.gstin)) {
      toast.error("Enter a valid 15-character GSTIN or untick GST invoice");
      return;
    }
    setBusy(true);
    setFailure(null);
    setStage("validating");
    const res = await placeOrder({
      user,
      lines,
      address,
      courierChoice,
      deliverySpeed: plan?.expressAvailable ? speed : "standard",
      paymentMethod: method,
      couponCode: summary.couponCode,
      idempotencyKey: idem.current,
      extras: {
        giftWrap: ex.giftWrap,
        giftMessage: ex.giftMessage,
        gstin: ex.gst ? ex.gstin.toUpperCase() : null,
        businessName: ex.businessName,
        instructions: ex.instructions,
        slot: ex.slot,
        credits: summary.creditsUsed,
        coins: summary.coinsUsed,
      },
      onStage: setStage,
    });
    setBusy(false);
    if (res.ok) {
      setStage("done");
      setTimeout(() => navigate(`/order-success/${res.order.id}`, { replace: true }), 700);
    } else {
      setStage(null);
      setFailure(res);
      // new idempotency key for a fresh attempt; retries reuse the failed order via collectPayment
      idem.current = `idem_${randomId(16)}`;
    }
  };

  const retry = async (newMethod) => {
    if (!failure?.orderId) return pay();
    setBusy(true);
    const m = newMethod || method;
    setStage("creating_payment");
    const res = await collectPayment(failure.orderId, { user, address, paymentMethod: m, onStage: setStage });
    setBusy(false);
    if (res.ok) {
      setStage("done");
      setTimeout(() => navigate(`/order-success/${res.order.id}`, { replace: true }), 700);
    } else {
      setStage(null);
      setFailure({ ...res, orderId: failure.orderId });
    }
  };

  const mode = paymentMode();

  return (
    <div className="page checkout">
      <div className="container">
        <div className="checkout-top">
          <Link to="/cart" className="link">
            <ArrowLeft size={16} /> Back to bag
          </Link>
          <Steps step={step} />
          <span className={cx("badge", mode === "live" ? "badge-soft-green" : "badge-soft-amber")}>
            <Lock size={11} /> {mode === "live" ? "Razorpay live" : "Razorpay sandbox"}
          </span>
        </div>

        <div className="checkout-grid">
          <div className="col gap-16">
            {/* ---------- Address ---------- */}
            <section className={cx("co-step", step === 1 && "open")}>
              <header className="co-head" onClick={() => step > 1 && setStep(1)}>
                <span className="co-num">{step > 1 ? <Check size={14} /> : 1}</span>
                <div className="grow">
                  <b>Delivery address</b>
                  {step > 1 && address ? (
                    <div className="small muted">
                      {address.name}, {address.line1}, {address.city} – {address.pincode}
                    </div>
                  ) : null}
                </div>
                {step > 1 ? <button className="btn btn-outline btn-sm">Change</button> : null}
              </header>
              {step === 1 ? (
                <div className="co-body">
                  {editing ? (
                    <AddressForm initial={editing === "new" ? { name: user.name, phone: user.phone } : user.addresses.find((a) => a.id === editing)} onSubmit={submitAddress} onCancel={user.addresses.length ? () => setEditing(null) : null} submitLabel="Save & deliver here" />
                  ) : (
                    <>
                      <div className="col gap-10">
                        {user.addresses.map((a) => {
                          const p = planFulfilment(a.pincode, lines.map((l) => ({ productId: l.productId, qty: l.qty })), inventory);
                          return (
                            <label key={a.id} className={cx("radio-card", addressId === a.id && "active")}>
                              <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                              <div className="grow">
                                <div className="row gap-6 wrap">
                                  <b>{a.name}</b>
                                  <span className="badge badge-soft-gray">{a.label || a.type}</span>
                                  {a.isDefault ? <span className="badge badge-soft-blue">Default</span> : null}
                                </div>
                                <p className="small muted mt-4">
                                  {a.line1}, {a.line2 ? `${a.line2}, ` : ""}
                                  {a.landmark ? `${a.landmark}, ` : ""}
                                  {a.city}, {a.state} – <b>{a.pincode}</b>
                                </p>
                                <p className="small mt-4">Mobile: {a.phone}</p>
                                {p.ok ? (
                                  <p className="xs text-green bold mt-4">
                                    <Truck size={12} /> Delivery by {dayLabel(p.eta)} · {p.codAvailable ? "COD available" : "Prepaid only"}
                                  </p>
                                ) : (
                                  <p className="xs text-red bold mt-4">{p.reason}</p>
                                )}
                                {addressId === a.id ? (
                                  <div className="row gap-6 mt-12">
                                    <button type="button" className="btn btn-sm" disabled={!p.ok} onClick={() => setStep(2)}>
                                      Deliver here
                                    </button>
                                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(a.id)}>
                                      <Pencil size={13} /> Edit
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      <button className="btn btn-outline-blue mt-16" onClick={() => setEditing("new")}>
                        <Plus size={16} /> Add a new address
                      </button>
                      {!user.addresses.length ? <p className="small muted mt-8">You don't have any saved addresses yet.</p> : null}
                    </>
                  )}
                </div>
              ) : null}
            </section>

            {/* ---------- Delivery ---------- */}
            <section className={cx("co-step", step === 2 && "open")}>
              <header className="co-head" onClick={() => step > 2 && setStep(2)}>
                <span className="co-num">{step > 2 ? <Check size={14} /> : 2}</span>
                <div className="grow">
                  <b>Delivery options</b>
                  {step > 2 && plan?.ok ? (
                    <div className="small muted">
                      {speed === "express" && plan.expressAvailable ? "Express" : "Standard"} · arrives {dayLabel(speed === "express" && plan.expressAvailable ? plan.expressEta : plan.eta)}
                    </div>
                  ) : null}
                </div>
                {step > 2 ? <button className="btn btn-outline btn-sm">Change</button> : null}
              </header>
              {step === 2 && plan ? (
                <div className="co-body">
                  {!plan.ok ? (
                    <div className="notice error">{plan.reason}</div>
                  ) : (
                    <>
                      <div className="grid grid-2">
                        <label className={cx("radio-card", speed === "standard" && "active")}>
                          <input type="radio" checked={speed === "standard"} onChange={() => setSpeed("standard")} />
                          <div>
                            <b className="row gap-6">
                              <Truck size={16} /> Standard delivery
                            </b>
                            <p className="small muted">Arrives {dayLabel(plan.eta)}</p>
                            <p className="xs text-green bold">{summary.freeShipping ? "FREE" : "₹49"}</p>
                          </div>
                        </label>
                        <label className={cx("radio-card", speed === "express" && "active", !plan.expressAvailable && "disabled-card")}>
                          <input type="radio" disabled={!plan.expressAvailable} checked={speed === "express"} onChange={() => setSpeed("express")} />
                          <div>
                            <b className="row gap-6">
                              <Zap size={16} className="text-orange" /> Express delivery
                            </b>
                            <p className="small muted">{plan.expressAvailable ? `Arrives ${dayLabel(plan.expressEta)}` : "Not available for this pincode"}</p>
                            <p className="xs bold">+₹99</p>
                          </div>
                        </label>
                      </div>

                      <div className="confidence mt-16">
                        <div className="ring" style={{ "--p": plan.confidence }}>
                          <b>{plan.confidence}%</b>
                        </div>
                        <div className="small">
                          <b className="text-green">{plan.confidenceLabel} delivery confidence</b>
                          <div className="xs muted">Allocated from the best warehouse based on stock, distance, SLA and courier serviceability.</div>
                        </div>
                      </div>

                      {plan.split ? (
                        <div className="notice info mt-16">
                          <Package size={16} /> Items are in stock at different hubs, so your order ships in {plan.shipments.length} packages — no extra charge.
                        </div>
                      ) : null}

                      {plan.shipments.map((s, i) => (
                        <div key={s.warehouseId} className="shipment-plan">
                          <div className="row between wrap gap-6">
                            <b className="row gap-6">
                              <Warehouse size={16} style={{ color: s.warehouse.color }} /> Package {i + 1} · from {s.warehouse.name}
                            </b>
                            <span className="xs muted">
                              {s.km} km · dispatch {s.pastCutoff ? "tomorrow" : "today"} (cut-off {s.warehouse.cutoff})
                            </span>
                          </div>
                          <div className="row gap-6 mt-8 wrap">
                            {s.items.map((it) => {
                              const l = lines.find((x) => x.productId === it.productId);
                              return <Img key={it.productId} src={l?.image} alt="" className="plan-thumb" label="" />;
                            })}
                          </div>
                          <span className="label mt-12" style={{ display: "block" }}>
                            Courier partner <span className="xs muted">(via Shiprocket)</span>
                          </span>
                          <div className="courier-list">
                            {s.couriers.slice(0, 4).map((c) => {
                              const chosen = (courierChoice[s.warehouseId] || s.courierId) === c.id;
                              return (
                                <label key={c.id} className={cx("courier", chosen && "active")}>
                                  <input type="radio" checked={chosen} onChange={() => setCourierChoice({ ...courierChoice, [s.warehouseId]: c.id })} />
                                  <div className="grow">
                                    <b className="small">{c.name}</b>
                                    {c.id === s.courierId ? <span className="badge badge-soft-green" style={{ marginLeft: 6 }}>Recommended</span> : null}
                                    <div className="xs muted row gap-6">
                                      <Star size={11} fill="#f5a524" color="#f5a524" /> {c.rating} · {c.days} day{c.days > 1 ? "s" : ""} · {c.cod ? "COD" : "Prepaid"}
                                    </div>
                                  </div>
                                  <span className="xs faint">{dayLabel(Date.now() + c.days * 86400000)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <button className="btn btn-lg mt-16" onClick={() => setStep(3)}>
                        Continue to payment
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </section>

            {/* ---------- Payment ---------- */}
            <section className={cx("co-step", step === 3 && "open")}>
              <header className="co-head">
                <span className="co-num">3</span>
                <b className="grow">Payment</b>
                <span className="xs muted row gap-4">
                  <ShieldCheck size={14} /> 100% secure
                </span>
              </header>
              {step === 3 ? (
                <div className="co-body">
                  {failure ? (
                    <div className="pay-fail fade-up">
                      <XCircle size={28} />
                      <div className="grow">
                        <b>Payment unsuccessful</b>
                        <p className="small">{failure.error}</p>
                        <p className="xs muted mt-4">
                          Reserved stock was released. If money was debited, it'll be auto-refunded in 5–7 working days. Order {failure.orderId ? <b>{failure.orderId}</b> : null} is saved — retry within 15 minutes to keep your prices.
                        </p>
                        <div className="row gap-6 mt-12 wrap">
                          <button className="btn btn-sm" onClick={() => retry()} disabled={busy}>
                            <RefreshCcw size={14} /> Retry payment
                          </button>
                          {!codDisabledReason ? (
                            <button className="btn btn-sm btn-outline" onClick={() => { setMethod("cod"); setFailure(null); idem.current = `idem_${randomId(16)}`; }}>
                              Pay with COD instead
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="co-extras">
                    {walletAllowed && ((user.credits || 0) > 0 || coinBal > 0) ? (
                      <div className="co-extra">
                        <b className="small row gap-6"><Coins size={16} className="text-orange" /> Wallet & rewards</b>
                        {(user.credits || 0) > 0 ? (
                          <label className="check small mt-8">
                            <input type="checkbox" checked={ex.useCredits} onChange={(e) => setEx({ ...ex, useCredits: e.target.checked })} />
                            Use D2C credits <span className="muted">(balance {formatINR(user.credits)})</span>
                          </label>
                        ) : null}
                        {coinBal > 0 ? (
                          <label className="check small mt-8">
                            <input type="checkbox" checked={ex.useCoins} onChange={(e) => setEx({ ...ex, useCoins: e.target.checked })} />
                            Redeem D2C Coins <span className="muted">({coinBal} coins · up to 30% of items)</span>
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="co-extra">
                      <label className="check small">
                        <input type="checkbox" checked={ex.giftWrap} onChange={(e) => setEx({ ...ex, giftWrap: e.target.checked })} />
                        <Gift size={15} className="text-purple" /> <b>Gift wrap this order</b> <span className="muted">(+₹25 · price hidden on invoice)</span>
                      </label>
                      {ex.giftWrap ? <input className="input mt-8" maxLength={200} placeholder="Gift message (optional)" value={ex.giftMessage} onChange={(e) => setEx({ ...ex, giftMessage: e.target.value })} /> : null}
                    </div>
                    <div className="co-extra">
                      <label className="check small">
                        <input type="checkbox" checked={ex.gst} onChange={(e) => setEx({ ...ex, gst: e.target.checked })} />
                        <FileText size={15} className="text-blue" /> <b>Use GST invoice</b> <span className="muted">(claim input tax credit for business)</span>
                      </label>
                      {ex.gst ? (
                        <div className="form-grid mt-8">
                          <input className={cx("input", ex.gstin && !isGstin(ex.gstin) && "invalid")} placeholder="GSTIN (e.g. 29ABCDE1234F1Z5)" maxLength={15} value={ex.gstin} onChange={(e) => setEx({ ...ex, gstin: e.target.value.toUpperCase() })} />
                          <input className="input" placeholder="Registered business name" value={ex.businessName} onChange={(e) => setEx({ ...ex, businessName: e.target.value })} />
                        </div>
                      ) : null}
                    </div>
                    <div className="co-extra">
                      <b className="small row gap-6"><MessageSquare size={15} className="text-blue" /> Delivery preferences</b>
                      <div className="form-grid mt-8">
                        <select className="select" value={ex.slot} onChange={(e) => setEx({ ...ex, slot: e.target.value })}>
                          {["Anytime", "Morning (9 AM – 12 PM)", "Afternoon (12 PM – 4 PM)", "Evening (4 PM – 8 PM)", "Weekend only"].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                        <input className="input" maxLength={200} placeholder="Instructions for delivery partner (optional)" value={ex.instructions} onChange={(e) => setEx({ ...ex, instructions: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="pay-methods">
                    {PAYMENT_METHODS.map((m) => {
                      const Icon = METHOD_ICONS[m.id];
                      const disabled = m.id === "cod" && !!codDisabledReason;
                      return (
                        <label key={m.id} className={cx("radio-card", method === m.id && "active", disabled && "disabled-card")}>
                          <input type="radio" name="pay" disabled={disabled} checked={method === m.id} onChange={() => setMethod(m.id)} />
                          <span className="pay-icon">
                            <Icon size={18} />
                          </span>
                          <div className="grow">
                            <b className="small">{m.label}</b>
                            <p className="xs muted">{disabled ? codDisabledReason : m.id === "cod" ? `${m.sub} · ₹29 handling fee` : m.sub}</p>
                            {m.offer && !disabled ? <p className="xs text-green bold">{m.offer}</p> : null}
                            {method === m.id && m.id === "upi" && user.savedUpi?.length ? (
                              <p className="xs mt-4">
                                Saved: <b>{user.savedUpi[0]}</b>
                              </p>
                            ) : null}
                            {method === m.id && m.id === "card" && user.savedCards?.length ? (
                              <p className="xs mt-4">
                                Saved: <b>{user.savedCards[0].brand} •••• {user.savedCards[0].last4}</b> ({user.savedCards[0].bank})
                              </p>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <button className="btn btn-lg btn-block mt-16" onClick={pay} disabled={busy || !plan?.ok}>
                    <Lock size={17} /> {summary.total === 0 ? "Place order · paid with wallet" : method === "cod" ? `Place order · ${formatINR(summary.total)}` : `Pay ${formatINR(summary.total)} securely`}
                  </button>
                  <p className="xs muted center mt-8">
                    By placing this order you agree to D2C Mall's terms. Payments are processed by Razorpay and verified on our server.
                  </p>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="col gap-16 sticky-top">
            <div className="card card-pad">
              <b className="small">Order items ({lines.length})</b>
              <div className="co-items">
                {lines.map((l) => (
                  <div key={l.key} className="row gap-10">
                    <Img src={l.image} alt="" className="co-item-img" label="" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="xs ellipsis" style={{ display: "block" }}>
                        {l.name}
                      </b>
                      <span className="xs muted">
                        {[l.size, l.color, `Qty ${l.qty}`].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    <b className="xs">{formatINR(l.price * l.qty)}</b>
                  </div>
                ))}
              </div>
            </div>
            <CouponPanel paymentMethod={method} />
            <PriceDetails summary={summary} />
            <div className="card card-pad row gap-10">
              <MapPin size={16} className="text-blue" />
              <span className="xs muted">
                GST invoice will be generated for {user.name}. Tax included: {formatINR(summary.gst)}
              </span>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={!!stage && stage !== "awaiting_payment"} onClose={() => {}} hideHead>
        <div className="stage-box">
          {stage === "done" ? (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="stage-done">
              <CheckCircle2 size={56} />
              <b>Order confirmed!</b>
            </motion.div>
          ) : (
            <>
              <span className="spinner" style={{ width: 36, height: 36, color: "var(--blue)" }} />
              <b className="mt-12">Processing your order securely</b>
              <div className="stage-list">
                {STAGES.map((s, i) => {
                  const cur = STAGES.findIndex((x) => x.key === stage);
                  const state = i < cur ? "done" : i === cur ? "active" : "";
                  if (method === "cod" && ["creating_payment", "awaiting_payment", "verifying"].includes(s.key)) return null;
                  return (
                    <div key={s.key} className={cx("stage-row", state)}>
                      <span className="stage-dot">{state === "done" ? <Check size={11} /> : null}</span>
                      {s.label}
                    </div>
                  );
                })}
              </div>
              <p className="xs muted mt-12">
                <AlertTriangle size={12} /> Please don't refresh or press back.
              </p>
            </>
          )}
        </div>
      </Modal>
      <AnimatePresence />
    </div>
  );
}
