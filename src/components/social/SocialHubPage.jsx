import { useMemo, useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Heart,
  MessageCircle,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProductById, products } from "../../data/catalog";
import "./SocialHubPage.css";

const initialPosts = [
  {
    id: "social-001",
    type: "OOTD",
    creator: "Aarohi",
    handle: "@aarohistyle",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
    caption: "Weekend fits that actually feel effortless.",
    tags: ["Street Style", "Casual"],
    productIds: ["d2c-women-001", "d2c-footwear-001"],
    likes: 2840,
    comments: 94,
    shares: 41,
    following: false,
    saved: false,
    liked: false
  },
  {
    id: "social-002",
    type: "TRENDING",
    creator: "Meera",
    handle: "@meeramood",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
    caption: "Minimal jewellery + everyday neutrals.",
    tags: ["Minimal", "Jewellery"],
    productIds: ["d2c-jewellery-001", "d2c-women-002"],
    likes: 1932,
    comments: 61,
    shares: 28,
    following: true,
    saved: false,
    liked: false
  },
  {
    id: "social-003",
    type: "BEAUTY",
    creator: "Nisha",
    handle: "@nishaglow",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
    caption: "My simple glow routine before heading out.",
    tags: ["Beauty", "Glow"],
    productIds: ["d2c-beauty-001"],
    likes: 4210,
    comments: 132,
    shares: 76,
    following: false,
    saved: true,
    liked: true
  },
  {
    id: "social-004",
    type: "STYLE",
    creator: "Kabir",
    handle: "@kabirfits",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    caption: "One oversized tee, three different looks.",
    tags: ["Menswear", "Streetwear"],
    productIds: ["d2c-men-001", "d2c-footwear-001"],
    likes: 3287,
    comments: 87,
    shares: 52,
    following: false,
    saved: false,
    liked: false
  },
  {
    id: "social-005",
    type: "HOME",
    creator: "Rhea",
    handle: "@rheahome",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
    caption: "Tiny room refresh with just a few changes.",
    tags: ["Home", "Decor"],
    productIds: ["d2c-home-001"],
    likes: 1765,
    comments: 48,
    shares: 25,
    following: true,
    saved: false,
    liked: false
  },
  {
    id: "social-006",
    type: "TRENDING",
    creator: "Dev",
    handle: "@devstreet",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
    caption: "The colours everyone is wearing this season.",
    tags: ["Trending", "Fashion"],
    productIds: ["d2c-women-002", "d2c-jewellery-001"],
    likes: 2511,
    comments: 73,
    shares: 44,
    following: false,
    saved: false,
    liked: false
  }
];

const categories = [
  "For You",
  "Trending",
  "OOTD",
  "Beauty",
  "Street Style",
  "Home",
  "Creators"
];

const formatCount = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value;
};

function ProductStrip({ productIds, onShop }) {
  const taggedProducts = productIds
    .map((id) => getProductById(id))
    .filter(Boolean);

  if (!taggedProducts.length) return null;

  return (
    <div className="social-products">
      {taggedProducts.map((product) => (
        <button
          type="button"
          className="social-product"
          key={product.id}
          onClick={() => onShop(product)}
        >
          <img src={product.image} alt={product.name} />
          <span>
            <strong>{product.brand}</strong>
            <small>{product.name}</small>
            <b>₹{product.price.toLocaleString("en-IN")}</b>
          </span>
          <ShoppingBag size={15} />
        </button>
      ))}
    </div>
  );
}

