import { useMemo, useState } from "react";
import { ArrowRight, Heart, Search, ShoppingBag, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";
import { brands, products } from "../../data/catalog";
import "./BrandsPage.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const brandColors = [
  "orange",
  "blue",
  "green",
  "navy",
  "pink",
  "gold",
];

function BrandProductCard({ product, onOpen, onAdd }) {
  const { wishlist, toggleWishlist } = useShop();
  const isWishlisted = wishlist.some((item) => item.id === product.id);

  return (
    <article className="brand-product-card">
      <button
        className={`brand-product-wishlist ${isWishlisted ? "active" : ""}`}
        onClick={() => toggleWishlist(product)}
        aria-label="Toggle wishlist"
      >
        <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
      </button>

      <button
        className="brand-product-image"
        onClick={() => onOpen(product.id)}
      >
        <img src={product.image} alt={product.name} />
      </button>

      <div className="brand-product-content">
        <span>{product.brand}</span>

        <button
          className="brand-product-name"
          onClick={() => onOpen(product.id)}
        >
          {product.name}
        </button>

        <div className="brand-product-meta">
          <span>
            <Star size={11} fill="currentColor" />
            {product.rating}
          </span>
          <small>{product.reviewCount || 0} reviews</small>
        </div>

        <div className="brand-product-price">
          <strong>{formatPrice(product.price)}</strong>
          <del>{formatPrice(product.mrp)}</del>
        </div>

        <button
          className="brand-add-button"
          onClick={() => onAdd(product)}
          disabled={product.stock <= 0}
        >
          <ShoppingBag size={14} />
          {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

function BrandsPage() {
  const navigate = useNavigate();
  const { addToCart } = useShop();

  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(brands[0] || null);

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands;

    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selectedProducts = useMemo(() => {
    if (!selectedBrand) return [];

    return products.filter(
      (product) =>
        product.brand?.toLowerCase() === selectedBrand.name.toLowerCase()
    );
  }, [selectedBrand]);

  const popularProducts = useMemo(() => {
    return products
      .filter((product) => product.brand)
      .sort((a, b) => {
        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);
        return ratingB - ratingA;
      })
      .slice(0, 4);
  }, []);

  return (
    <main className="brands-page">
      <section className="brands-hero">
        <div className="brands-hero-copy">
          <span>THE D2C BRAND EDIT</span>
          <h1>
            Discover
            <br />
            <strong>your brands.</strong>
          </h1>
          <p>
            Explore the labels behind the products people are discovering,
            wearing, gifting and bringing home.
          </p>

          <div className="brands-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search brands..."
            />
          </div>
        </div>

        <div className="brands-hero-grid">
          <div className="brand-hero-tile tile-orange">
            <small>01</small>
            <strong>FASHION</strong>
            <span>Everyday edits</span>
          </div>

          <div className="brand-hero-tile tile-blue">
            <small>02</small>
            <strong>BEAUTY</strong>
            <span>Glow favourites</span>
          </div>

          <div className="brand-hero-tile tile-green">
            <small>03</small>
            <strong>LIFESTYLE</strong>
            <span>Made for living</span>
          </div>

          <div className="brand-hero-tile tile-navy">
            <small>04</small>
            <strong>MORE</strong>
            <span>Keep exploring</span>
          </div>
        </div>
      </section>

      <section className="brands-main">
        <div className="brands-heading">
          <div>
            <span>SHOP BY BRAND</span>
            <h2>Brands you can discover</h2>
          </div>

          <span className="brands-count">
            {filteredBrands.length} brands
          </span>
        </div>

        {filteredBrands.length > 0 ? (
          <div className="brands-grid">
            {filteredBrands.map((brand, index) => {
              const brandProducts = products.filter(
                (product) =>
                  product.brand?.toLowerCase() === brand.name.toLowerCase()
              );

              const color = brandColors[index % brandColors.length];

              return (
                <button
                  key={brand.name}
                  className={`brand-card ${color} ${
                    selectedBrand?.name === brand.name ? "selected" : ""
                  }`}
                  onClick={() => setSelectedBrand(brand)}
                >
                  <span className="brand-card-mark">
                    {brand.name.charAt(0)}
                  </span>

                  <span className="brand-card-content">
                    <strong>{brand.name}</strong>
                    <small>
                      {brandProducts.length}{" "}
                      {brandProducts.length === 1 ? "product" : "products"}
                    </small>
                  </span>

                  <ArrowRight size={17} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="brands-empty">
            <Search size={28} />
            <h3>No brands found</h3>
            <p>Try searching with another brand name.</p>
            <button onClick={() => setSearch("")}>View all brands</button>
          </div>
        )}
      </section>

      {selectedBrand && selectedProducts.length > 0 && (
        <section className="selected-brand-section">
          <div className="selected-brand-header">
            <div>
              <span>BRAND SPOTLIGHT</span>
              <h2>{selectedBrand.name}</h2>
              <p>
                Explore products currently available from{" "}
                {selectedBrand.name}.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(selectedBrand.name)}`)
              }
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="brand-products-grid">
            {selectedProducts.slice(0, 4).map((product) => (
              <BrandProductCard
                key={product.id}
                product={product}
                onOpen={(id) => navigate(`/product/${id}`)}
                onAdd={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      <section className="popular-brand-products">
        <div className="brands-heading">
          <div>
            <span>POPULAR ACROSS D2C</span>
            <h2>Products shoppers love</h2>
          </div>

          <button
            className="brands-view-all"
            onClick={() => navigate("/shop")}
          >
            Shop everything
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="brand-products-grid">
          {popularProducts.map((product) => (
            <BrandProductCard
              key={product.id}
              product={product}
              onOpen={(id) => navigate(`/product/${id}`)}
              onAdd={addToCart}
            />
          ))}
        </div>
      </section>

      <section className="brands-bottom-banner">
        <div>
          <span>FIND YOUR NEXT FAVOURITE</span>
          <h2>One mall. Hundreds of possibilities.</h2>
          <p>
            Discover fashion, beauty, electronics, home, jewellery and more
            from one D2C marketplace.
          </p>
        </div>

        <button onClick={() => navigate("/shop")}>
          Start shopping
          <ArrowRight size={16} />
        </button>
      </section>
    </main>
  );
}

export default BrandsPage;