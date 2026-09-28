import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Camera, Eye, Flame, Hash, Heart, ImagePlus, Play, Plus, Search, ShoppingBag, Sparkles, TrendingUp, Users, X } from "lucide-react";
import { creators, getCreator, posts as seedPosts, trendingHashtags } from "../../data/social";
import { products } from "../../data/catalog";
import { setState, useStore } from "../../lib/store";
import { useCurrentUser } from "../../lib/services/account";
import { toggleFollow, useSocial } from "../../lib/services/social";
import { compact, cx, uid } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Img, Modal, useDocumentTitle } from "../common/ui";
import PostModal, { Hotspots } from "./PostModal";
import ShopTheLook from "./ShopTheLook";
import "./D2CStreetPage.css";

const FEEDS = [
  { id: "foryou", label: "For you", icon: Sparkles },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "following", label: "Following", icon: Users },
  { id: "ootd", label: "OOTD", icon: Camera },
  { id: "Fashion", label: "Fashion" },
  { id: "Beauty", label: "Beauty" },
  { id: "Tech", label: "Tech" },
  { id: "Home", label: "Home" },
];

export function useAllPosts() {
  const userPosts = useStore((s) => s.social.userPosts);
  return useMemo(() => [...(userPosts || []), ...seedPosts], [userPosts]);
}

