import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { categories, getTrendingProducts, searchProducts } from "../../data/catalog";
import ProductCard from "../common/ProductCard";
import { Breadcrumbs, Rail, SectionHead, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./SearchResultsPage.css";

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const results = useMemo(() => searchProducts(q), [q]);
  useDocumentTitle(q ? `Search: ${q}` : "Search");

  const exactSku = results.length === 1 && results[0].sku.toLowerCase() === q.trim().toLowerCase();

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Search" }, { label: q || "All" }]} />
        <div className="search-head">
          <div>
            <span className="eyebrow blue">
              <Search size={13} /> Search results
            </span>
            <h1>
              {q ? (
                <>
                  Results for <span className="text-orange">"{q}"</span>
                </>
              ) : (
                "All products"
              )}
            </h1>
            <p className="muted small mt-4">
              {results.length} match{results.length === 1 ? "" : "es"} across products, brands, categories and SKUs
              {exactSku ? " · exact SKU match" : ""}
            </p>
          </div>
          <div className="chips">
            {categories.map((c) => (
              <Link key={c.id} to={`/category/${c.id}`} className="chip">
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {results.length ? (
          <ListingView products={results} />
        ) : (
          <div className="search-empty">
            <div className="search-empty-card">
              <Search size={36} />
              <h2>No results for "{q}"</h2>
              <p>Check the spelling, try a more general term, or search by brand, category or SKU (e.g. D2C-MEN-001).</p>
              <div className="row wrap gap-6 mt-12" style={{ justifyContent: "center" }}>
                {["sneakers", "kurta", "serum", "headphones", "necklace"].map((t) => (
                  <Link key={t} to={`/search?q=${t}`} className="chip">
                    {t}
                  </Link>
                ))}
              </div>
            </div>
            <section className="section">
              <SectionHead title="Trending instead" eyebrow="You might like" />
              <Rail>
                {getTrendingProducts().map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </Rail>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
