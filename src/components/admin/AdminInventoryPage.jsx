import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  History,
  MapPin,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminInventoryPage.css";

const INITIAL_INVENTORY = [
  {
    sku: "D2C-SHIRT-001",
    product: "Relaxed Fit Cotton Shirt",
    brand: "D2C Studio",
    category: "Women",
    total: 48,
    reserved: 7,
    available: 41,
    reorderLevel: 10,
    warehouses: {
      Bhiwandi: 18,
      "Delhi NCR": 12,
      Jaipur: 8,
      Bengaluru: 10,
    },
    updated: "23 Sep 2026, 08:31 PM",
  },
  {
    sku: "D2C-TSHIRT-001",
    product: "Premium Oversized T-Shirt",
    brand: "Urban D2C",
    category: "Men",
    total: 67,
    reserved: 11,
    available: 56,
    reorderLevel: 15,
    warehouses: {
      Bhiwandi: 20,
      "Delhi NCR": 19,
      Jaipur: 12,
      Bengaluru: 16,
    },
    updated: "23 Sep 2026, 08:19 PM",
  },
  {
    sku: "D2C-SERUM-001",
    product: "Hydrating Glow Face Serum",
    brand: "GlowLab",
    category: "Beauty",
    total: 91,
    reserved: 16,
    available: 75,
    reorderLevel: 20,
    warehouses: {
      Bhiwandi: 24,
      "Delhi NCR": 27,
      Jaipur: 14,
      Bengaluru: 26,
    },
    updated: "23 Sep 2026, 07:52 PM",
  },
  {
    sku: "D2C-SNEAK-001",
    product: "Everyday Street Sneakers",
    brand: "StreetForm",
    category: "Footwear",
    total: 29,
    reserved: 8,
    available: 21,
    reorderLevel: 12,
    warehouses: {
      Bhiwandi: 4,
      "Delhi NCR": 11,
      Jaipur: 3,
      Bengaluru: 11,
    },
    updated: "23 Sep 2026, 07:41 PM",
  },
  {
    sku: "D2C-NECK-001",
    product: "Minimal Gold-Tone Necklace",
    brand: "Lustre",
    category: "Jewellery",
    total: 56,
    reserved: 5,
    available: 51,
    reorderLevel: 10,
    warehouses: {
      Bhiwandi: 17,
      "Delhi NCR": 13,
      Jaipur: 15,
      Bengaluru: 11,
    },
    updated: "23 Sep 2026, 06:48 PM",
  },
  {
    sku: "D2C-LAMP-001",
    product: "Modern Accent Table Lamp",
    brand: "CasaForm",
    category: "Home",
    total: 18,
    reserved: 6,
    available: 12,
    reorderLevel: 10,
    warehouses: {
      Bhiwandi: 3,
      "Delhi NCR": 7,
      Jaipur: 2,
      Bengaluru: 6,
    },
    updated: "23 Sep 2026, 06:21 PM",
  },
  {
    sku: "D2C-HEAD-001",
    product: "Wireless Noise-Cancelling Headphones",
    brand: "SoundCore D2C",
    category: "Electronics",
    total: 42,
    reserved: 9,
    available: 33,
    reorderLevel: 12,
    warehouses: {
      Bhiwandi: 12,
      "Delhi NCR": 9,
      Jaipur: 8,
      Bengaluru: 13,
    },
    updated: "23 Sep 2026, 05:57 PM",
  },
  {
    sku: "D2C-DRESS-001",
    product: "Flowy Printed Midi Dress",
    brand: "D2C Edit",
    category: "Women",
    total: 31,
    reserved: 4,
    available: 27,
    reorderLevel: 10,
    warehouses: {
      Bhiwandi: 11,
      "Delhi NCR": 7,
      Jaipur: 4,
      Bengaluru: 9,
    },
    updated: "23 Sep 2026, 05:34 PM",
  },
];

const WAREHOUSES = [
  {
    name: "Bhiwandi",
    city: "Mumbai",
    code: "BHI-01",
  },
  {
    name: "Delhi NCR",
    city: "Delhi",
    code: "DEL-01",
  },
  {
    name: "Jaipur",
    city: "Jaipur",
    code: "JAI-01",
  },
  {
    name: "Bengaluru",
    city: "Bengaluru",
    code: "BLR-01",
  },
];

const FILTER_OPTIONS = [
  "All",
  "Women",
  "Men",
  "Beauty",
  "Footwear",
  "Jewellery",
  "Home",
  "Electronics",
];

