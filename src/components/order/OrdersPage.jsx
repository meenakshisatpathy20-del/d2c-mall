import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, CreditCard, FileText, HelpCircle, Package, RefreshCcw, RotateCcw, Search, ShoppingBag, Star, Truck, XCircle } from "lucide-react";
import { useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { useShop } from "../../context/ShopContext";
import { productMap } from "../../data/catalog";
import { ORDER_STATUS, deliveredAt, deriveOrderStatus, orderEta, orderTab } from "../../lib/orderModel";
import { canCancel } from "../../lib/services/orders";
import { useNow } from "../../lib/services/liveSync";
import { cx, dayLabel, formatDate, formatINR } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Empty, Img, StatusPill, useDocumentTitle } from "../common/ui";
import { CancelModal, InvoiceModal, ShipmentProgress, SupportModal } from "./OrderBits";
import "./OrdersPage.css";

const TABS = [
  { id: "all", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
  { id: "returned", label: "Returned" },
];

const RANGES = [
  { id: "all", label: "All time", ms: Infinity },
  { id: "30", label: "Last 30 days", ms: 30 * 86400000 },
  { id: "180", label: "Last 6 months", ms: 180 * 86400000 },
];

export default function OrdersPage() {
  useDocumentTitle("My orders");
  const user = useCurrentUser();
  const all = useStore((s) => s.orders);
  const now = useNow(5000);
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "all";
  const [q, setQ] = useState("");
  const [range, setRange] = useState("all");
  const [pay, setPay] = useState("all");
  const [invoice, setInvoice] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [support, setSupport] = useState(null);

  const mine = useMemo(
    () => all.filter((o) => o.userId === user.id).map((o) => ({ ...o, live: deriveOrderStatus(o, now) })),
    [all, user.id, now]
  );

  const counts = useMemo(() => {
    const c = { all: mine.length };
    mine.forEach((o) => {
      const t = orderTab(o.live);
      c[t] = (c[t] || 0) + 1;
    });
    return c;
  }, [mine]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const r = RANGES.find((x) => x.id === range);
    return mine.filter((o) => {
      if (tab !== "all" && orderTab(o.live) !== tab) return false;
      if (Date.now() - o.createdAt > r.ms) return false;
      if (pay !== "all" && (pay === "cod" ? o.payment.method !== "cod" : o.payment.method === "cod")) return false;
      if (!term) return true;
      return o.id.toLowerCase().includes(term) || o.items.some((i) => `${i.name} ${i.brand} ${i.sku}`.toLowerCase().includes(term));
    });
  }, [mine, tab, q, range, pay]);

  const stats = useMemo(() => {
    const valid = mine.filter((o) => !["cancelled", "payment_failed", "pending_payment"].includes(o.live));
    return {
      spent: valid.reduce((t, o) => t + o.pricing.total, 0),
      saved: valid.reduce((t, o) => t + o.pricing.savings, 0),
      active: mine.filter((o) => ["confirmed", "processing", "shipped", "out_for_delivery"].includes(o.live)).length,
    };
  }, [mine]);

  const buyAgain = (o) => {
    let n = 0;
    o.items.forEach((i) => {
      const p = productMap[i.productId];
      if (p && addToCart(p, { size: i.size, color: i.color, silent: true })) n += 1;
    });
    if (n) {
      toast(`${n} item${n > 1 ? "s" : ""} added to bag`);
      navigate("/cart");
    }
  };

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Account", to: "/account" }, { label: "Orders" }]} />
        <div className="orders-hero">
          <div>
            <span className="eyebrow light">
              <Package size={13} /> Orders dashboard
            </span>
            <h1>My orders</h1>
            <p>Track, return or buy things again. Live updates from Shiprocket every few seconds.</p>
          </div>
          <div className="orders-stats">
            <div>
              <b>{mine.length}</b>
              <span>orders</span>
            </div>
            <div>
              <b>{stats.active}</b>
              <span>in progress</span>
            </div>
            <div>
              <b>{formatINR(stats.spent)}</b>
              <span>total spent</span>
            </div>
            <div>
              <b className="text-green">{formatINR(stats.saved)}</b>
              <span>total saved</span>
            </div>
          </div>
        </div>

        <div className="tabs mt-24">
          {TABS.map((t) => (
            <button key={t.id} className={cx("tab", tab === t.id && "active")} onClick={() => setTab(t.id)}>
              {t.label} <span className="count">{counts[t.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="orders-filters">
          <div className="input-group grow" style={{ maxWidth: 420 }}>
            <span className="addon">
              <Search size={15} />
            </span>
            <input className="input" placeholder="Search by order ID, product, brand or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: "auto" }} value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: "auto" }} value={pay} onChange={(e) => setPay(e.target.value)}>
            <option value="all">All payments</option>
            <option value="prepaid">Prepaid</option>
            <option value="cod">Cash on Delivery</option>
          </select>
        </div>

        {list.length ? (
          <div className="col gap-16">
            {list.map((o) => {
              const status = o.live;
              const dAt = deliveredAt(o, now);
              const retryable = status === "payment_failed" && Date.now() - o.createdAt < 60 * 60000;
              return (
                <article key={o.id} className="order-card">
                  <header className="order-head">
                    <div className="order-meta">
                      <div>
                        <span className="xs muted">Order placed</span>
                        <b className="small">{formatDate(o.createdAt)}</b>
                      </div>
                      <div>
                        <span className="xs muted">Total</span>
                        <b className="small">{formatINR(o.pricing.total)}</b>
                      </div>
                      <div>
                        <span className="xs muted">Payment</span>
                        <b className="small row gap-4">
                          <CreditCard size={13} /> {o.payment.method === "cod" ? "COD" : o.payment.method.toUpperCase()}
                        </b>
                      </div>
                      <div>
                        <span className="xs muted">Ship to</span>
                        <b className="small">{o.address.name.split(" ")[0]} · {o.address.city}</b>
                      </div>
                    </div>
                    <div className="row gap-6">
                      <span className="xs muted">#{o.id}</span>
                      <StatusPill status={status} />
                    </div>
                  </header>

                  <div className="order-body">
                    <div className="order-items">
                      {o.items.slice(0, 3).map((i) => (
                        <Link key={i.lineId} to={`/product/${i.productId}`} className="order-item">
                          <Img src={i.image} alt="" className="order-img" label={i.brand} />
                          <div style={{ minWidth: 0 }}>
                            <b className="small">{i.brand}</b>
                            <div className="xs muted ellipsis">{i.name}</div>
                            <div className="xs faint">{[i.size && `Size ${i.size}`, i.color, `Qty ${i.qty}`].filter(Boolean).join(" · ")}</div>
                          </div>
                        </Link>
                      ))}
                      {o.items.length > 3 ? <span className="xs muted">+{o.items.length - 3} more</span> : null}
                    </div>

                    <div className="order-status">
                      {status === "delivered" ? (
                        <p className="small">
                          <b className="text-green">Delivered on {formatDate(dAt, { year: false })}</b>
                        </p>
                      ) : status === "cancelled" ? (
                        <p className="small">
                          <b className="muted">Cancelled</b>
                          {o.payment.status === "refund_initiated" || o.payment.status === "refunded" ? <span className="xs muted" style={{ display: "block" }}>Refund {o.payment.status.replace("_", " ")}</span> : null}
                        </p>
                      ) : status === "payment_failed" ? (
                        <p className="small">
                          <b className="text-red">Payment not completed</b>
                          <span className="xs muted" style={{ display: "block" }}>Stock released. {retryable ? "You can retry now." : "Place the order again."}</span>
                        </p>
                      ) : status === "returned" || status === "return_requested" ? (
                        <p className="small">
                          <b className="text-orange">{ORDER_STATUS[status].label}</b>
                        </p>
                      ) : (
                        <p className="small">
                          Arriving <b className="text-green">{dayLabel(orderEta(o))}</b>
                          {o.shipments.length > 1 ? <span className="xs muted"> · {o.shipments.length} shipments</span> : null}
                        </p>
                      )}
                      {o.shipments.length && !["cancelled", "payment_failed"].includes(status) ? (
                        <div className="col gap-6 mt-8">
                          {o.shipments.map((s) => (
                            <ShipmentProgress key={s.id} shipment={s} now={now} compact />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="order-actions">
                      {["confirmed", "processing", "shipped", "out_for_delivery"].includes(status) ? (
                        <Link to={`/orders/${o.id}`} className="btn btn-sm">
                          <Truck size={14} /> Track order
                        </Link>
                      ) : null}
                      {retryable ? (
                        <Link to={`/orders/${o.id}`} className="btn btn-sm btn-blue">
                          <RefreshCcw size={14} /> Retry payment
                        </Link>
                      ) : null}
                      <Link to={`/orders/${o.id}`} className="btn btn-sm btn-outline">
                        View details <ChevronRight size={14} />
                      </Link>
                      {!["payment_failed", "pending_payment"].includes(status) ? (
                        <button className="btn btn-sm btn-outline" onClick={() => setInvoice(o)}>
                          <FileText size={14} /> Invoice
                        </button>
                      ) : null}
                      {status === "delivered" ? (
                        <>
                          <Link to={`/returns?order=${o.id}`} className="btn btn-sm btn-outline">
                            <RotateCcw size={14} /> Return / exchange
                          </Link>
                          <Link to={`/orders/${o.id}#review`} className="btn btn-sm btn-outline">
                            <Star size={14} /> Rate & review
                          </Link>
                        </>
                      ) : null}
                      {canCancel({ ...o, status }) ? (
                        <button className="btn btn-sm btn-ghost text-red" onClick={() => setCancel(o)}>
                          <XCircle size={14} /> Cancel
                        </button>
                      ) : null}
                      <button className="btn btn-sm btn-soft" onClick={() => buyAgain(o)}>
                        <ShoppingBag size={14} /> Buy again
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setSupport(o)}>
                        <HelpCircle size={14} /> Help
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            icon={<Package size={34} />}
            title={mine.length ? "No orders match" : "No orders yet"}
            text={mine.length ? "Try a different tab, date range or search." : "When you place an order, it'll show up here with live tracking."}
            action={<Link to="/shop" className="btn">Start shopping</Link>}
          />
        )}
      </div>
      <InvoiceModal order={invoice} open={!!invoice} onClose={() => setInvoice(null)} />
      <CancelModal key={cancel?.id} order={cancel} open={!!cancel} onClose={() => setCancel(null)} />
      <SupportModal order={support} user={user} open={!!support} onClose={() => setSupport(null)} />
    </div>
  );
}