function SocialPost({ post, onLike, onSave, onFollow, onComment, onShare, onShop }) {
  return (
    <article className="social-post">
      <div className="social-post-image-wrap">
        <img
          className="social-post-image"
          src={post.image}
          alt={post.caption}
        />

        <span className="social-post-type">{post.type}</span>

        <button
          className={`social-save ${post.saved ? "active" : ""}`}
          type="button"
          onClick={() => onSave(post.id)}
          aria-label="Save post"
        >
          <Bookmark
            size={18}
            fill={post.saved ? "currentColor" : "none"}
          />
        </button>

        <div className="social-image-gradient" />

        <div className="social-post-creator">
          <img src={post.avatar} alt={post.creator} />

          <div>
            <strong>{post.creator}</strong>
            <span>{post.handle}</span>
          </div>

          <button
            type="button"
            className={post.following ? "following" : ""}
            onClick={() => onFollow(post.id)}
          >
            {post.following ? (
              <CheckCircle2 size={13} />
            ) : (
              <UserPlus size={13} />
            )}
            {post.following ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      <div className="social-post-content">
        <p>{post.caption}</p>

        <div className="social-tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag.replace(/\s/g, "")}</span>
          ))}
        </div>

        <ProductStrip productIds={post.productIds} onShop={onShop} />

        <div className="social-post-actions">
          <button
            type="button"
            className={post.liked ? "liked" : ""}
            onClick={() => onLike(post.id)}
          >
            <Heart
              size={17}
              fill={post.liked ? "currentColor" : "none"}
            />
            {formatCount(post.likes)}
          </button>

          <button type="button" onClick={() => onComment(post)}>
            <MessageCircle size={17} />
            {formatCount(post.comments)}
          </button>

          <button type="button" onClick={() => onShare(post)}>
            <Share2 size={17} />
            {formatCount(post.shares)}
          </button>

          <button
            className="shop-look-button"
            type="button"
            onClick={() => onShop(post)}
          >
            Shop this look
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function UploadPanel({ onClose, onSubmit }) {
  const [type, setType] = useState("OOTD");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage({
      file,
      preview: URL.createObjectURL(file)
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!caption.trim()) return;

    onSubmit?.({
      type,
      caption: caption.trim(),
      image: image?.preview || null,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="social-modal-backdrop">
      <div className="social-upload-modal">
        <button
          className="social-modal-close"
          type="button"
          onClick={onClose}
        >
          <X size={19} />
        </button>

        <span className="social-modal-label">CREATE WITH D2C</span>
        <h2>Share your style</h2>
        <p>Post an OOTD, beauty look, home setup or fashion tip.</p>

        <form onSubmit={handleSubmit}>
          <div className="social-upload-types">
            {["OOTD", "BEAUTY", "STYLE", "HOME"].map((item) => (
              <button
                type="button"
                className={type === item ? "active" : ""}
                key={item}
                onClick={() => setType(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="social-upload-box">
            {image ? (
              <img src={image.preview} alt="Upload preview" />
            ) : (
              <>
                <ImagePlusIcon />
                <strong>Add a photo or video</strong>
                <small>JPG, PNG or MP4</small>
              </>
            )}

            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImage}
            />
          </label>

          <label className="social-upload-field">
            <span>Caption</span>
            <textarea
              rows={4}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Tell the community about your look..."
              maxLength={300}
            />
          </label>

          <button className="social-upload-submit" type="submit">
            <Plus size={17} />
            Publish post
          </button>
        </form>
      </div>
    </div>
  );
}

function ImagePlusIcon() {
  return (
    <div className="social-upload-icon">
      <Plus size={24} />
    </div>
  );
}

export default function SocialHubPage({
  posts = initialPosts,
  onLike,
  onSave,
  onFollow,
  onComment,
  onShare,
  onShopLook,
  onUpload
}) {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("For You");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [localPosts, setLocalPosts] = useState(posts);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return localPosts.filter((post) => {
      const categoryMatch =
        activeCategory === "For You" ||
        activeCategory === "Creators" ||
        post.type === activeCategory.toUpperCase() ||
        post.tags.some(
          (tag) => tag.toLowerCase() === activeCategory.toLowerCase()
        );

      const searchMatch =
        !query ||
        post.creator.toLowerCase().includes(query) ||
        post.handle.toLowerCase().includes(query) ||
        post.caption.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query));

      return categoryMatch && searchMatch;
    });
  }, [localPosts, activeCategory, search]);

  const updatePost = (id, updater) => {
    setLocalPosts((current) =>
      current.map((post) =>
        post.id === id ? updater(post) : post
      )
    );
  };

  const handleLike = (id) => {
    updatePost(id, (post) => ({
      ...post,
      liked: !post.liked,
      likes: post.liked ? post.likes - 1 : post.likes + 1
    }));

    onLike?.(id);
  };

  const handleSave = (id) => {
    updatePost(id, (post) => ({
      ...post,
      saved: !post.saved
    }));

    onSave?.(id);
  };

  const handleFollow = (id) => {
    updatePost(id, (post) => ({
      ...post,
      following: !post.following
    }));

    onFollow?.(id);
  };

  const handleComment = (post) => {
    onComment?.(post);
  };

  const handleShare = async (post) => {
    const shareData = {
      title: post.caption,
      text: `${post.caption} — ${post.handle}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        return;
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }

    onShare?.(post);
  };

  const handleShop = (product) => {
    if (product?.id) {
      navigate(`/product/${product.id}`);
      return;
    }

    if (Array.isArray(product?.productIds)) {
      onShopLook?.(product);
      return;
    }

    onShopLook?.(product);
  };

  const handleUpload = (payload) => {
    const newPost = {
      id: `social-${Date.now()}`,
      type: payload.type,
      creator: "You",
      handle: "@you",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      image:
        payload.image ||
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
      caption: payload.caption,
      tags: [payload.type],
      productIds: [],
      likes: 0,
      comments: 0,
      shares: 0,
      following: false,
      saved: false,
      liked: false
    };

    setLocalPosts((current) => [newPost, ...current]);
    setShowUpload(false);
    onUpload?.(payload);
  };

  return (
    <main className="social-hub-page">
      <section className="social-hero">
        <div className="social-hero-copy">
          <span className="social-eyebrow">
            <Sparkles size={14} />
            D2C STREET
          </span>

          <h1>
            Discover it.
            <br />
            <strong>Wear it.</strong>
            <br />
            Share it.
          </h1>

          <p>
            Fashion, beauty, lifestyle and real customer looks — all in one
            place.
          </p>

          <div className="social-hero-actions">
            <button
              type="button"
              onClick={() => setShowUpload(true)}
            >
              <Plus size={17} />
              Share your style
            </button>

            <span>
              <Users size={15} />
              18K+ people sharing
            </span>
          </div>
        </div>

        <div className="social-hero-collage">
          {localPosts.slice(0, 3).map((post, index) => (
            <div
              className={`social-hero-image image-${index + 1}`}
              key={post.id}
            >
              <img src={post.image} alt={post.caption} />
            </div>
          ))}

          <div className="social-hero-floating">
            <Heart size={15} fill="currentColor" />
            <span>Trending now</span>
          </div>
        </div>
      </section>

      <section className="social-discovery">
        <div className="social-discovery-top">
          <div>
            <span>COMMUNITY DISCOVERY</span>
            <h2>What's happening on D2C</h2>
          </div>

          <div className="social-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search creators, styles, trends..."
            />
          </div>
        </div>

        <div className="social-category-tabs">
          {categories.map((category) => (
            <button
              type="button"
              className={activeCategory === category ? "active" : ""}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="social-feed">
          {filteredPosts.map((post) => (
            <SocialPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
              onFollow={handleFollow}
              onComment={handleComment}
              onShare={handleShare}
              onShop={handleShop}
            />
          ))}
        </div>

        {!filteredPosts.length && (
          <div className="social-empty">
            <Search size={28} />
            <h3>No posts found</h3>
            <p>Try another creator, category or trend.</p>
          </div>
        )}
      </section>

      <section className="social-community-banner">
        <div>
          <span>YOUR STYLE MATTERS</span>
          <h2>Turn your everyday look into inspiration.</h2>
          <p>
            Share your outfit, tag products and let other shoppers discover
            your style.
          </p>
        </div>

        <button type="button" onClick={() => setShowUpload(true)}>
          Create a post
          <ChevronRight size={17} />
        </button>
      </section>

      {showUpload && (
        <UploadPanel
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
        />
      )}
    </main>
  );
}