import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Play,
  Share2,
  ShoppingBag,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import "./SocialStyleHub.css";

const SAMPLE_STYLE_POSTS = [
  {
    id: "style-001",
    creator: "stylewithriya",
    creatorName: "Riya",
    avatar:
      "https://i.pravatar.cc/100?img=47",
    cover:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85",
    type: "OOTD",
    caption: "Casual coffee date fit ☕✨",
    likes: 2841,
    comments: 184,
    shares: 92,
    productCount: 3,
    tags: ["Street Style", "Casual"],
    isFollowing: false,
  },
  {
    id: "style-002",
    creator: "thewardrobeedit",
    creatorName: "Ananya",
    avatar:
      "https://i.pravatar.cc/100?img=32",
    cover:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
    type: "REEL",
    caption: "3 ways to style one white shirt",
    likes: 6124,
    comments: 421,
    shares: 318,
    productCount: 4,
    tags: ["Style Tip", "Trending"],
    isFollowing: true,
  },
  {
    id: "style-003",
    creator: "menswear.daily",
    creatorName: "Arjun",
    avatar:
      "https://i.pravatar.cc/100?img=12",
    cover:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=85",
    type: "LOOK",
    caption: "Minimal fits never miss.",
    likes: 1948,
    comments: 113,
    shares: 76,
    productCount: 2,
    tags: ["Menswear", "Minimal"],
    isFollowing: false,
  },
  {
    id: "style-004",
    creator: "beautybymeera",
    creatorName: "Meera",
    avatar:
      "https://i.pravatar.cc/100?img=25",
    cover:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=700&q=85",
    type: "BEAUTY",
    caption: "My 5-minute everyday glow routine ✨",
    likes: 8340,
    comments: 596,
    shares: 441,
    productCount: 5,
    tags: ["Beauty", "Routine"],
    isFollowing: false,
  },
];

const formatCount = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value;
};

export default function SocialStyleHub({
  posts = SAMPLE_STYLE_POSTS,
  onPostClick,
  onShopLook,
  onFollow,
  onViewAll,
}) {
  const [likedPosts, setLikedPosts] = useState([]);
  const [following, setFollowing] = useState(
    posts
      .filter((post) => post.isFollowing)
      .map((post) => post.id)
  );

  const toggleLike = (post) => {
    setLikedPosts((current) =>
      current.includes(post.id)
        ? current.filter((id) => id !== post.id)
        : [...current, post.id]
    );
  };

  const toggleFollow = (post) => {
    setFollowing((current) =>
      current.includes(post.id)
        ? current.filter((id) => id !== post.id)
        : [...current, post.id]
    );

    onFollow?.(post);
  };

  return (
    <section className="social-style-section">
      <div className="social-style-container">
        <div className="social-style-heading">
          <div>
            <span className="social-style-kicker">
              <Sparkles size={13} />
              D2C STREET
            </span>

            <h2>See it. Love it. Shop it.</h2>

            <p>
              Discover real looks, creators and style ideas —
              then shop everything in the look.
            </p>
          </div>

          <button
            type="button"
            className="social-view-all"
            onClick={onViewAll}
          >
            Explore D2C Street
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="social-post-rail">
          {posts.map((post, index) => {
            const liked = likedPosts.includes(post.id);
            const isFollowing = following.includes(post.id);

            return (
              <motion.article
                key={post.id}
                className="social-post-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                }}
              >
                <div
                  className="social-post-media"
                  onClick={() => onPostClick?.(post)}
                >
                  <img
                    src={post.cover}
                    alt={`${post.creatorName} style`}
                    loading="lazy"
                  />

                  <div className="social-media-top">
                    <span className="social-content-type">
                      {post.type === "REEL" && (
                        <Play
                          size={11}
                          fill="currentColor"
                        />
                      )}
                      {post.type}
                    </span>

                    <button
                      type="button"
                      className="social-share"
                      aria-label="Share post"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <Share2 size={15} />
                    </button>
                  </div>

                  <div className="social-media-bottom">
                    <div className="social-product-count">
                      <ShoppingBag size={12} />
                      {post.productCount} products in this look
                    </div>
                  </div>
                </div>

                <div className="social-post-body">
                  <div className="social-creator-row">
                    <img
                      src={post.avatar}
                      alt=""
                      className="social-avatar"
                    />

                    <div className="social-creator-info">
                      <strong>
                        {post.creatorName}
                      </strong>

                      <span>@{post.creator}</span>
                    </div>

                    <button
                      type="button"
                      className={`social-follow-button ${
                        isFollowing ? "following" : ""
                      }`}
                      onClick={() =>
                        toggleFollow(post)
                      }
                    >
                      {isFollowing ? (
                        "Following"
                      ) : (
                        <>
                          <UserPlus size={12} />
                          Follow
                        </>
                      )}
                    </button>
                  </div>

                  <p className="social-caption">
                    {post.caption}
                  </p>

                  <div className="social-tags">
                    {post.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>

                  <div className="social-engagement">
                    <button
                      type="button"
                      className={liked ? "liked" : ""}
                      onClick={() => toggleLike(post)}
                    >
                      <Heart
                        size={15}
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

                    <button type="button">
                      <MessageCircle size={15} />
                      {formatCount(post.comments)}
                    </button>

                    <button type="button">
                      <Share2 size={15} />
                      {formatCount(post.shares)}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="shop-look-button"
                    onClick={() =>
                      onShopLook?.(post)
                    }
                  >
                    <ShoppingBag size={15} />
                    Shop this look
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="social-community-banner">
          <div className="community-avatars">
            {posts.slice(0, 4).map((post) => (
              <img
                key={post.id}
                src={post.avatar}
                alt=""
              />
            ))}
          </div>

          <div className="community-copy">
            <strong>
              Your style belongs here.
            </strong>

            <span>
              Upload an OOTD, create a reel, tag your
              favourite products and inspire the D2C
              community.
            </span>
          </div>

          <button
            type="button"
            onClick={onViewAll}
          >
            Join D2C Street
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}