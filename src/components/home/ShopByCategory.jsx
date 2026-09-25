import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { categories } from "../../data/catalog";
import "./ShopByCategory.css";

export default function ShopByCategory({
  items = categories,
  onCategoryClick,
}) {
  const handleCategoryClick = (category) => {
    if (onCategoryClick) {
      onCategoryClick(category);
      return;
    }

    window.location.href = `/category/${category.slug}`;
  };

  return (
    <section className="shop-by-category">
      <div className="shop-by-category__header">
        <div>
          <span className="shop-by-category__eyebrow">
            EXPLORE THE MALL
          </span>

          <h2>Shop by Category</h2>

          <p>
            Discover fashion, beauty, lifestyle, electronics and more from
            brands you love.
          </p>
        </div>

        <button
          type="button"
          className="shop-by-category__view-all"
          onClick={() => {
            if (onCategoryClick) {
              onCategoryClick({ slug: "all", name: "All Categories" });
              return;
            }

            window.location.href = "/shop";
          }}
        >
          View All
          <ArrowRight size={17} />
        </button>
      </div>

      <div className="shop-by-category__grid">
        {items.map((category, index) => (
          <motion.button
            key={category.id || category.slug || category.name}
            type="button"
            className="shop-by-category__item"
            onClick={() => handleCategoryClick(category)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.4,
              delay: index * 0.05,
            }}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="shop-by-category__image-wrap">
              <img
                src={category.image}
                alt={category.name}
                className="shop-by-category__image"
                loading={index > 3 ? "lazy" : "eager"}
              />

              <div className="shop-by-category__overlay">
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div className="shop-by-category__content">
              <h3>{category.name}</h3>

              {category.description && (
                <p>{category.description}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}