import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { categories, getProductsByCategory } from "../../data/catalog";
import { Img, SectionHead } from "../common/ui";
import "./ShopByCategory.css";

export default function ShopByCategory() {
  return (
    <section className="section">
      <SectionHead eyebrow="Shop by category" title="Everything you love, from brands you'll discover" to="/shop" action="View all" />
      <div className="cat-grid">
        {categories.map((c, i) => {
          const items = getProductsByCategory(c.id);
          const maxOff = Math.max(...items.map((p) => p.discount));
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <Link to={`/category/${c.id}`} className="cat-tile" style={{ "--accent": c.accent }}>
                <Img src={c.image} alt={c.name} label={c.name} />
                <div className="cat-tile-copy">
                  <span className="cat-off">Up to {maxOff}% off</span>
                  <b>{c.name}</b>
                  <span className="cat-count">{items.length} styles · {c.subcategories.slice(0, 2).join(", ")}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
