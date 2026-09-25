import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  Heart,
  MessageCircle,
  Play,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./D2CStreetPage.css";

const TABS = [
  "For You",
  "Trending",
  "OOTD",
  "Street Style",
  "Beauty",
  "Creators",
];

const SAMPLE_POSTS = [
  {
    id: "street-001",
    creator: "Aarohi",
    handle: "@aarohi.style",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    type: "OOTD",
    caption:
      "Minimal neutrals with a little street energy.",
    likes: 18400,
    comments: 342,
    shares: 126,
    products: [
      {
        id: "d2c-women-001",
        name: "Relaxed Fit Cotton Shirt",
        price: 899,
      },
      {
        id: "d2c-footwear-001",
        name: "Everyday Street Sneakers",
        price: 1499,
      },
    ],
    tags: ["ootd", "streetstyle", "minimal"],
    following: false,
  },
  {
    id: "street-002",
    creator: "Riya",
    handle: "@riyagetsready",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    type: "Street Style",
    caption:
      "The oversized tee + sneakers combo never misses.",
    likes: 29100,
    comments: 581,
    shares: 213,
    products: [
      {
        id: "d2c-men-001",
        name: "Premium Oversized T-Shirt",
        price: 699,
      },
      {
        id: "d2c-footwear-001",
        name: "Everyday Street Sneakers",
        price: 1499,
      },
    ],
    tags: ["streetwear", "trending", "oversized"],
    following: true,
  },
  {
    id: "street-003",
    creator: "Meher",
    handle: "@beautybymeher",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
    type: "Beauty",
    caption:
      "Five minute glow-up before heading out.",
    likes: 12600,
    comments: 204,
    shares: 91,
    products: [
      {
        id: "d2c-beauty-001",
        name: "Hydrating Glow Face Serum",
        price: 549,
      },
    ],
    tags: ["beauty", "glow", "skincare"],
    following: false,
  },
  {
    id: "street-004",
    creator: "Kabir",
    handle: "@kabirfits",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=80",
    type: "Street Style",
    caption:
      "Clean fit. Loud sneakers. Done.",
    likes: 9800,
    comments: 147,
    shares: 62,
    products: [
      {
        id: "d2c-men-001",
        name: "Premium Oversized T-Shirt",
        price: 699,
      },
      {
        id: "d2c-footwear-001",
        name: "Everyday Street Sneakers",
        price: 1499,
      },
    ],
    tags: ["menswear", "street", "dailyfit"],
    following: false,
  },
  {
    id: "street-005",
    creator: "Ananya",
    handle: "@ananyadaily",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    type: "Trending",
    caption:
      "What I would wear all week if I could.",
    likes: 22300,
    comments: 389,
    shares: 154,
    products: [
      {
        id: "d2c-women-002",
        name: "Flowy Printed Midi Dress",
        price: 1299,
      },
      {
        id: "d2c-jewellery-001",
        name: "Minimal Gold-Tone Necklace",
        price: 799,
      },
    ],
    tags: ["trendalert", "fashion", "ootd"],
    following: true,
  },
  {
    id: "street-006",
    creator: "Dev",
    handle: "@devstyles",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
    type: "Creators",
    caption:
      "Three pieces. Ten different looks.",
    likes: 7600,
    comments: 121,
    shares: 48,
    products: [
      {
        id: "d2c-men-001",
        name: "Premium Oversized T-Shirt",
        price: 699,
      },
    ],
    tags: ["styling", "mensfashion", "howtowear"],
    following: false,
  },
];

const TRENDING_TAGS = [
  "#streetwear",
  "#ootd",
  "#oldmoney",
  "#minimal",
  "#beautytok",
  "#collegefits",
  "#sneakerhead",
  "#indianfashion",
];

const CREATOR_SPOTLIGHT = [
  {
    name: "Aarohi",
    handle: "@aarohi.style",
    followers: "42.8K",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Riya",
    handle: "@riyagetsready",
    followers: "81.2K",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Kabir",
    handle: "@kabirfits",
    followers: "29.6K",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Meher",
    handle: "@beautybymeher",
    followers: "64.5K",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
];

const formatCount = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return String(value);
};

