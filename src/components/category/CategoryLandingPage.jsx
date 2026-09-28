import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MousePointerClick } from "lucide-react";
import { brands, categories, getCategory, getProductsByCategory } from "../../data/catalog";
import { cx } from "../../lib/format";
import { DiscoveryScene } from "../common/ThreeSafe";
import { Breadcrumbs, Empty, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./CategoryLandingPage.css";

export default function CategoryLandingPage() {
  const { category: id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const category = getCategory(id);
  const items = getProductsByCategory(id);
  useDocumentTitle(category?.name || "Category");

  if (!category) {
    return (
      <div className="page container">
        <Empty title="Category not found" text="Browse all categories instead." action={<Link to="/shop" className="btn">Shop all</Link>} />
      </div>
    );
  }

  const sub = params.get("sub");
  const catBrands = brands.filter((b) => items.some((p) => p.brandId === b.id));
  const maxOff = Math.max(...items.map((p) => p.discount));

  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: category.name, to: `/category/${id}` }, ...(sub ? [{ label: sub }] : [])]} />
        <ListingView
          key={id}
          products={items}
          lockCategory={id}
          defaultSort="popularity"
          header={
            <div className="page-hero cat-hero" style={{ "--accent": category.accent }}>
              <div className="listing-hero">
                <div>
                  <span className="eyebrow light">Shop the category</span>
                  <h1>{category.name}</h1>
                  <p>{category.tagline}</p>
                  <div className="hero-stats">
                    <div>
                      <b>{items.length}+</b>
                      <span>styles</span>
                    </div>
                    <div>
                      <b>{catBrands.length}</b>
                      <span>D2C brands</span>
                    </div>
                    <div>
                      <b>Up to {maxOff}%</b>
                      <span>off today</span>
                    </div>
                  </div>
                  <div className="subcat-row">
                    <Link to={`/category/${id}`} className={cx(!sub && "active")}>
                      All {category.name}
                    </Link>
                    {category.subcategories.map((s) => (
                      <Link key={s} to={`/category/${id}?sub=${encodeURIComponent(s)}`} className={cx(sub === s && "active")}>
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="listing-hero-media">
                  <span className="cat-3d-tag">
                    <MousePointerClick size={13} /> Drag & tap
                  </span>
                  <DiscoveryScene products={items} onSelect={(p) => navigate(`/product/${p.id}`)} />
                </div>
              </div>
            </div>
          }
        />
        <div className="cat-other">
          <span className="label">Explore other categories</span>
          <div className="chips mt-8">
            {categories
              .filter((c) => c.id !== id)
              .map((c) => (
                <Link key={c.id} to={`/category/${c.id}`} className="chip">
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
