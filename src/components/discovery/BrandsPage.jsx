import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Search, Star, Store, Users } from "lucide-react";
import { brands, categories, getBrand, getProductsByBrand } from "../../data/catalog";
import { compact, cx } from "../../lib/format";
import { toast } from "../../lib/toast";
import { Breadcrumbs, Empty, Img, useDocumentTitle } from "../common/ui";
import ListingView from "../shop/ListingView";
import "./BrandsPage.css";

function BrandStore({ brand }) {
  const items = getProductsByBrand(brand.id);
  const rating = items.reduce((t, p) => t + p.rating, 0) / (items.length || 1);
  const [following, setFollowing] = useState(false);
  const followers = 12000 + brand.name.length * 3100;
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands", to: "/brands" }, { label: brand.name }]} />
      <ListingView
        products={items}
        defaultSort="popularity"
        header={
          <div className="brand-hero" style={{ "--brand": brand.color }}>
            <div className="brand-hero-cover">
              {items.slice(0, 4).map((p) => (
                <Img key={p.id} src={p.images[0]} alt="" label={brand.name} />
              ))}
            </div>
            <div className="brand-hero-body">
              <span className="brand-hero-logo">{brand.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
              <div className="grow">
                <h1 className="row gap-6">
                  {brand.name} <BadgeCheck size={22} className="text-blue" />
                </h1>
                <p className="muted">{brand.tagline}</p>
                <div className="row wrap gap-16 mt-8 small muted">
                  <span className="row gap-4">
                    <Star size={14} fill="#f5a524" color="#f5a524" /> {rating.toFixed(1)} avg rating
                  </span>
                  <span className="row gap-4">
                    <MapPin size={14} /> {brand.city}
                  </span>
                  <span className="row gap-4">
                    <Users size={14} /> {compact(followers + (following ? 1 : 0))} followers
                  </span>
                  <span>Since {brand.founded}</span>
                </div>
              </div>
              <button
                className={cx("btn", following ? "btn-outline" : "btn-blue")}
                onClick={() => {
                  setFollowing(!following);
                  toast(following ? `Unfollowed ${brand.name}` : `Following ${brand.name} — you'll hear about new drops first`);
                }}
              >
                {following ? "Following" : "+ Follow brand"}
              </button>
            </div>
          </div>
        }
      />
    </>
  );
}

export default function BrandsPage() {
  const { brandId } = useParams();
  const brand = brandId ? getBrand(brandId) : null;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  useDocumentTitle(brand ? brand.name : "All brands");

  const list = useMemo(
    () => brands.filter((b) => (cat === "all" || b.category === cat) && b.name.toLowerCase().includes(q.toLowerCase())),
    [q, cat]
  );

  if (brandId && !brand) {
    return (
      <div className="page container">
        <Empty icon={<Store size={34} />} title="Brand not found" action={<Link to="/brands" className="btn">All brands</Link>} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {brand ? (
          <BrandStore brand={brand} />
        ) : (
          <>
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Brands" }]} />
            <div className="page-hero">
              <span className="eyebrow light">
                <Store size={13} /> Brand directory
              </span>
              <h1>Meet the makers.</h1>
              <p>Every brand on D2C Mall is verified, founder-led and ships directly through our fulfilment network.</p>
              <div className="brand-search">
                <Search size={17} />
                <input placeholder="Search brands" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="chips mt-24">
              <button className={cx("chip", cat === "all" && "active")} onClick={() => setCat("all")}>
                All
              </button>
              {categories.map((c) => (
                <button key={c.id} className={cx("chip", cat === c.id && "active")} onClick={() => setCat(c.id)}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="brand-dir mt-16">
              {list.map((b) => {
                const items = getProductsByBrand(b.id);
                return (
                  <Link key={b.id} to={`/brands/${b.id}`} className="brand-dir-card" style={{ "--brand": b.color }}>
                    <div className="brand-dir-cover">
                      {items.slice(0, 3).map((p) => (
                        <Img key={p.id} src={p.images[0]} alt="" label={b.name} />
                      ))}
                    </div>
                    <div className="brand-dir-body">
                      <span className="brand-hero-logo sm">{b.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                      <div style={{ minWidth: 0 }}>
                        <b className="row gap-4">
                          {b.name} <BadgeCheck size={14} className="text-blue" />
                        </b>
                        <span className="xs muted ellipsis" style={{ display: "block" }}>
                          {b.tagline}
                        </span>
                        <span className="xs faint">
                          {items.length} products · {b.city}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {!list.length ? <Empty title="No brands found" text="Try a different search." /> : null}
          </>
        )}
      </div>
    </div>
  );
}
