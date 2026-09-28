import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Camera, MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { getReviews } from "../../data/reviews";
import { useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { addReview } from "../../lib/services/orders";
import { compact, cx, formatDate } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Img, Modal, RatingChip, SectionHead, Stars } from "../common/ui";
import "./ProductReviews.css";

export function ReviewForm({ product, open, onClose }) {
  const user = useCurrentUser();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [fit, setFit] = useState("true");
  const submit = () => {
    if (!text.trim() || text.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    addReview(product.id, { name: user?.name || "Customer", city: "India", rating, title: title || (rating >= 4 ? "Loved it" : "Honest review"), text, fit });
    toast("Thanks! Your review is live 🎉");
    onClose();
    setText("");
    setTitle("");
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Review ${product.name}`}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit}>Submit review</button>
        </>
      }
    >
      <div className="col gap-16">
        <div className="col gap-6">
          <span className="label">Your rating</span>
          <Stars value={rating} onChange={setRating} size={28} />
        </div>
        {product.sizeChart ? (
          <div className="col gap-6">
            <span className="label">How was the fit?</span>
            <div className="seg">
              {[["small", "Runs small"], ["true", "True to size"], ["large", "Runs large"]].map(([v, l]) => (
                <button key={v} type="button" className={cx(fit === v && "active")} onClick={() => setFit(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" maxLength={80} />
        </div>
        <div className="field">
          <label>Your review</label>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you like or dislike? How's the quality?" maxLength={1000} />
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => toast.info("Photo upload is available in the app")}>
          <Camera size={15} /> Add photos
        </button>
      </div>
    </Modal>
  );
}

export default function ProductReviews({ product }) {
  const user = useCurrentUser();
  const userReviews = useStore((s) => s.userReviews);
  const [sort, setSort] = useState("helpful");
  const [filter, setFilter] = useState(0);
  const [writing, setWriting] = useState(false);
  const [helpful, setHelpful] = useState({});
  const data = useMemo(() => getReviews(product), [product]);
  const mine = userReviews[product.id] || [];

  const list = useMemo(() => {
    let all = [...mine, ...data.list];
    if (filter) all = all.filter((r) => r.rating === filter);
    if (sort === "recent") all.sort((a, b) => b.date - a.date);
    else if (sort === "high") all.sort((a, b) => b.rating - a.rating);
    else if (sort === "low") all.sort((a, b) => a.rating - b.rating);
    else all.sort((a, b) => b.helpful - a.helpful);
    return all;
  }, [data, mine, sort, filter]);

  const total = data.distribution.reduce((a, b) => a + b, 0) || 1;
  const photos = data.list.filter((r) => r.withPhoto);

  return (
    <section className="section" id="reviews">
      <SectionHead
        eyebrow={<><Star size={13} /> Ratings & reviews</>}
        title="What customers are saying"
        action={
          user ? (
            <button className="btn btn-outline btn-sm" onClick={() => setWriting(true)}>
              <MessageSquarePlus size={15} /> Write a review
            </button>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm">
              Login to review
            </Link>
          )
        }
      />
      <div className="reviews-grid">
        <div className="card card-pad reviews-summary">
          <div className="row gap-16">
            <div className="big-rating">
              {product.rating.toFixed(1)}
              <Star size={26} fill="#12b76a" color="#12b76a" />
            </div>
            <div className="small muted">
              {compact(product.ratingCount)} ratings &
              <br />
              {compact(product.reviewCount)} reviews
            </div>
          </div>
          <div className="col gap-6 mt-16">
            {[5, 4, 3, 2, 1].map((n, i) => (
              <button key={n} className={cx("dist-row", filter === n && "active")} onClick={() => setFilter(filter === n ? 0 : n)}>
                <span className="xs bold">{n}★</span>
                <div className={cx("progress", n >= 4 ? "green" : n === 3 ? "" : "red")}>
                  <span style={{ width: `${(data.distribution[i] / total) * 100}%` }} />
                </div>
                <span className="xs muted">{compact(data.distribution[i])}</span>
              </button>
            ))}
          </div>
          {data.fit ? (
            <div className="fit mt-16">
              <span className="label">Size & fit</span>
              <div className="fit-bar mt-8">
                <span style={{ width: `${data.fit.small}%` }} title="Runs small" />
                <span style={{ width: `${data.fit.true}%` }} title="True to size" />
                <span style={{ width: `${data.fit.large}%` }} title="Runs large" />
              </div>
              <div className="row between xs muted mt-4">
                <span>Small {data.fit.small}%</span>
                <b className="text-green">True to size {data.fit.true}%</b>
                <span>Large {data.fit.large}%</span>
              </div>
            </div>
          ) : null}
          {photos.length ? (
            <div className="mt-16">
              <span className="label">Customer photos</span>
              <div className="review-photos mt-8">
                {photos.map((r) => (
                  <Img key={r.id} src={r.withPhoto} alt="" label="" />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="col gap-16">
          <div className="row between wrap gap-16">
            <div className="chips">
              {[0, 5, 4, 3].map((n) => (
                <button key={n} className={cx("chip", filter === n && "active")} onClick={() => setFilter(n)}>
                  {n ? `${n}★` : "All"}
                </button>
              ))}
            </div>
            <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="helpful">Most helpful</option>
              <option value="recent">Most recent</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </select>
          </div>
          {list.length ? (
            list.map((r) => (
              <article key={r.id} className="review">
                <div className="row gap-6">
                  <RatingChip rating={r.rating} />
                  <b className="small">{r.title}</b>
                </div>
                <p className="small mt-8">{r.text}</p>
                {r.withPhoto ? <Img src={r.withPhoto} alt="" className="review-img mt-8" label="" /> : null}
                <div className="row between wrap mt-12 xs muted">
                  <span className="row gap-6">
                    {r.name} · {r.city} · {formatDate(r.date)}
                    {r.verified ? (
                      <span className="row gap-4 text-green bold">
                        <BadgeCheck size={13} /> Verified buyer
                      </span>
                    ) : null}
                    {r.size ? <span>· Size {r.size}</span> : null}
                  </span>
                  <button className={cx("helpful", helpful[r.id] && "on")} onClick={() => setHelpful({ ...helpful, [r.id]: !helpful[r.id] })}>
                    <ThumbsUp size={13} /> Helpful ({r.helpful + (helpful[r.id] ? 1 : 0)})
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="muted small">No reviews match this filter.</p>
          )}
        </div>
      </div>
      <ReviewForm product={product} open={writing} onClose={() => setWriting(false)} />
    </section>
  );
}
