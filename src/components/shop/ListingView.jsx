import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronDown, Filter, LayoutGrid, List, SearchX, SlidersHorizontal, X } from "lucide-react";
import { PRICE_BUCKETS, SORT_OPTIONS, brands, categories, filterProducts, sortProducts } from "../../data/catalog";
import { cx } from "../../lib/format";
import { ProductGrid } from "../common/ProductCard";
import { Drawer, Empty } from "../common/ui";
import "./ShopPage.css";

const PAGE = 24;
const ARRAY_KEYS = ["categories", "subcategories", "brands", "colors", "sizes", "prices"];

function useFilters(lockCategory) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const f = {};
    ARRAY_KEYS.forEach((k) => {
      const v = params.get(k);
      f[k] = v ? v.split(",").filter(Boolean) : [];
    });
    const sub = params.get("sub");
    if (sub && !f.subcategories.includes(sub)) f.subcategories = [...f.subcategories, sub];
    f.minRating = Number(params.get("rating")) || 0;
    f.minDiscount = Number(params.get("discount")) || 0;
    f.inStock = params.get("instock") === "1";
    f.cod = params.get("cod") === "1";
    if (lockCategory) f.categories = [lockCategory];
    return f;
  }, [params, lockCategory]);

  const sort = params.get("sort") || "relevance";

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      const key = { minRating: "rating", minDiscount: "discount", inStock: "instock" }[k] || k;
      if (Array.isArray(v)) v.length ? next.set(key, v.join(",")) : next.delete(key);
      else if (v === true) next.set(key, "1");
      else if (!v) next.delete(key);
      else next.set(key, String(v));
      if (k === "subcategories") next.delete("sub");
    });
    setParams(next, { replace: true });
  };

  const clear = () => {
    const next = new URLSearchParams();
    if (params.get("q")) next.set("q", params.get("q"));
    if (params.get("sort")) next.set("sort", params.get("sort"));
    setParams(next, { replace: true });
  };

  return { filters, sort, update, clear };
}

function FacetGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="facet">
      <button className="facet-head" onClick={() => setOpen(!open)}>
        {title} <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open ? <div className="facet-body">{children}</div> : null}
    </div>
  );
}

