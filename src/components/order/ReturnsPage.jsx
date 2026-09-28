import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Banknote, Calendar, Check, CreditCard, MapPin, Package, Repeat, RotateCcw, Wallet, XCircle } from "lucide-react";
import { useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { deliveredAt, deriveOrderStatus } from "../../lib/orderModel";
import { RETURN_LABEL, cancelReturn, requestReturn, returnEvents, returnStatus, returnWindowOpen } from "../../lib/services/orders";
import { useNow } from "../../lib/services/liveSync";
import { cx, formatDate, formatDateTime, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Empty, Img, useDocumentTitle } from "../common/ui";
import "./ReturnsPage.css";

const REASONS = [
  "Size too small",
  "Size too large",
  "Product damaged / defective",
  "Received wrong item",
  "Quality not as expected",
  "Colour different from image",
  "Changed my mind",
];

const FLOW = ["requested", "approved", "pickup_scheduled", "picked_up", "qc_passed", "refund_initiated", "refunded"];

function slots() {
  const out = [];
  for (let d = 1; d <= 3; d += 1) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const label = d === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    out.push(`${label}, 9 AM – 1 PM`, `${label}, 2 PM – 7 PM`);
  }
  return out;
}

function NewReturn({ user, orders, onDone }) {
  const [params] = useSearchParams();
  const now = useNow(10000);
  const returns = useStore((s) => s.returns);
  const eligibleOrders = orders.filter((o) => deriveOrderStatus(o, now) === "delivered");
  const [orderId, setOrderId] = useState(params.get("order") || eligibleOrders[0]?.id || "");
  const order = orders.find((o) => o.id === orderId);
  const dAt = order ? deliveredAt(order, now) : null;
  const eligibleLines = order
    ? order.items.filter((i) => returnWindowOpen(order, i, dAt) && !returns.some((r) => r.lineIds.includes(i.lineId) && r.status !== "cancelled"))
    : [];
  const [lines, setLines] = useState(() => (params.get("line") ? [params.get("line")] : []));
  const [type, setType] = useState("return");
  const [reason, setReason] = useState(REASONS[0]);
  const [comment, setComment] = useState("");
  const [slot, setSlot] = useState(slots()[0]);
  const [refund, setRefund] = useState("original");
  const [addressId, setAddressId] = useState(user.addresses.find((a) => a.pincode === order?.address.pincode)?.id || user.addresses[0]?.id);

  const chosen = eligibleLines.filter((i) => lines.includes(i.lineId));
  const amount = chosen.reduce((t, i) => t + i.price * i.qty, 0);

  const submit = () => {
    if (!chosen.length) return toast.error("Select at least one item");
    requestReturn({ order, lineIds: chosen.map((i) => i.lineId), reason, comment, type, pickupSlot: slot, refundMethod: refund, userId: user.id });
    toast(type === "exchange" ? "Exchange requested — pickup scheduled" : "Return requested — pickup scheduled");
    onDone();
  };

  if (!eligibleOrders.length)
    return <Empty icon={<RotateCcw size={34} />} title="No delivered orders to return" text="Items can be returned within their return window after delivery." action={<Link to="/orders" className="btn">My orders</Link>} />;

  return (
    <div className="ret-form">
      <section className="card card-pad">
        <b className="ret-step">1. Select order & items</b>
        <select className="select mt-12" value={orderId} onChange={(e) => { setOrderId(e.target.value); setLines([]); }}>
          {eligibleOrders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id} · delivered · {o.items.length} item(s) · {formatINR(o.pricing.total)}
            </option>
          ))}
        </select>
        <div className="col gap-10 mt-12">
          {order?.items.map((i) => {
            const eligible = eligibleLines.includes(i);
            return (
              <label key={i.lineId} className={cx("radio-card", lines.includes(i.lineId) && "active", !eligible && "disabled-card")}>
                <input type="checkbox" disabled={!eligible} checked={lines.includes(i.lineId)} onChange={() => setLines(lines.includes(i.lineId) ? lines.filter((x) => x !== i.lineId) : [...lines, i.lineId])} />
                <Img src={i.image} alt="" className="ret-img" label="" />
                <div className="grow">
                  <b className="small">{i.brand}</b>
                  <div className="xs muted">{i.name}</div>
                  <div className="xs faint">{[i.size && `Size ${i.size}`, `Qty ${i.qty}`].filter(Boolean).join(" · ")}</div>
                  {!eligible ? <span className="xs text-red">{i.returnDays ? "Return window closed or already requested" : "Non-returnable item"}</span> : <span className="xs text-green">Returnable till {formatDate(dAt + i.returnDays * 86400000)}</span>}
                </div>
                <b className="small">{formatINR(i.price * i.qty)}</b>
              </label>
            );
          })}
        </div>
      </section>

      <section className="card card-pad">
        <b className="ret-step">2. Return or exchange?</b>
        <div className="grid grid-2 mt-12">
          <label className={cx("radio-card", type === "return" && "active")}>
            <input type="radio" checked={type === "return"} onChange={() => setType("return")} />
            <div>
              <b className="small row gap-6"><RotateCcw size={15} /> Return for refund</b>
              <p className="xs muted">Get your money back after pickup & quality check</p>
            </div>
          </label>
          <label className={cx("radio-card", type === "exchange" && "active")}>
            <input type="radio" checked={type === "exchange"} onChange={() => setType("exchange")} />
            <div>
              <b className="small row gap-6"><Repeat size={15} /> Exchange size</b>
              <p className="xs muted">We'll ship the new size as soon as it's picked up</p>
            </div>
          </label>
        </div>
        <div className="field mt-16">
          <label>Reason</label>
          <div className="chips" style={{ flexWrap: "wrap" }}>
            {REASONS.map((r) => (
              <button key={r} type="button" className={cx("chip", reason === r && "active")} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="field mt-16">
          <label>Additional comments (optional)</label>
          <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us more so we can improve" />
        </div>
      </section>

      <section className="card card-pad">
        <b className="ret-step">3. Pickup</b>
        <div className="grid grid-2 mt-12">
          <div className="field">
            <label className="row gap-6"><MapPin size={14} /> Pickup address</label>
            <select className="select" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
              {user.addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label || a.type} · {a.line1}, {a.city} {a.pincode}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="row gap-6"><Calendar size={14} /> Pickup slot</label>
            <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {slots().map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="xs muted mt-8">Keep the item unused with original tags and packaging. Our courier partner will verify the item at pickup.</p>
      </section>

      {type === "return" ? (
        <section className="card card-pad">
          <b className="ret-step">4. Refund method</b>
          <div className="col gap-10 mt-12">
            {[
              ["original", CreditCard, "Original payment method", order?.payment.method === "cod" ? "Not available for COD orders" : `${order?.payment.instrument} · 3–5 working days`, order?.payment.method === "cod"],
              ["credits", Wallet, "D2C Mall credits", "Instant after pickup · use on your next order", false],
              ["bank", Banknote, "Bank account (NEFT/IMPS)", "Add account details · 2–3 working days", false],
            ].map(([id, Icon, t, s, disabled]) => (
              <label key={id} className={cx("radio-card", refund === id && "active", disabled && "disabled-card")}>
                <input type="radio" disabled={disabled} checked={refund === id} onChange={() => setRefund(id)} />
                <Icon size={18} className="text-blue" />
                <div>
                  <b className="small">{t}</b>
                  <p className="xs muted">{s}</p>
                </div>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <div className="ret-submit">
        <div>
          <span className="xs muted">{chosen.length} item(s) selected</span>
          <b style={{ display: "block", fontSize: 18 }}>{type === "exchange" ? "Free exchange" : `Refund ${formatINR(amount)}`}</b>
        </div>
        <button className="btn btn-lg" onClick={submit} disabled={!chosen.length}>
          Confirm {type}
        </button>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  useDocumentTitle("Returns & refunds");
  const user = useCurrentUser();
  const all = useStore((s) => s.returns);
  const orders = useStore((s) => s.orders);
  const now = useNow(4000);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get("order") ? "new" : "list");
  const mine = useMemo(() => all.filter((r) => r.userId === user.id), [all, user.id]);
  const myOrders = useMemo(() => orders.filter((o) => o.userId === user.id), [orders, user.id]);

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Account", to: "/account" }, { label: "Returns & refunds" }]} />
        <div className="row between wrap gap-16 mb-16">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Returns & refunds</h1>
            <p className="small muted">Doorstep pickup · refund after quality check · exchange for a different size</p>
          </div>
          <div className="seg">
            <button className={cx(tab === "list" && "active")} onClick={() => setTab("list")}>
              My returns ({mine.length})
            </button>
            <button className={cx(tab === "new" && "active")} onClick={() => setTab("new")}>
              + New return
            </button>
          </div>
        </div>

        {tab === "new" ? (
          <NewReturn user={user} orders={myOrders} onDone={() => setTab("list")} />
        ) : mine.length ? (
          <div className="col gap-16">
            {mine.map((r) => {
              const order = orders.find((o) => o.id === r.orderId);
              const items = order?.items.filter((i) => r.lineIds.includes(i.lineId)) || [];
              const st = returnStatus(r, now);
              const idx = FLOW.indexOf(st === "exchange_shipped" ? "refund_initiated" : st);
              const cancellable = ["requested", "approved", "pickup_scheduled"].includes(st);
              return (
                <article key={r.id} className="ret-card">
                  <header className="row between wrap gap-10">
                    <div>
                      <b>
                        {r.type === "exchange" ? "Exchange" : "Return"} #{r.id}
                      </b>
                      <div className="xs muted">
                        Order {r.orderId} · requested {formatDateTime(r.createdAt)} · {r.reason}
                      </div>
                    </div>
                    <span className={cx("badge", st === "cancelled" ? "badge-soft-gray" : st === "refunded" || st === "exchange_shipped" ? "badge-soft-green" : "badge-soft-amber")}>{RETURN_LABEL[st]}</span>
                  </header>
                  <div className="row gap-10 wrap mt-12">
                    {items.map((i) => (
                      <div key={i.lineId} className="row gap-10">
                        <Img src={i.image} alt="" className="ret-img" label="" />
                        <span className="xs">
                          <b>{i.brand}</b>
                          <span className="muted" style={{ display: "block" }}>{i.name}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {st !== "cancelled" ? (
                    <div className="ret-flow">
                      {FLOW.filter((f) => !(r.type === "exchange" && f === "refunded")).map((f, i) => (
                        <div key={f} className={cx("ret-flow-step", i < idx && "done", i === idx && "current")}>
                          <span>{i < idx || (i === idx && ["refunded", "exchange_shipped"].includes(st)) ? <Check size={11} /> : null}</span>
                          <em>{r.type === "exchange" && f === "refund_initiated" ? "Replacement shipped" : RETURN_LABEL[f].replace("Return ", "")}</em>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-3 mt-12 ret-meta">
                    <div>
                      <span className="xs muted">Pickup</span>
                      <b className="small">{r.pickupSlot}</b>
                    </div>
                    <div>
                      <span className="xs muted">{r.type === "exchange" ? "Exchange" : "Refund"}</span>
                      <b className="small">{r.type === "exchange" ? "New size ships after pickup" : `${formatINR(r.refundAmount)} → ${r.refundMethod === "credits" ? "D2C credits" : r.refundMethod === "bank" ? "Bank account" : "Original method"}`}</b>
                    </div>
                    <div>
                      <span className="xs muted">Latest update</span>
                      <b className="small">{returnEvents(r, now).slice(-1)[0]?.note}</b>
                    </div>
                  </div>
                  <div className="row gap-6 mt-12">
                    {cancellable ? (
                      <button
                        className="btn btn-sm btn-ghost text-red"
                        onClick={() => {
                          const res = cancelReturn(r.id);
                          res.ok ? toast("Return cancelled") : toast.error(res.error);
                        }}
                      >
                        <XCircle size={14} /> Cancel return
                      </button>
                    ) : null}
                    <Link to={`/orders/${r.orderId}`} className="btn btn-sm btn-outline">
                      <Package size={14} /> View order
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty icon={<RotateCcw size={34} />} title="No returns yet" text="Return or exchange delivered items within their return window." action={<button className="btn" onClick={() => setTab("new")}>Start a return</button>} />
        )}
      </div>
    </div>
  );
}