function SocialPostCard({
  post,
  onOpen,
  onShop,
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] =
    useState(post.following);

  return (
    <motion.article
      className="street-post-card"
      layout
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      <button
        type="button"
        className="street-post-media"
        onClick={() => onOpen?.(post)}
      >
        <img
          src={post.image}
          alt={`${post.creator} style`}
        />

        <span className="street-media-type">
          <Play size={11} fill="currentColor" />
          {post.type}
        </span>

        <span className="street-product-count">
          <ShoppingBag size={11} />
          {post.products.length} products
        </span>
      </button>

      <div className="street-post-body">
        <header className="street-post-user">
          <img
            src={post.avatar}
            alt={post.creator}
          />

          <div>
            <strong>{post.creator}</strong>
            <span>{post.handle}</span>
          </div>

          <button
            type="button"
            className={
              following
                ? "following"
                : ""
            }
            onClick={() =>
              setFollowing(
                (current) => !current
              )
            }
          >
            {following ? (
              "Following"
            ) : (
              <>
                <UserPlus size={12} />
                Follow
              </>
            )}
          </button>
        </header>

        <p className="street-post-caption">
          {post.caption}
        </p>

        <div className="street-post-tags">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>

        <div className="street-post-actions">
          <button
            type="button"
            className={liked ? "active" : ""}
            onClick={() =>
              setLiked(
                (current) => !current
              )
            }
          >
            <Heart
              size={16}
              fill={
                liked
                  ? "currentColor"
                  : "none"
              }
            />
            {formatCount(
              post.likes +
                (liked ? 1 : 0)
            )}
          </button>

          <button
            type="button"
            onClick={() => onOpen?.(post)}
          >
            <MessageCircle size={16} />
            {formatCount(post.comments)}
          </button>

          <button type="button">
            <Share2 size={16} />
            {formatCount(post.shares)}
          </button>

          <button
            type="button"
            className="save-action"
            onClick={() =>
              setSaved(
                (current) => !current
              )
            }
          >
            <Bookmark
              size={16}
              fill={
                saved
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>

        <button
          type="button"
          className="street-shop-look"
          onClick={() => onShop?.(post)}
        >
          Shop this look
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}

function PostModal({
  post,
  onClose,
  onShop,
}) {
  if (!post) {
    return null;
  }

  return (
    <div className="street-modal-overlay">
      <motion.div
        className="street-post-modal"
        initial={{
          opacity: 0,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        <button
          type="button"
          className="street-modal-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="street-modal-image">
          <img
            src={post.image}
            alt={post.caption}
          />
        </div>

        <div className="street-modal-content">
          <header className="street-modal-user">
            <img
              src={post.avatar}
              alt={post.creator}
            />

            <div>
              <strong>
                {post.creator}
              </strong>
              <span>
                {post.handle}
              </span>
            </div>

            <button type="button">
              Follow
            </button>
          </header>

          <p>
            {post.caption}
          </p>

          <div className="street-modal-tags">
            {post.tags.map((tag) => (
              <span key={tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className="street-look-heading">
            <div>
              <span>SHOP THIS LOOK</span>
              <h3>
                Pieces featured in this post
              </h3>
            </div>

            <ShoppingBag size={18} />
          </div>

          <div className="street-look-products">
            {post.products.map(
              (product) => (
                <article
                  key={product.id}
                >
                  <div>
                    <strong>
                      {product.name}
                    </strong>
                    <span>
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onShop?.({
                        ...post,
                        selectedProduct:
                          product,
                      })
                    }
                  >
                    Add
                  </button>
                </article>
              )
            )}
          </div>

          <button
            type="button"
            className="street-shop-all"
            onClick={() => onShop?.(post)}
          >
            Shop entire look
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CreatorRail({
  creators,
}) {
  return (
    <section className="street-creators">
      <header>
        <div>
          <span>CREATOR SPOTLIGHT</span>
          <h2>People setting the vibe.</h2>
        </div>

        <button type="button">
          View all creators
          <ArrowRight size={14} />
        </button>
      </header>

      <div className="street-creator-list">
        {creators.map((creator) => (
          <article key={creator.handle}>
            <div className="street-creator-avatar">
              <img
                src={creator.avatar}
                alt={creator.name}
              />

              <span>
                <Sparkles size={10} />
              </span>
            </div>

            <strong>{creator.name}</strong>
            <small>
              {creator.handle}
            </small>
            <em>
              {creator.followers} followers
            </em>

            <button type="button">
              Follow
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendRail({
  tags,
  activeTag,
  onTag,
}) {
  return (
    <section className="street-trends">
      <div className="street-trends-heading">
        <div>
          <span>WHAT INDIA IS WEARING</span>
          <h2>Trending right now</h2>
        </div>

        <ChevronDown size={18} />
      </div>

      <div className="street-trend-list">
        {tags.map((tag) => (
          <button
            type="button"
            key={tag}
            className={
              activeTag === tag
                ? "active"
                : ""
            }
            onClick={() =>
              onTag?.(
                activeTag === tag
                  ? ""
                  : tag
              )
            }
          >
            {tag}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function D2CStreetPage({
  posts = SAMPLE_POSTS,
  creators = CREATOR_SPOTLIGHT,
  onProductClick,
  onShopLook,
}) {
  const [activeTab, setActiveTab] =
    useState("For You");

  const [activeTag, setActiveTag] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedPost, setSelectedPost] =
    useState(null);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (
      activeTab !== "For You"
    ) {
      result = result.filter(
        (post) =>
          post.type === activeTab
      );
    }

    if (activeTag) {
      const cleanTag =
        activeTag.replace("#", "");

      result = result.filter(
        (post) =>
          post.tags.includes(
            cleanTag
          )
      );
    }

    const query =
      search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (post) => {
          const text = [
            post.creator,
            post.handle,
            post.caption,
            post.type,
            ...post.tags,
            ...post.products.map(
              (product) =>
                product.name
            ),
          ]
            .join(" ")
            .toLowerCase();

          return text.includes(query);
        }
      );
    }

    return result;
  }, [
    posts,
    activeTab,
    activeTag,
    search,
  ]);

  const handleShopLook = (post) => {
    if (onShopLook) {
      onShopLook(post);
      return;
    }

    if (
      post?.selectedProduct &&
      onProductClick
    ) {
      onProductClick(
        post.selectedProduct
      );
      return;
    }

    setSelectedPost(null);
  };

  return (
    <main className="street-page">
      <section className="street-hero">
        <div className="street-hero-copy">
          <span>
            <Sparkles size={13} />
            D2C STREET
          </span>

          <h1>
            Don't just
            <br />
            <strong>shop.</strong>
            <br />
            Find your style.
          </h1>

          <p>
            Real people. Real fits. Real trends.
            Discover looks from the D2C community
            and shop every piece you see.
          </p>

          <div className="street-hero-actions">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(
                    "street-feed"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore the street
              <ArrowRight size={15} />
            </button>

            <button type="button">
              <Play
                size={14}
                fill="currentColor"
              />
              Watch reels
            </button>
          </div>
        </div>

        <div className="street-hero-collage">
          <div className="street-collage-main">
            <img
              src={posts[0]?.image}
              alt="D2C Street"
            />

            <div>
              <span>LIVE TREND</span>
              <strong>
                Minimal
                <br />
                streetwear
              </strong>
            </div>
          </div>

          <div className="street-collage-small top">
            <img
              src={posts[1]?.image}
              alt="Trending look"
            />
          </div>

          <div className="street-collage-small bottom">
            <img
              src={posts[2]?.image}
              alt="Beauty trend"
            />
          </div>

          <div className="street-floating-card">
            <Users size={17} />
            <div>
              <strong>
                24.8K
              </strong>
              <span>
                people shopping the street
              </span>
            </div>
          </div>
        </div>
      </section>

      <TrendRail
        tags={TRENDING_TAGS}
        activeTag={activeTag}
        onTag={setActiveTag}
      />

      <CreatorRail creators={creators} />

      <section
        className="street-feed-section"
        id="street-feed"
      >
        <header className="street-feed-header">
          <div>
            <span>THE D2C COMMUNITY</span>
            <h2>
              Your feed.
              <br />
              Your next obsession.
            </h2>
          </div>

          <div className="street-feed-search">
            <Search size={15} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search looks, creators, tags..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={13} />
              </button>
            )}
          </div>
        </header>

        <nav className="street-tabs">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              className={
                activeTab === tab
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveTab(tab)
              }
            >
              {tab}
            </button>
          ))}
        </nav>

        {filteredPosts.length > 0 ? (
          <div className="street-post-grid">
            {filteredPosts.map(
              (post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  onOpen={setSelectedPost}
                  onShop={handleShopLook}
                />
              )
            )}
          </div>
        ) : (
          <div className="street-empty">
            <Sparkles size={28} />
            <h3>
              No looks found.
            </h3>
            <p>
              Try another trend, creator or
              search.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTag("");
                setSearch("");
                setActiveTab("For You");
              }}
            >
              Reset feed
            </button>
          </div>
        )}
      </section>

      <section className="street-upload-banner">
        <div>
          <span>
            YOUR STYLE BELONGS HERE
          </span>

          <h2>
            Post your fit.
            <br />
            Start a trend.
          </h2>

          <p>
            Share your look with the D2C community
            and tag products people can shop.
          </p>
        </div>

        <button type="button">
          Upload your look
          <ArrowRight size={15} />
        </button>
      </section>

      <AnimatePresence>
        {selectedPost && (
          <PostModal
            post={selectedPost}
            onClose={() =>
              setSelectedPost(null)
            }
            onShop={handleShopLook}
          />
        )}
      </AnimatePresence>
    </main>
  );
}