function Facets({ base, filters, update, lockCategory }) {
  const toggle = (key, value) => {
    const cur = filters[key];
    update({ [key]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] });
  };
  const count = (fn) => base.filter(fn).length;

  const cats = categories.filter((c) => base.some((p) => p.category === c.id));
  const subs = [...new Set(base.filter((p) => !filters.categories.length || filters.categories.includes(p.category)).map((p) => p.subcategory))];
  const brandList = brands.filter((b) => base.some((p) => p.brandId === b.id));
  const colors = [...new Map(base.flatMap((p) => p.colors).map((c) => [c.name, c])).values()];
  const sizes = [...new Set(base.flatMap((p) => p.sizes))];

  return (
    <div className="facets">
      {!lockCategory && cats.length > 1 ? (
        <FacetGroup title="Categories">
          {cats.map((c) => (
            <label key={c.id} className="check">
              <input type="checkbox" checked={filters.categories.includes(c.id)} onChange={() => toggle("categories", c.id)} />
              {c.name} <span className="facet-count">{count((p) => p.category === c.id)}</span>
            </label>
          ))}
        </FacetGroup>
      ) : null}
      {subs.length > 1 ? (
        <FacetGroup title="Type">
          {subs.map((s) => (
            <label key={s} className="check">
              <input type="checkbox" checked={filters.subcategories.includes(s)} onChange={() => toggle("subcategories", s)} />
              {s} <span className="facet-count">{count((p) => p.subcategory === s)}</span>
            </label>
          ))}
        </FacetGroup>
      ) : null}
      {brandList.length > 1 ? (
        <FacetGroup title="Brand">
          {brandList.map((b) => (
            <label key={b.id} className="check">
              <input type="checkbox" checked={filters.brands.includes(b.id)} onChange={() => toggle("brands", b.id)} />
              {b.name} <span className="facet-count">{count((p) => p.brandId === b.id)}</span>
            </label>
          ))}
        </FacetGroup>
      ) : null}
      <FacetGroup title="Price">
        {PRICE_BUCKETS.map((b) => (
          <label key={b.id} className="check">
            <input type="checkbox" checked={filters.prices.includes(b.id)} onChange={() => toggle("prices", b.id)} />
            {b.label} <span className="facet-count">{count((p) => p.price >= b.min && p.price <= b.max)}</span>
          </label>
        ))}
      </FacetGroup>
      {colors.length ? (
        <FacetGroup title="Colour">
          <div className="facet-swatches">
            {colors.map((c) => (
              <button key={c.name} className={cx("facet-swatch", filters.colors.includes(c.name) && "active")} onClick={() => toggle("colors", c.name)} title={c.name}>
                <span style={{ background: c.value }} />
                {c.name}
              </button>
            ))}
          </div>
        </FacetGroup>
      ) : null}
      {sizes.length ? (
        <FacetGroup title="Size" defaultOpen={false}>
          <div className="facet-sizes">
            {sizes.map((s) => (
              <button key={s} className={cx(filters.sizes.includes(s) && "active")} onClick={() => toggle("sizes", s)}>
                {s}
              </button>
            ))}
          </div>
        </FacetGroup>
      ) : null}
      <FacetGroup title="Customer rating">
        {[4.5, 4, 3.5].map((r) => (
          <label key={r} className="check">
            <input type="radio" name="rating" checked={filters.minRating === r} onChange={() => update({ minRating: r })} />
            {r}★ & above
          </label>
        ))}
        {filters.minRating ? (
          <button className="link xs" onClick={() => update({ minRating: 0 })}>
            Clear
          </button>
        ) : null}
      </FacetGroup>
      <FacetGroup title="Discount">
        {[10, 30, 40, 50].map((d) => (
          <label key={d} className="check">
            <input type="radio" name="discount" checked={filters.minDiscount === d} onChange={() => update({ minDiscount: d })} />
            {d}% and above
          </label>
        ))}
        {filters.minDiscount ? (
          <button className="link xs" onClick={() => update({ minDiscount: 0 })}>
            Clear
          </button>
        ) : null}
      </FacetGroup>
      <FacetGroup title="Availability">
        <label className="check">
          <input type="checkbox" checked={filters.inStock} onChange={() => update({ inStock: !filters.inStock })} />
          In stock only
        </label>
        <label className="check">
          <input type="checkbox" checked={filters.cod} onChange={() => update({ cod: !filters.cod })} />
          Cash on Delivery available
        </label>
      </FacetGroup>
    </div>
  );
}

function AppliedChips({ filters, update, clear, lockCategory }) {
  const chips = [];
  if (!lockCategory) filters.categories.forEach((c) => chips.push({ label: categories.find((x) => x.id === c)?.name, onRemove: () => update({ categories: filters.categories.filter((x) => x !== c) }) }));
  filters.subcategories.forEach((s) => chips.push({ label: s, onRemove: () => update({ subcategories: filters.subcategories.filter((x) => x !== s) }) }));
  filters.brands.forEach((b) => chips.push({ label: brands.find((x) => x.id === b)?.name, onRemove: () => update({ brands: filters.brands.filter((x) => x !== b) }) }));
  filters.prices.forEach((p) => chips.push({ label: PRICE_BUCKETS.find((x) => x.id === p)?.label, onRemove: () => update({ prices: filters.prices.filter((x) => x !== p) }) }));
  filters.colors.forEach((c) => chips.push({ label: c, onRemove: () => update({ colors: filters.colors.filter((x) => x !== c) }) }));
  filters.sizes.forEach((s) => chips.push({ label: `Size ${s}`, onRemove: () => update({ sizes: filters.sizes.filter((x) => x !== s) }) }));
  if (filters.minRating) chips.push({ label: `${filters.minRating}★+`, onRemove: () => update({ minRating: 0 }) });
  if (filters.minDiscount) chips.push({ label: `${filters.minDiscount}%+ off`, onRemove: () => update({ minDiscount: 0 }) });
  if (filters.inStock) chips.push({ label: "In stock", onRemove: () => update({ inStock: false }) });
  if (filters.cod) chips.push({ label: "COD", onRemove: () => update({ cod: false }) });
  if (!chips.length) return null;
  return (
    <div className="applied">
      {chips.map((c) => (
        <button key={c.label} className="chip active-blue" onClick={c.onRemove}>
          {c.label} <X size={13} />
        </button>
      ))}
      <button className="link small" onClick={clear}>
        Clear all
      </button>
    </div>
  );
}

