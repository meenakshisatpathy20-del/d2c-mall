import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CreditCard, HelpCircle, MessageCircleQuestion, Plus, ShoppingBag, ThumbsUp } from "lucide-react";
import { products } from "../../data/catalog";
import { useShop } from "../../context/ShopContext";
import { useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { askQuestion, productQuestions, upvoteQuestion } from "../../lib/services/extras";
import { cx, formatINR, timeAgo } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Img, Modal, SectionHead } from "../common/ui";

/* ---------- No-cost EMI ---------- */

const BANKS = ["HDFC Bank", "ICICI Bank", "SBI Card", "Axis Bank", "Kotak", "Bajaj Finserv"];

export function EmiOffers({ price }) {
  const [open, setOpen] = useState(false);
  const [bank, setBank] = useState(BANKS[0]);
  if (price < 3000) return null;
  const plans = [3, 6, 9, 12].map((m) => {
    const noCost = m <= 6;
    const rate = noCost ? 0 : 0.14;
    const r = rate / 12;
    const emi = noCost ? price / m : (price * r * (1 + r) ** m) / ((1 + r) ** m - 1);
    return { m, emi: Math.ceil(emi), interest: Math.max(0, Math.round(emi * m - price)), noCost };
  });
  return (
    <>
      <button className="emi-line" onClick={() => setOpen(true)}>
        <CreditCard size={15} /> No Cost EMI from <b>{formatINR(Math.ceil(price / 6))}/month</b> · <span className="link">View plans</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="EMI plans" size="mid">
        <div className="chips mb-16">
          {BANKS.map((b) => (
            <button key={b} className={cx("chip", bank === b && "active")} onClick={() => setBank(b)}>
              {b}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tenure</th>
                <th>Monthly EMI</th>
                <th>Interest</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.m}>
                  <td>
                    <b>{p.m} months</b> {p.noCost ? <span className="badge badge-soft-green">No cost</span> : null}
                  </td>
                  <td>{formatINR(p.emi)}</td>
                  <td>{p.noCost ? "₹0" : formatINR(p.interest)}</td>
                  <td>{formatINR(price + p.interest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xs muted mt-12">
          {bank} credit cards · interest @14% p.a. for 9–12 months. No Cost EMI interest is given as an upfront discount. Choose EMI at payment (Razorpay).
        </p>
      </Modal>
    </>
  );
}

/* ---------- Frequently bought together ---------- */

export function BoughtTogether({ product }) {
  const { addToCart, openQuickView } = useShop();
  const combo = useMemo(() => {
    const pick = (cat) => products.filter((p) => p.category === cat && p.id !== product.id && !p.sizes.length).sort((a, b) => b.ratingCount - a.ratingCount)[0];
    const cats = { women: ["jewellery", "lifestyle"], men: ["lifestyle", "electronics"], footwear: ["lifestyle", "beauty"], beauty: ["beauty", "lifestyle"], jewellery: ["jewellery", "beauty"], electronics: ["electronics", "lifestyle"], "home-living": ["home-living", "lifestyle"], lifestyle: ["jewellery", "beauty"] }[product.category] || [];
    return [product, ...cats.map(pick).filter(Boolean).filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)].slice(0, 3);
  }, [product]);
  const [sel, setSel] = useState(() => new Set(combo.map((p) => p.id)));
  if (combo.length < 2) return null;
  const chosen = combo.filter((p) => sel.has(p.id));
  const total = chosen.reduce((t, p) => t + p.price, 0);
  const mrp = chosen.reduce((t, p) => t + p.mrp, 0);

  const addAll = () => {
    let n = 0;
    chosen.forEach((p) => {
      if (p.sizes.length) {
        if (p.id === product.id) toast.info("Select a size for this item above, then add it to bag");
        else openQuickView(p.id);
        return;
      }
      if (addToCart(p, { silent: true })) n += 1;
    });
    if (n) toast(`${n} item${n > 1 ? "s" : ""} added to bag`);
  };

  return (
    <section className="section">
      <SectionHead eyebrow="Save more together" title="Frequently bought together" />
      <div className="fbt">
        <div className="fbt-items">
          {combo.map((p, i) => (
            <div key={p.id} className="row gap-10">
              {i > 0 ? <Plus size={18} className="faint" /> : null}
              <label className={cx("fbt-item", sel.has(p.id) && "on")}>
                <input type="checkbox" checked={sel.has(p.id)} disabled={p.id === product.id} onChange={() => { const n = new Set(sel); n.has(p.id) ? n.delete(p.id) : n.add(p.id); setSel(n); }} />
                <Img src={p.images[0]} alt="" label={p.brand} />
                <span className="xs ellipsis">{p.id === product.id ? "This item" : p.name}</span>
                <b className="small">{formatINR(p.price)}</b>
              </label>
            </div>
          ))}
        </div>
        <div className="fbt-total">
          <span className="xs muted">{chosen.length} items</span>
          <b style={{ fontSize: 22 }}>{formatINR(total)}</b>
          <span className="xs"><span className="strike faint">{formatINR(mrp)}</span> <span className="text-green bold">save {formatINR(mrp - total)}</span></span>
          <button className="btn mt-8" onClick={addAll}>
            <ShoppingBag size={16} /> Add {chosen.length} to bag
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Questions & answers ---------- */

export function ProductQA({ product }) {
  const user = useCurrentUser();
  const stored = useStore((s) => s.questions) || {};
  const [q, setQ] = useState("");
  const [voted, setVoted] = useState({});
  const [showAll, setShowAll] = useState(false);
  const list = productQuestions(product.id, stored);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim().length < 8) return toast.error("Please type a complete question");
    askQuestion(product.id, user, q);
    setQ("");
    toast("Question posted — the brand usually answers within a day");
  };

  return (
    <section className="section" id="qa">
      <SectionHead eyebrow={<><MessageCircleQuestion size={13} /> Questions & answers</>} eyebrowTone="blue" title="Have a question?" sub={`${list.length} answered questions`} />
      <div className="card card-pad">
        <form className="row" onSubmit={submit}>
          <div className="input-group grow">
            <span className="addon"><HelpCircle size={15} /></span>
            <input className="input" placeholder={user ? "Ask about size, material, delivery…" : "Login to ask a question"} disabled={!user} value={q} onChange={(e) => setQ(e.target.value)} maxLength={200} />
          </div>
          {user ? (
            <button className="btn btn-blue" type="submit">Ask</button>
          ) : (
            <Link to="/login" className="btn btn-outline">Login</Link>
          )}
        </form>
        <div className="qa-list">
          {list.slice(0, showAll ? 50 : 4).map((x) => (
            <div key={x.id} className="qa">
              <b className="small">Q: {x.q}</b>
              {x.a ? (
                <p className="small mt-4">
                  <span className="bold text-green">A:</span> {x.a}
                </p>
              ) : (
                <p className="xs muted mt-4">Awaiting answer from the brand…</p>
              )}
              <div className="row between xs muted mt-8">
                <span className="row gap-4">
                  {x.a ? <><BadgeCheck size={12} className="text-blue" /> {x.answeredBy} · </> : null}asked by {x.by} · {timeAgo(x.at)}
                </span>
                <button className={cx("helpful", voted[x.id] && "on")} disabled={voted[x.id]} onClick={() => { upvoteQuestion(product.id, x.id); setVoted({ ...voted, [x.id]: true }); }}>
                  <ThumbsUp size={12} /> {x.up + (voted[x.id] && !stored[product.id]?.some((s) => s.id === x.id) ? 1 : 0)}
                </button>
              </div>
            </div>
          ))}
        </div>
        {list.length > 4 ? (
          <button className="link small mt-12" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show less" : `See all ${list.length} questions`}
          </button>
        ) : null}
      </div>
    </section>
  );
}
