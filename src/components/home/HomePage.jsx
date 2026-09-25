import { useNavigate } from "react-router-dom";
import HeroShowcase from "./HeroShowcase";
import ShopByCategory from "./ShopByCategory";
import TrendingProducts from "./TrendingProducts";
import FlashDeals from "./FlashDeals";
import SocialStyleHub from "./SocialStyleHub";
import D2CDiscovery3D from "./D2CDiscovery3D";
import { heroBanners, products, categories } from "../../data/catalog";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  const trendingProducts = products.filter((product) =>
    product.tags?.includes("trending")
  );

  const flashDeals = products.filter((product) =>
    product.tags?.includes("flash-deal")
  );

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/category/${category.slug}`);
  };

  return (
    <main className="home-page">
      <HeroShowcase
        banners={heroBanners}
        onBannerClick={(banner) => {
          if (banner?.category) {
            navigate(`/category/${banner.category}`);
          }
        }}
        onCtaClick={(banner) => {
          if (banner?.cta?.path) {
            navigate(banner.cta.path);
          }
        }}
      />

      <ShopByCategory
        items={categories}
        onCategoryClick={handleCategoryClick}
      />

      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <span>WHAT'S MOVING</span>
            <h2>Trending right now</h2>
          </div>

          <button onClick={() => navigate("/trending")}>
            View all
          </button>
        </div>

        <TrendingProducts
          products={trendingProducts}
          onProductClick={handleProductClick}
        />
      </section>

      <D2CDiscovery3D
        onExplore={() => navigate("/social")}
      />

      <section className="home-section home-flash-section">
        <div className="home-section-heading">
          <div>
            <span>LIMITED TIME</span>
            <h2>Flash deals</h2>
          </div>

          <button onClick={() => navigate("/deals")}>
            See all deals
          </button>
        </div>

        <FlashDeals
          products={flashDeals}
          onProductClick={handleProductClick}
          onViewAll={() => navigate("/deals")}
        />
      </section>

      <section className="home-social-section">
        <SocialStyleHub
          onPostClick={(post) => {
            navigate(`/social?post=${post.id}`);
          }}
          onShopLook={(post) => {
            navigate(`/social?look=${post.id}`);
          }}
          onViewAll={() => navigate("/social")}
        />
      </section>

      <section className="home-final-cta">
        <div>
          <span>D2C MALL</span>

          <h2>
            Your brands.
            <br />
            Your style.
            <br />
            One place.
          </h2>

          <p>
            Discover products, people and trends shaping
            what comes next.
          </p>

          <button onClick={() => navigate("/shop")}>
            Start shopping
          </button>
        </div>

        <div className="home-final-numbers">
          <div>
            <strong>01</strong>
            <span>Discover</span>
          </div>

          <div>
            <strong>02</strong>
            <span>Shop</span>
          </div>

          <div>
            <strong>03</strong>
            <span>Share</span>
          </div>
        </div>
      </section>
    </main>
  );
}