/**
 * @param {object} p
 * @param {Array} p.products  base product list for this page
 * @param {string} [p.lockCategory]
 * @param {React.ReactNode} [p.header]
 * @param {string} [p.defaultSort]
 */
export default function ListingView({ products: base, lockCategory, header, defaultSort = "relevance", emptyText }) {
  const { filters, sort: rawSort, update, clear } = useFilters(lockCategory);
  const sort = rawSort === "relevance" ? defaultSort : rawSort;
  const [view, setView] = useState("grid");
  const [limit, setLimit] = useState(PAGE);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [params, setParams] = useSearchParams();

  const results = useMemo(() => sortProducts(filterProducts(base, filters), sort), [base, filters, sort]);
  const activeCount =
    ARRAY_KEYS.reduce((t, k) => t + (k === "categories" && lockCategory ? 0 : filters[k].length), 0) +
    (filters.minRating ? 1 : 0) + (filters.minDiscount ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.cod ? 1 : 0);

  const setSort = (v) => {
    const next = new URLSearchParams(params);
    if (v === "relevance") next.delete("sort");
    else next.set("sort", v);
    setParams(next, { replace: true });
  };

  return (
    <div className="listing">
      {header}
      <div className="listing-layout">
        <aside className="listing-side">
          <div className="side-head">
            <b className="row gap-6">
              <Filter size={16} /> Filters
            </b>
            {activeCount ? (
              <button className="link small" onClick={clear}>
                Clear all ({activeCount})
              </button>
            ) : null}
          </div>
          <Facets base={base} filters={filters} update={update} lockCategory={lockCategory} />
        </aside>

        <section className="listing-main">
          <div className="listing-bar">
            <span className="small muted">
              Showing <b className="text-blue">{results.length}</b> of {base.length} products
            </span>
            <div className="row gap-6">
              <button className="btn btn-outline btn-sm mobile-only" onClick={() => setMobileFilters(true)}>
                <SlidersHorizontal size={15} /> Filters {activeCount ? `(${activeCount})` : ""}
              </button>
              <label className="sort-select">
                <ArrowUpDown size={15} />
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort: {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="seg desktop-only">
                <button className={cx(view === "grid" && "active")} onClick={() => setView("grid")} aria-label="Grid view">
                  <LayoutGrid size={15} />
                </button>
                <button className={cx(view === "list" && "active")} onClick={() => setView("list")} aria-label="List view">
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
          <AppliedChips filters={filters} update={update} clear={clear} lockCategory={lockCategory} />

          {results.length ? (
            <>
              <ProductGrid products={results.slice(0, limit)} variant={view === "list" ? "list" : undefined} />
              {results.length > limit ? (
                <div className="center mt-24">
                  <button className="btn btn-outline btn-lg" onClick={() => setLimit(limit + PAGE)}>
                    Load more ({results.length - limit} remaining)
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <Empty
              icon={<SearchX size={34} />}
              title="No products match"
              text={emptyText || "Try removing a few filters or searching for something else."}
              action={
                activeCount ? (
                  <button className="btn" onClick={clear}>
                    Clear filters
                  </button>
                ) : null
              }
            />
          )}
        </section>
      </div>

      <Drawer open={mobileFilters} onClose={() => setMobileFilters(false)} width="min(92vw, 380px)">
        <div className="col" style={{ height: "100%", gap: 0 }}>
          <div className="side-head" style={{ padding: "16px 18px" }}>
            <b>Filters</b>
            <button className="icon-btn sm" onClick={() => setMobileFilters(false)} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 18px" }}>
            <Facets base={base} filters={filters} update={update} lockCategory={lockCategory} />
          </div>
          <div className="grid grid-2" style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
            <button className="btn btn-outline" onClick={clear}>
              Clear
            </button>
            <button className="btn" onClick={() => setMobileFilters(false)}>
              Show {results.length}
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
