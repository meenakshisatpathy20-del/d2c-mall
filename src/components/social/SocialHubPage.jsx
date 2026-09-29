/*
 * Reels — full-height, snap-scrolling vertical feed.
 * Reel → Shop This Look → tagged products → add to cart.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Music2, ShoppingBag, Volume2, VolumeX } from "lucide-react";
import { productMap } from "../../data/catalog";
import { getCreator } from "../../data/social";
import { toggleFollow, useSocial } from "../../lib/services/social";
import { cx, formatINR } from "../../lib/format";
import { Img, useDocumentTitle } from "../common/ui";
import PostModal, { Hotspots, PostActions } from "./PostModal";
import ShopTheLook from "./ShopTheLook";
import { useAllPosts } from "./D2CStreetPage";
import "./SocialHubPage.css";

function Reel({ post, active, onShop, onComments, muted }) {
  const social = useSocial();
  const c = getCreator(post.creatorId) || post.author;
  const following = !!social.follows?.[c?.id];
  const first = productMap[post.productIds[0]];
  return (
    <section className={cx("reel", active && "active")} data-id={post.id}>
      <div className="reel-frame">
        <div className="reel-kenburns">
          <Img src={post.image} alt={post.caption} label={post.topic} eager={active} />
        </div>
        <div className="reel-progress">
          <span />
        </div>
        <Hotspots post={post} />
        <div className="reel-info">
          <div className="row gap-10">
            {c?.avatar ? <img src={c.avatar} alt="" className="avatar" onError={(e) => (e.currentTarget.style.visibility = "hidden")} /> : <span className="avatar">{c?.name?.[0]}</span>}
            <b className="small row gap-4">
              @{c?.handle} {c?.verified ? <BadgeCheck size={14} /> : null}
            </b>
            {c?.id && !c.isUser ? (
              <button className="reel-follow" onClick={() => toggleFollow(c.id, c.name)}>
                {following ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
          <p className="small mt-8">{post.caption}</p>
          <p className="xs mt-4" style={{ opacity: 0.85 }}>{post.hashtags?.join(" ")}</p>
          {post.music ? (
            <p className="xs row gap-6 mt-8">
              <Music2 size={13} /> {post.music} {muted ? "· muted" : ""}
            </p>
          ) : null}
          {first ? (
            <button className="reel-product" onClick={onShop}>
              <Img src={first.images[0]} alt="" label="" />
              <span className="grow" style={{ minWidth: 0 }}>
                <b className="xs ellipsis" style={{ display: "block" }}>{first.name}</b>
                <span className="xs">{formatINR(first.price)} {post.productIds.length > 1 ? `· +${post.productIds.length - 1} more` : ""}</span>
              </span>
              <span className="reel-product-cta">
                <ShoppingBag size={14} /> Shop look
              </span>
            </button>
          ) : null}
        </div>
        <div className="reel-rail">
          <PostActions post={post} vertical onShop={onShop} onComment={onComments} />
        </div>
      </div>
    </section>
  );
}

export default function SocialHubPage() {
  useDocumentTitle("Reels");
  const posts = useAllPosts();
  const [params] = useSearchParams();
  const [active, setActive] = useState(params.get("post") || posts[0]?.id);
  const [look, setLook] = useState(null);
  const [comments, setComments] = useState(null);
  const [muted, setMuted] = useState(true);
  const feed = useRef(null);

  // order: requested post first
  const start = params.get("post");
  const ordered = start ? [...posts.filter((p) => p.id === start), ...posts.filter((p) => p.id !== start)] : posts;

  useEffect(() => {
    const root = feed.current;
    if (!root) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.id)),
      { root, threshold: 0.6 }
    );
    root.querySelectorAll(".reel").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ordered.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (!feed.current) return;
      if (e.key === "ArrowDown") feed.current.scrollBy({ top: feed.current.clientHeight, behavior: "smooth" });
      if (e.key === "ArrowUp") feed.current.scrollBy({ top: -feed.current.clientHeight, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="reels-page">
      <div className="reels-top">
        <Link to="/d2c-street" className="reels-back">
          <ArrowLeft size={18} /> D2C Street
        </Link>
        <b>Reels</b>
        <button className="reels-back" onClick={() => setMuted(!muted)} aria-label="Toggle sound">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <div className="reels-feed" ref={feed}>
        {ordered.map((p) => (
          <Reel key={p.id} post={p} active={active === p.id} muted={muted} onShop={() => setLook(p)} onComments={() => setComments(p)} />
        ))}
      </div>
      <p className="reels-hint xs">Scroll or use ↑ ↓ to browse · tap dots to see tagged products</p>
      <ShopTheLook key={look?.id} post={look} open={!!look} onClose={() => setLook(null)} />
      <PostModal key={comments?.id} post={comments} open={!!comments} onClose={() => setComments(null)} onShop={() => { setLook(comments); setComments(null); }} />
    </div>
  );
}
