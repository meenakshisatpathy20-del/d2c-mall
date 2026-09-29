import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { categories, products } from "../../data/catalog";
import { Breadcrumbs, useDocumentTitle } from "../common/ui";
import ListingView from "./ListingView";

export default function ShopPage() {
  useDocumentTitle("Shop all");
  return (
    <div className="page">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shop" }]} />
        <ListingView
          products={products}
          header={
            <div className="page-hero">
              <span className="eyebrow light">
                <LayoutGrid size={13} /> D2C Mall · all products
              </span>
              <h1>Discover products you'll love.</h1>
              <p>Fashion, beauty, footwear, jewellery, electronics and home — from India's growing D2C marketplace.</p>
              <div className="subcat-row">
                {categories.map((c) => (
                  <Link key={c.id} to={`/category/${c.id}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
