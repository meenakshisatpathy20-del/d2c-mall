import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Heart, Play, ShoppingBag, Users } from "lucide-react";
import { creators, getCreator, posts } from "../../data/social";
import { compact } from "../../lib/format";
import { Img, Rail } from "../common/ui";
import ShopTheLook from "../social/ShopTheLook";
import "./SocialStyleHub.css";

export default function SocialStyleHub() {
  const [look, setLook] = useState(null);
  const reels = [...posts].sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 10);

  return (
    <section className="section street-teaser">
      <div className="street-head">
        <div>
          <span className="eyebrow light">
            <Users size={13} /> D2C Street · shop from real people
          </span>
          <h2>Don't just shop. Find your style.</h2>
          <p>Reels and OOTDs from creators and customers. Tap "Shop this look" to add every tagged piece in one go.</p>
        </div>
        <div className="row gap-16 wrap">
          <div className="street-avatars">
            {creators.slice(0, 5).map((c) => (
              <img key={c.id} src={c.avatar} alt={c.name} onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            ))}
            <span>18K+ looks</span>
          </div>
          <Link to="/d2c-street" className="btn btn-white">
            Explore D2C Street <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <Rail itemWidth="minmax(200px, 220px)">
        {reels.map((post, i) => {
          const c = getCreator(post.creatorId);
          return (
            <motion.article
              key={post.id}
              className="reel-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/social?post=${post.id}`} className="reel-media">
                <Img src={post.image} alt={post.caption} label={post.topic} />
                <span className="reel-type">
                  {post.type === "reel" ? <Play size={12} fill="currentColor" /> : null} {post.type.toUpperCase()}
                </span>
                <span className="reel-views">
                  <Eye size={12} /> {compact(post.views)}
                </span>
                <div className="reel-overlay">
                  <div className="row gap-6">
                    <img src={c.avatar} alt="" className="avatar sm" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                    <b className="xs">@{c.handle}</b>
                  </div>
                  <p className="xs clamp-2">{post.caption}</p>
                  <span className="xs row gap-4">
                    <Heart size={12} fill="currentColor" /> {compact(post.likes)}
                  </span>
                </div>
              </Link>
              <button className="reel-shop" onClick={() => setLook(post)}>
                <ShoppingBag size={14} /> Shop this look · {post.productIds.length}
              </button>
            </motion.article>
          );
        })}
      </Rail>
      <ShopTheLook key={look?.id} post={look} open={!!look} onClose={() => setLook(null)} />
    </section>
  );
}
