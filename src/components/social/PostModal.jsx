import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Bookmark, Heart, MessageCircle, Send, Share2, ShoppingBag } from "lucide-react";
import { productMap } from "../../data/catalog";
import { getCreator, seedComments } from "../../data/social";
import { useCurrentUser } from "../../lib/services/account";
import { addComment, sharePost, toggleFollow, toggleLike, toggleSave, useSocial } from "../../lib/services/social";
import { compact, cx, formatINR, timeAgo } from "../../lib/format";
import { Img, Modal } from "../common/ui";

export function PostActions({ post, onComment, onShop, vertical }) {
  const social = useSocial();
  const liked = !!social.likes?.[post.id];
  const saved = !!social.saves?.[post.id];
  const creator = getCreator(post.creatorId) || post.author;
  return (
    <div className={cx("post-actions", vertical && "vertical")}>
      <button className={cx(liked && "on-like")} onClick={() => toggleLike(post.id)} aria-label="Like">
        <Heart size={20} fill={liked ? "currentColor" : "none"} />
        <span>{compact(post.likes + (liked ? 1 : 0))}</span>
      </button>
      <button onClick={onComment} aria-label="Comments">
        <MessageCircle size={20} />
        <span>{compact(post.comments + (social.comments?.[post.id]?.length || 0))}</span>
      </button>
      <button className={cx(saved && "on-save")} onClick={() => toggleSave(post.id)} aria-label="Save">
        <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        <span>{compact(post.saves + (saved ? 1 : 0))}</span>
      </button>
      <button onClick={() => sharePost(post, creator)} aria-label="Share">
        <Share2 size={20} />
        <span>{compact(post.shares)}</span>
      </button>
      {post.productIds.length ? (
        <button className="shop" onClick={onShop} aria-label="Shop this look">
          <ShoppingBag size={20} />
          <span>Shop</span>
        </button>
      ) : null}
    </div>
  );
}

export function Hotspots({ post, onShop }) {
  const [active, setActive] = useState(null);
  return (
    <>
      {post.productIds.map((id, i) => {
        const p = productMap[id];
        if (!p) return null;
        const h = post.hotspots?.[i] || { x: 30 + i * 15, y: 40 + i * 10 };
        return (
          <button
            key={id}
            className="hotspot"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setActive(active === id ? null : id);
            }}
            aria-label={`Tagged: ${p.name}`}
          >
            <span className="hotspot-dot" />
            {active === id ? (
              <Link to={`/product/${p.id}`} className="hotspot-card" onClick={(e) => e.stopPropagation()}>
                <b>{p.brand}</b>
                <span className="ellipsis">{p.name}</span>
                <em>{formatINR(p.price)}</em>
              </Link>
            ) : null}
          </button>
        );
      })}
      {onShop && post.productIds.length ? (
        <button className="tag-pill" onClick={(e) => { e.stopPropagation(); onShop(); }}>
          <ShoppingBag size={13} /> {post.productIds.length} products tagged · Shop the look
        </button>
      ) : null}
    </>
  );
}

export default function PostModal({ post, open, onClose, onShop }) {
  const user = useCurrentUser();
  const social = useSocial();
  const [text, setText] = useState("");
  if (!post) return null;
  const creator = getCreator(post.creatorId) || post.author;
  const following = !!social.follows?.[creator?.id];
  const comments = [
    ...seedComments.slice(0, 4).map((t, i) => ({ id: `s${i}`, name: ["riya.k", "arjun_09", "meera.styles", "the.kabir"][i], text: t, at: post.createdAt + (i + 1) * 3600000 })),
    ...(social.comments?.[post.id] || []),
  ];

  return (
    <Modal open={open} onClose={onClose} size="wide" hideHead>
      <div className="post-modal">
        <div className="post-modal-media">
          <Img src={post.image} alt={post.caption} label={post.topic} />
          <Hotspots post={post} />
        </div>
        <div className="post-modal-side">
          <div className="row gap-10 post-modal-head">
            <img src={creator?.avatar} alt="" className="avatar" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            <div className="grow">
              <b className="small row gap-4">
                {creator?.name} {creator?.verified ? <BadgeCheck size={14} className="text-blue" /> : null}
              </b>
              <span className="xs muted">@{creator?.handle} · {timeAgo(post.createdAt)}</span>
            </div>
            {creator?.id && !creator.isUser ? (
              <button className={cx("btn btn-sm", following ? "btn-outline" : "btn-blue")} onClick={() => toggleFollow(creator.id, creator.name)}>
                {following ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
          <p className="small">{post.caption}</p>
          <div className="row wrap gap-6">
            {post.hashtags?.map((h) => (
              <span key={h} className="hash-tag">{h}</span>
            ))}
          </div>

          {post.productIds.length ? (
            <div className="post-products">
              {post.productIds.map((id) => {
                const p = productMap[id];
                return p ? (
                  <Link key={id} to={`/product/${id}`} className="post-product" onClick={onClose}>
                    <Img src={p.images[0]} alt="" label="" />
                    <span className="xs ellipsis">{p.name}</span>
                    <b className="xs">{formatINR(p.price)}</b>
                  </Link>
                ) : null;
              })}
            </div>
          ) : null}
          {post.productIds.length ? (
            <button className="btn btn-block" onClick={onShop}>
              <ShoppingBag size={16} /> Shop this look
            </button>
          ) : null}

          <PostActions post={post} onShop={onShop} onComment={() => document.getElementById("comment-input")?.focus()} />

          <div className="post-comments">
            {comments.map((c) => (
              <div key={c.id} className="comment">
                <b className="xs">{c.name}</b> <span className="xs">{c.text}</span>
                <span className="xs faint"> · {timeAgo(c.at)}</span>
              </div>
            ))}
          </div>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              addComment(post.id, user, text.trim());
              setText("");
            }}
          >
            <input id="comment-input" className="input" placeholder={user ? "Add a comment…" : "Login to comment"} disabled={!user} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-blue" type="submit" disabled={!user || !text.trim()} aria-label="Post comment">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