function CreatePost({ open, onClose }) {
  const user = useCurrentUser();
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [q, setQ] = useState("");
  const [tags, setTags] = useState([]);
  const matches = q ? products.filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image");
    if (f.size > 4 * 1024 * 1024) return toast.error("Image must be under 4 MB");
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(f);
  };

  const publish = () => {
    if (!image) return toast.error("Add a photo of your look");
    if (!caption.trim()) return toast.error("Write a caption");
    const post = {
      id: uid("upost"),
      creatorId: `user-${user.id}`,
      author: { id: `user-${user.id}`, name: user.name, handle: user.email.split("@")[0], avatar: "", isUser: true },
      type: "ootd",
      image,
      caption: caption.trim(),
      hashtags: ["#OOTD", ...(caption.match(/#\w+/g) || [])].slice(0, 4),
      topic: "OOTD",
      productIds: tags,
      hotspots: tags.map((_, i) => ({ x: 25 + i * 18, y: 35 + i * 12 })),
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      views: 1,
      createdAt: Date.now(),
      trendingScore: 50,
    };
    setState((st) => ({ ...st, social: { ...st.social, userPosts: [post, ...(st.social.userPosts || [])] } }));
    toast("Your look is live on D2C Street ✨");
    setImage(null);
    setCaption("");
    setTags([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Share your look" size="mid" footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn" onClick={publish}>Post to D2C Street</button></>}>
      {!user ? (
        <div className="notice info">
          <Link to="/login?next=/d2c-street" className="link">Login</Link> to post your OOTD.
        </div>
      ) : (
        <div className="create-grid">
          <label className="upload-box">
            {image ? <img src={image} alt="Preview" /> : (
              <>
                <ImagePlus size={30} />
                <b className="small">Upload a photo</b>
                <span className="xs muted">JPG or PNG, up to 4 MB</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={onFile} hidden />
          </label>
          <div className="col gap-16">
            <div className="field">
              <label>Caption</label>
              <textarea className="textarea" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Weekend brunch fit ☀️ #OOTD #LinenSzn" maxLength={300} />
            </div>
            <div className="field">
              <label>Tag products you're wearing</label>
              <div className="input-group">
                <span className="addon"><Search size={15} /></span>
                <input className="input" placeholder="Search products or brands" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {matches.length ? (
                <div className="tag-results">
                  {matches.map((p) => (
                    <button key={p.id} type="button" onClick={() => { if (!tags.includes(p.id) && tags.length < 5) setTags([...tags, p.id]); setQ(""); }}>
                      <Img src={p.images[0]} alt="" label="" /> <span className="xs">{p.brand} · {p.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="row wrap gap-6 mt-8">
                {tags.map((id) => {
                  const p = products.find((x) => x.id === id);
                  return (
                    <span key={id} className="chip active-blue">
                      {p.name} <button type="button" onClick={() => setTags(tags.filter((t) => t !== id))} aria-label="Remove tag"><X size={12} /></button>
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="xs muted">Posts are checked by our community team. Tagged products become shoppable via "Shop this look".</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function D2CStreetPage() {
  useDocumentTitle("D2C Street");
  const [params, setParams] = useSearchParams();
  const all = useAllPosts();
  const social = useSocial();
  const [feed, setFeed] = useState("foryou");
  const [tag, setTag] = useState(null);
  const [open, setOpen] = useState(null);
  const [look, setLook] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const id = params.get("post");
    if (id) setOpen(all.find((p) => p.id === id) || null);
  }, [params, all]);

  const list = useMemo(() => {
    let l = [...all];
    if (feed === "trending") l.sort((a, b) => b.likes + b.shares * 3 - (a.likes + a.shares * 3));
    else if (feed === "following") l = l.filter((p) => social.follows?.[p.creatorId]);
    else if (feed === "ootd") l = l.filter((p) => p.type === "ootd" || p.hashtags?.includes("#OOTD"));
    else if (feed !== "foryou") l = l.filter((p) => (getCreator(p.creatorId)?.niche || "").includes(feed) || p.topic.includes(feed) || (feed === "Fashion" && ["Streetwear", "Menswear", "Ethnic", "Jewellery"].includes(getCreator(p.creatorId)?.niche)));
    if (tag) l = l.filter((p) => p.hashtags?.includes(tag));
    return l;
  }, [all, feed, tag, social.follows]);

  const openPost = (p) => {
    setOpen(p);
    setParams({ post: p.id }, { replace: true });
  };
  const closePost = () => {
    setOpen(null);
    setParams({}, { replace: true });
  };

  return (
    <div className="page street">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "D2C Street" }]} />
        <div className="street-hero">
          <div>
            <span className="eyebrow light">
              <Users size={13} /> D2C Street · social commerce
            </span>
            <h1>
              Don't just shop.
              <br />
              <span>Find your style.</span>
            </h1>
            <p>Real people. Real fits. Real trends. Discover looks from creators and the D2C community — and shop every piece you see.</p>
            <div className="row gap-6 wrap mt-16">
              <button className="btn btn-lg" onClick={() => setCreating(true)}>
                <Plus size={18} /> Share your look
              </button>
              <Link to="/social" className="btn btn-lg btn-glass">
                <Play size={17} fill="currentColor" /> Watch reels
              </Link>
            </div>
          </div>
          <div className="street-collage">
            {all.slice(0, 5).map((p, i) => (
              <motion.button key={p.id} className={`sc-${i}`} onClick={() => openPost(p)} initial={{ opacity: 0, y: 20, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: [-6, 4, -2, 5, -4][i] }} transition={{ delay: 0.1 * i }}>
                <Img src={p.image} alt="" label={p.topic} />
              </motion.button>
            ))}
            <div className="street-live">
              <span className="live-dot" /> <b>24.8K</b> people shopping the street
            </div>
          </div>
        </div>

        <div className="street-creators">
          {creators.map((c) => {
            const following = !!social.follows?.[c.id];
            return (
              <div key={c.id} className="creator">
                <div className="creator-ring">
                  <img src={c.avatar} alt={c.name} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                </div>
                <b className="xs row gap-4">
                  {c.handle} {c.verified ? <BadgeCheck size={12} className="text-blue" /> : null}
                </b>
                <span className="xs muted">{compact(c.followers + (following ? 1 : 0))} · {c.niche}</span>
                <button className={cx("btn btn-xs", following ? "btn-outline" : "btn-blue")} onClick={() => toggleFollow(c.id, c.name)}>
                  {following ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="street-bar">
          <div className="chips">
            {FEEDS.map((f) => (
              <button key={f.id} className={cx("chip", feed === f.id && "active")} onClick={() => setFeed(f.id)}>
                {f.icon ? <f.icon size={14} /> : null} {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row wrap gap-6 mb-16">
          <span className="xs muted row gap-4">
            <TrendingUp size={13} /> Trending:
          </span>
          {trendingHashtags.map((h) => (
            <button key={h} className={cx("hash-tag", tag === h && "on")} onClick={() => setTag(tag === h ? null : h)}>
              <Hash size={11} />
              {h.slice(1)}
            </button>
          ))}
        </div>

        {list.length ? (
          <div className="masonry">
            {list.map((p, i) => {
              const c = getCreator(p.creatorId) || p.author;
              return (
                <motion.article key={p.id} className="street-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.05 }}>
                  <div className={cx("street-media", i % 3 === 0 ? "tall" : i % 3 === 1 ? "mid" : "short")} onClick={() => openPost(p)}>
                    <Img src={p.image} alt={p.caption} label={p.topic} />
                    <Hotspots post={p} onShop={() => setLook(p)} />
                    <span className="street-type">
                      {p.type === "reel" ? <Play size={11} fill="currentColor" /> : p.type === "ootd" ? <Camera size={11} /> : null} {p.type}
                    </span>
                    {p.views ? (
                      <span className="street-views">
                        <Eye size={11} /> {compact(p.views)}
                      </span>
                    ) : null}
                  </div>
                  <div className="street-body">
                    <div className="row gap-6">
                      {c?.avatar ? <img src={c.avatar} alt="" className="avatar sm" onError={(e) => (e.currentTarget.style.visibility = "hidden")} /> : <span className="avatar sm">{c?.name?.[0]}</span>}
                      <b className="xs grow ellipsis">@{c?.handle}</b>
                      <span className="xs muted row gap-4">
                        <Heart size={12} /> {compact(p.likes + (social.likes?.[p.id] ? 1 : 0))}
                      </span>
                    </div>
                    <p className="xs clamp-2 mt-8">{p.caption}</p>
                    {p.productIds.length ? (
                      <button className="street-shop" onClick={() => setLook(p)}>
                        <ShoppingBag size={13} /> Shop this look · {p.productIds.length}
                      </button>
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon"><Users size={30} /></div>
            <h3>{feed === "following" ? "Follow creators to fill your feed" : "No looks here yet"}</h3>
            <p>Try another tab or share your own look.</p>
          </div>
        )}
      </div>

      <PostModal
        key={open?.id}
        post={open}
        open={!!open}
        onClose={closePost}
        onShop={() => {
          setLook(open);
          closePost();
        }}
      />
      <ShopTheLook key={look?.id} post={look} open={!!look} onClose={() => setLook(null)} />
      <CreatePost open={creating} onClose={() => setCreating(false)} />
      <button className="fab" onClick={() => setCreating(true)} aria-label="Share your look">
        <Plus size={22} />
      </button>
    </div>
  );
}