const STOCK_OPTIONS = [
  "All",
  "In stock",
  "Low stock",
  "Out of stock",
];

function StockBadge({ available, reorderLevel }) {
  if (available === 0) {
    return (
      <span className="inventory-stock-badge out">
        <i />
        Out of stock
      </span>
    );
  }

  if (available <= reorderLevel) {
    return (
      <span className="inventory-stock-badge low">
        <i />
        Low stock
      </span>
    );
  }

  return (
    <span className="inventory-stock-badge healthy">
      <i />
      Healthy
    </span>
  );
}

function WarehouseBar({ warehouse, quantity, total }) {
  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (quantity / total) * 100
          )
        )
      : 0;

  return (
    <div className="warehouse-stock-row">
      <div>
        <span>
          {warehouse}
        </span>
        <strong>
          {quantity}
        </strong>
      </div>

      <div className="warehouse-stock-track">
        <span
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function InventoryDrawer({
  item,
  onClose,
  onSave,
}) {
  const [quantities, setQuantities] =
    useState(item.warehouses);

  const [adjustmentType, setAdjustmentType] =
    useState("Add stock");

  const [adjustmentQuantity, setAdjustmentQuantity] =
    useState("");

  const updateWarehouse = (
    warehouse,
    value
  ) => {
    setQuantities((current) => ({
      ...current,
      [warehouse]:
        Math.max(
          0,
          Number(value) || 0
        ),
    }));
  };

  const saveInventory = () => {
    const nextTotal =
      Object.values(quantities).reduce(
        (sum, value) =>
          sum + Number(value),
        0
      );

    const nextAvailable =
      Math.max(
        0,
        nextTotal - item.reserved
      );

    onSave?.({
      ...item,
      total: nextTotal,
      available: nextAvailable,
      warehouses: quantities,
      updated:
        "Just now",
    });

    onClose();
  };

  const applyAdjustment = () => {
    const amount =
      Number(adjustmentQuantity);

    if (!amount) {
      return;
    }

    const nextQuantities = {
      ...quantities,
    };

    const target =
      WAREHOUSES[0].name;

    const current =
      nextQuantities[target] || 0;

    nextQuantities[target] =
      adjustmentType ===
      "Add stock"
        ? current + amount
        : Math.max(
            0,
            current - amount
          );

    setQuantities(
      nextQuantities
    );

    setAdjustmentQuantity("");
  };

  return (
    <motion.aside
      className="inventory-drawer"
      initial={{
        x: "100%",
      }}
      animate={{
        x: 0,
      }}
      exit={{
        x: "100%",
      }}
    >
      <div className="inventory-drawer-header">
        <div>
          <span>INVENTORY ITEM</span>
          <h2>{item.product}</h2>
          <small>{item.sku}</small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="inventory-drawer-body">
        <section className="inventory-item-summary">
          <div>
            <span>Total stock</span>
            <strong>
              {item.total}
            </strong>
          </div>

          <div>
            <span>Reserved</span>
            <strong>
              {item.reserved}
            </strong>
          </div>

          <div>
            <span>Available</span>
            <strong>
              {item.available}
            </strong>
          </div>
        </section>

        <section className="inventory-drawer-section">
          <header>
            <Warehouse size={15} />
            <span>Warehouse distribution</span>
          </header>

          <div className="warehouse-edit-list">
            {WAREHOUSES.map(
              (warehouse) => (
                <label
                  key={warehouse.name}
                >
                  <div>
                    <strong>
                      {warehouse.name}
                    </strong>
                    <span>
                      {warehouse.city} ·{" "}
                      {warehouse.code}
                    </span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={
                      quantities[
                        warehouse.name
                      ] || 0
                    }
                    onChange={(event) =>
                      updateWarehouse(
                        warehouse.name,
                        event.target.value
                      )
                    }
                  />
                </label>
              )
            )}
          </div>
        </section>

        <section className="inventory-drawer-section">
          <header>
            <Plus size={15} />
            <span>Quick stock adjustment</span>
          </header>

          <div className="stock-adjustment">
            <select
              value={
                adjustmentType
              }
              onChange={(event) =>
                setAdjustmentType(
                  event.target.value
                )
              }
            >
              <option>
                Add stock
              </option>
              <option>
                Remove stock
              </option>
            </select>

            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={
                adjustmentQuantity
              }
              onChange={(event) =>
                setAdjustmentQuantity(
                  event.target.value
                )
              }
            />

            <button
              type="button"
              onClick={
                applyAdjustment
              }
            >
              Apply
            </button>
          </div>

          <small>
            Adjustments will later create an
            immutable inventory movement record.
          </small>
        </section>

        <section className="inventory-drawer-section">
          <header>
            <SlidersHorizontal size={15} />
            <span>Reorder settings</span>
          </header>

          <label className="reorder-setting">
            <span>
              Reorder level
            </span>

            <input
              type="number"
              min="0"
              defaultValue={
                item.reorderLevel
              }
            />
          </label>
        </section>

        <section className="inventory-drawer-section">
          <header>
            <History size={15} />
            <span>Recent movement</span>
          </header>

          <div className="inventory-history">
            <div>
              <span>Stock received</span>
              <strong>
                +20
              </strong>
              <small>
                Bhiwandi · 23 Sep
              </small>
            </div>

            <div>
              <span>Order reserved</span>
              <strong className="negative">
                -2
              </strong>
              <small>
                Order D2C24092381
              </small>
            </div>

            <div>
              <span>Warehouse transfer</span>
              <strong>
                +5
              </strong>
              <small>
                Bengaluru · 22 Sep
              </small>
            </div>
          </div>
        </section>
      </div>

      <div className="inventory-drawer-footer">
        <button
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={saveInventory}
        >
          Save inventory
        </button>
      </div>
    </motion.aside>
  );
}

export default function AdminInventoryPage({
  inventory: externalInventory,
  onInventoryUpdate,
}) {
  const [inventory, setInventory] =
    useState(
      externalInventory ||
        INITIAL_INVENTORY
    );

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [stockStatus, setStockStatus] =
    useState("All");

  const [warehouse, setWarehouse] =
    useState("All");

  const [sort, setSort] =
    useState("stock-low");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(6);

  const [selectedItem, setSelectedItem] =
    useState(null);

  const [mobileFilters, setMobileFilters] =
    useState(false);

  const filteredInventory =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        inventory.filter((item) => {
          const matchesSearch =
            !query ||
            `${item.sku} ${item.product} ${item.brand} ${item.category}`
              .toLowerCase()
              .includes(query);

          const matchesCategory =
            category === "All" ||
            item.category ===
              category;

          const matchesStock =
            stockStatus === "All" ||
            (stockStatus ===
              "In stock" &&
              item.available >
                item.reorderLevel) ||
            (stockStatus ===
              "Low stock" &&
              item.available > 0 &&
              item.available <=
                item.reorderLevel) ||
            (stockStatus ===
              "Out of stock" &&
              item.available ===
                0);

          const matchesWarehouse =
            warehouse === "All" ||
            (item.warehouses[
              warehouse
            ] || 0) > 0;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStock &&
            matchesWarehouse
          );
        });

      return [...result].sort(
        (a, b) => {
          if (
            sort ===
            "stock-high"
          ) {
            return (
              b.available -
              a.available
            );
          }

          if (
            sort ===
            "stock-low"
          ) {
            return (
              a.available -
              b.available
            );
          }

          if (
            sort ===
            "reserved-high"
          ) {
            return (
              b.reserved -
              a.reserved
            );
          }

          return a.product.localeCompare(
            b.product
          );
        }
      );
    }, [
      inventory,
      search,
      category,
      stockStatus,
      warehouse,
      sort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredInventory.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleInventory =
    filteredInventory.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const totals = useMemo(() => {
    const total = inventory.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );

    const reserved =
      inventory.reduce(
        (sum, item) =>
          sum + item.reserved,
        0
      );

    const available =
      inventory.reduce(
        (sum, item) =>
          sum + item.available,
        0
      );

    const lowStock =
      inventory.filter(
        (item) =>
          item.available > 0 &&
          item.available <=
            item.reorderLevel
      ).length;

    const outOfStock =
      inventory.filter(
        (item) =>
          item.available === 0
      ).length;

    return {
      total,
      reserved,
      available,
      lowStock,
      outOfStock,
    };
  }, [inventory]);

  const warehouseTotals =
    useMemo(
      () =>
        WAREHOUSES.map(
          (warehouse) => ({
            ...warehouse,
            quantity:
              inventory.reduce(
                (sum, item) =>
                  sum +
                  (item
                    .warehouses[
                    warehouse
                      .name
                  ] || 0),
                0
              ),
          })
        ),
      [inventory]
    );

  const updateInventory =
    (updatedItem) => {
      setInventory((current) =>
        current.map((item) =>
          item.sku ===
          updatedItem.sku
            ? updatedItem
            : item
        )
      );

      setSelectedItem(null);

      onInventoryUpdate?.(
        updatedItem
      );
    };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setStockStatus("All");
    setWarehouse("All");
    setSort("stock-low");
    setPage(1);
  };

  const hasFilters =
    search ||
    category !== "All" ||
    stockStatus !== "All" ||
    warehouse !== "All";

  return (
    <main className="admin-inventory-page">
      <div className="admin-inventory-heading">
        <div>
          <span>INVENTORY OPERATIONS</span>
          <h1>Inventory</h1>
          <p>
            Track stock across warehouses, reservations and
            replenishment levels.
          </p>
        </div>

        <button
          type="button"
          className="inventory-add-button"
        >
          <Plus size={14} />
          Add stock
        </button>
      </div>

      <section className="inventory-kpis">
        <div>
          <span>TOTAL UNITS</span>
          <strong>
            {totals.total.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Across all warehouses
          </small>
        </div>

        <div>
          <span>AVAILABLE</span>
          <strong>
            {totals.available.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Ready to sell
          </small>
        </div>

        <div>
          <span>RESERVED</span>
          <strong>
            {totals.reserved.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Held against orders
          </small>
        </div>

        <div>
          <span>LOW STOCK</span>
          <strong className="warning">
            {totals.lowStock}
          </strong>
          <small>
            Need replenishment
          </small>
        </div>

        <div>
          <span>OUT OF STOCK</span>
          <strong className="danger">
            {totals.outOfStock}
          </strong>
          <small>
            Currently unavailable
          </small>
        </div>
      </section>

      <section className="warehouse-overview">
        <div className="inventory-section-title">
          <div>
            <span>NETWORK</span>
            <h2>Warehouse stock</h2>
          </div>

          <button type="button">
            Manage warehouses
          </button>
        </div>

        <div className="warehouse-overview-grid">
          {warehouseTotals.map(
            (item) => (
              <article
                key={item.name}
              >
                <div className="warehouse-card-top">
                  <div>
                    <Warehouse
                      size={15}
                    />

                    <div>
                      <strong>
                        {item.name}
                      </strong>
                      <span>
                        {item.city} ·{" "}
                        {item.code}
                      </span>
                    </div>
                  </div>

                  <MapPin
                    size={13}
                  />
                </div>

                <strong className="warehouse-total">
                  {item.quantity}
                  <small>
                    units
                  </small>
                </strong>

                <div className="warehouse-capacity">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        item.quantity
                      )}%`,
                    }}
                  />
                </div>

                <footer>
                  <span>
                    Active inventory
                  </span>
                  <strong>
                    Operational
                  </strong>
                </footer>
              </article>
            )
          )}
        </div>
      </section>

      <section className="inventory-toolbar">
        <div className="inventory-search">
          <Search size={15} />

          <input
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );
              setPage(1);
            }}
            placeholder="Search SKU, product or brand..."
          />
        </div>

        <div className="inventory-filter-row">
          <label>
            <span>Category</span>
            <div>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {FILTER_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
              <ChevronDown
                size={12}
              />
            </div>
          </label>

          <label>
            <span>Stock</span>
            <div>
              <select
                value={stockStatus}
                onChange={(event) => {
                  setStockStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {STOCK_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
              <ChevronDown
                size={12}
              />
            </div>
          </label>

          <label>
            <span>Warehouse</span>
            <div>
              <select
                value={warehouse}
                onChange={(event) => {
                  setWarehouse(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option>
                  All
                </option>

                {WAREHOUSES.map(
                  (item) => (
                    <option
                      key={item.name}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
              <ChevronDown
                size={12}
              />
            </div>
          </label>

          <label>
            <span>Sort</span>
            <div>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                <option value="stock-low">
                  Lowest stock
                </option>
                <option value="stock-high">
                  Highest stock
                </option>
                <option value="reserved-high">
                  Highest reserved
                </option>
                <option value="name">
                  Product name
                </option>
              </select>
              <ChevronDown
                size={12}
              />
            </div>
          </label>

          <button
            type="button"
            className="inventory-mobile-filter"
            onClick={() =>
              setMobileFilters(
                true
              )
            }
          >
            <SlidersHorizontal
              size={14}
            />
            Filters
          </button>
        </div>
      </section>

      {hasFilters && (
        <div className="inventory-active-filters">
          <span>
            {filteredInventory.length}{" "}
            SKUs matching filters
          </span>

          <button
            type="button"
            onClick={resetFilters}
          >
            Clear filters
            <X size={12} />
          </button>
        </div>
      )}

      <section className="inventory-table-panel">
        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all inventory"
                  />
                </th>
                <th>PRODUCT / SKU</th>
                <th>CATEGORY</th>
                <th>TOTAL</th>
                <th>RESERVED</th>
                <th>AVAILABLE</th>
                <th>STOCK STATUS</th>
                <th>WAREHOUSE DISTRIBUTION</th>
                <th>UPDATED</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleInventory.map(
                (item) => (
                  <tr
                    key={item.sku}
                    onClick={() =>
                      setSelectedItem(
                        item
                      )
                    }
                  >
                    <td
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.sku}`}
                      />
                    </td>

                    <td>
                      <div className="inventory-product-cell">
                        <div className="inventory-product-icon">
                          <Package
                            size={17}
                          />
                        </div>

                        <div>
                          <strong>
                            {item.product}
                          </strong>
                          <span>
                            {item.brand}
                          </span>
                          <small>
                            {item.sku}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="inventory-category">
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {item.total}
                      </strong>
                    </td>

                    <td>
                      <span className="reserved-value">
                        {item.reserved}
                      </span>
                    </td>

                    <td>
                      <strong className="available-value">
                        {item.available}
                      </strong>
                    </td>

                    <td>
                      <StockBadge
                        available={
                          item.available
                        }
                        reorderLevel={
                          item.reorderLevel
                        }
                      />
                    </td>

                    <td>
                      <div className="warehouse-distribution">
                        {WAREHOUSES.map(
                          (
                            warehouse
                          ) => (
                            <WarehouseBar
                              key={
                                warehouse.name
                              }
                              warehouse={
                                warehouse.name
                              }
                              quantity={
                                item
                                  .warehouses[
                                  warehouse
                                    .name
                                ] ||
                                0
                              }
                              total={
                                item.total
                              }
                            />
                          )
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="inventory-updated">
                        {item.updated}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="inventory-edit-button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();
                          setSelectedItem(
                            item
                          );
                        }}
                      >
                        <Edit3
                          size={14}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {visibleInventory.length ===
                0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="inventory-empty"
                  >
                    <Package
                      size={25}
                    />

                    <strong>
                      No inventory found
                    </strong>

                    <span>
                      Try changing your
                      search or filters.
                    </span>

                    <button
                      type="button"
                      onClick={
                        resetFilters
                      }
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="inventory-pagination">
          <span>
            Showing{" "}
            <strong>
              {visibleInventory.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredInventory.length}
            </strong>{" "}
            SKUs
          </span>

          <div>
            <label>
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(
                    Number(
                      event.target.value
                    )
                  );
                  setPage(1);
                }}
              >
                <option value="6">
                  6
                </option>
                <option value="10">
                  10
                </option>
                <option value="20">
                  20
                </option>
              </select>
            </label>

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
            >
              <ChevronLeft
                size={14}
              />
            </button>

            <span>
              {currentPage} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                )
              }
            >
              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </footer>
      </section>

      {mobileFilters && (
        <motion.div
          className="inventory-mobile-drawer"
          initial={{
            x: "100%",
          }}
          animate={{
            x: 0,
          }}
        >
          <div>
            <strong>
              Inventory filters
            </strong>

            <button
              type="button"
              onClick={() =>
                setMobileFilters(
                  false
                )
              }
            >
              <X size={17} />
            </button>
          </div>

          <label>
            Category

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
            >
              {FILTER_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Stock

            <select
              value={stockStatus}
              onChange={(event) =>
                setStockStatus(
                  event.target.value
                )
              }
            >
              {STOCK_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                  >
                    {option}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Warehouse

            <select
              value={warehouse}
              onChange={(event) =>
                setWarehouse(
                  event.target.value
                )
              }
            >
              <option>
                All
              </option>

              {WAREHOUSES.map(
                (item) => (
                  <option
                    key={item.name}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              setMobileFilters(
                false
              );
            }}
          >
            Apply filters
          </button>
        </motion.div>
      )}

      {selectedItem && (
        <>
          <div
            className="inventory-drawer-backdrop"
            onClick={() =>
              setSelectedItem(null)
            }
          />

          <InventoryDrawer
            item={selectedItem}
            onClose={() =>
              setSelectedItem(null)
            }
            onSave={
              updateInventory
            }
          />
        </>
      )}
    </main>
  );
}