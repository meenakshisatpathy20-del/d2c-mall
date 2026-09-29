/*
 * Reel/Post → Shop This Look → tagged products → add to cart.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Check, ShoppingBag, Sparkles, X } from "lucide-react";
import { productMap } from "../../data/catalog";
import { getCreator } from "../../data/social";
import { useShop } from "../../context/ShopContext";
import { formatINR, cx } from "../../lib/format";
import { stockOf } from "../../lib/services/inventory";
import { Drawer, Img, Price } from "../common/ui";
import { toast } from "../../lib/toast";

export default function ShopTheLook({ post, open, onClose }) {
  const { addToCart, inventory, applyCoupon, openCart } = useShop();
  const items = useMemo(() => (post?.productIds || []).map((id) => productMap[id]).filter(Boolean), [post]);
  const [sizes, setSizes] = useState({});
  const [selected, setSelected] = useState(() => new Set());
  const creator = post ? getCreator(post.creatorId) : null;

  const effectiveSelected = selected.size ? selected : new Set(items.map((p) => p.id));
  const total = items.filter((p) => effectiveSelected.has(p.id)).reduce((t, p) => t + p.price, 0);
  const mrp = items.filter((p) => effectiveSelected.has(p.id)).reduce((t, p) => t + p.mrp, 0);

  const toggle = (id) => {
    const next = new Set(effectiveSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const addAll = () => {
    const chosen = items.filter((p) => effectiveSelected.has(p.id));
    const missing = chosen.find((p) => p.sizes.length && !sizes[p.id]);
    if (missing) {
      toast.error(`Pick a size for ${missing.name}`);
      return;
    }
    let added = 0;
    chosen.forEach((p) => {
      if (addToCart(p, { size: sizes[p.id] || null, silent: true })) added += 1;
    });
    if (added) {
      applyCoupon("STREET10");
      toast(`${added} item${added > 1 ? "s" : ""} from the look added · STREET10 applied`);
      onClose();
      openCart();
    }
  };

  return (
    <Drawer open={open} onClose={onClose} width="min(100vw, 480px)">
      {post ? (
        <div className="stl">
          <div className="stl-head">
            <div className="row gap-6">
              <Sparkles size={18} className="text-orange" />
              <b>Shop this look</b>
            </div>
            <button className="icon-btn sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="stl-post">
            <Img src={post.image} alt="" className="stl-post-img" label="Look" />
            <div className="grow">
              <div className="row gap-6">
                <img src={creator?.avatar} alt="" className="avatar sm" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                <b className="small">@{creator?.handle}</b>
                {creator?.verified ? <BadgeCheck size={14} className="text-blue" /> : null}
              </div>
              <p className="small muted clamp-2 mt-4">{post.caption}</p>
              <span className="badge badge-soft-purple mt-8">Extra 10% off with STREET10</span>
            </div>
          </div>

          <div className="stl-list">
            {items.map((p) => {
              const on = effectiveSelected.has(p.id);
              const oos = stockOf(p.id, inventory).sellable <= 0;
              return (
                <div key={p.id} className={cx("stl-item", on && "on", oos && "oos")}>
                  <button type="button" className="stl-check" onClick={() => !oos && toggle(p.id)} aria-label={on ? "Deselect" : "Select"}>
                    {on && !oos ? <Check size={14} /> : null}
                  </button>
                  <Link to={`/product/${p.id}`} onClick={onClose}>
                    <Img src={p.images[0]} alt={p.name} className="stl-thumb" label={p.brand} />
                  </Link>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="small">{p.brand}</b>
                    <div className="xs muted ellipsis">{p.name}</div>
                    <Price price={p.price} mrp={p.mrp} />
                    {oos ? (
                      <span className="xs text-red bold">Out of stock</span>
                    ) : p.sizes.length ? (
                      <div className="stl-sizes">
                        {p.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={p.soldOutSizes?.includes(s)}
                            className={cx(sizes[p.id] === s && "active")}
                            onClick={() => setSizes({ ...sizes, [p.id]: s })}
                          >
                            {s.replace("UK ", "")}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stl-foot">
            <div>
              <div className="xs muted">{effectiveSelected.size} items · look total</div>
              <div className="row gap-6">
                <b style={{ fontSize: 20 }}>{formatINR(total)}</b>
                {mrp > total ? <span className="strike faint small">{formatINR(mrp)}</span> : null}
              </div>
            </div>
            <button className="btn btn-lg" onClick={addAll}>
              <ShoppingBag size={18} /> Add look to bag
            </button>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
