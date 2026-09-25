import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  History,
  MapPin,
  Package,
  Plus,
  Search,
  Send,
  Settings2,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminWarehousesPage.css";

const INITIAL_WAREHOUSES = [
  {
    id: "BHI-01",
    name: "Bhiwandi",
    city: "Mumbai",
    region: "West",
    status: "Operational",
    capacity: 82,
    units: 4872,
    reserved: 614,
    ordersToday: 184,
    avgDispatch: "7h 24m",
    sla: "98.2%",
    carriers: ["Shiprocket", "Delhivery", "Blue Dart"],
    manager: "Aarav Mehta",
    phone: "+91 98XXXXXX21",
    address: "Bhiwandi Logistics Park, Thane",
  },
  {
    id: "DEL-01",
    name: "Delhi NCR",
    city: "Delhi",
    region: "North",
    status: "Operational",
    capacity: 74,
    units: 3928,
    reserved: 487,
    ordersToday: 157,
    avgDispatch: "8h 11m",
    sla: "97.6%",
    carriers: ["Shiprocket", "Delhivery", "Ecom Express"],
    manager: "Riya Kapoor",
    phone: "+91 97XXXXXX42",
    address: "Manesar Logistics Hub, Gurugram",
  },
  {
    id: "JAI-01",
    name: "Jaipur",
    city: "Jaipur",
    region: "North West",
    status: "Operational",
    capacity: 61,
    units: 2814,
    reserved: 321,
    ordersToday: 96,
    avgDispatch: "9h 03m",
    sla: "96.8%",
    carriers: ["Shiprocket", "XpressBees"],
    manager: "Kabir Sharma",
    phone: "+91 99XXXXXX18",
    address: "Sitapura Industrial Area, Jaipur",
  },
  {
    id: "BLR-01",
    name: "Bengaluru",
    city: "Bengaluru",
    region: "South",
    status: "Operational",
    capacity: 69,
    units: 3476,
    reserved: 405,
    ordersToday: 139,
    avgDispatch: "7h 52m",
    sla: "98.0%",
    carriers: ["Shiprocket", "Delhivery", "Blue Dart"],
    manager: "Nisha Rao",
    phone: "+91 96XXXXXX63",
    address: "Bommasandra Industrial Area, Bengaluru",
  },
];

const INITIAL_TRANSFERS = [
  {
    id: "TRF-240923-018",
    sku: "D2C-SNEAK-001",
    product: "Everyday Street Sneakers",
    quantity: 18,
    from: "Bhiwandi",
    to: "Bengaluru",
    status: "In Transit",
    created: "23 Sep 2026, 05:42 PM",
    eta: "25 Sep 2026",
    reason: "South region demand",
  },
  {
    id: "TRF-240923-017",
    sku: "D2C-SERUM-001",
    product: "Hydrating Glow Face Serum",
    quantity: 24,
    from: "Bengaluru",
    to: "Delhi NCR",
    status: "Pending Pickup",
    created: "23 Sep 2026, 04:18 PM",
    eta: "26 Sep 2026",
    reason: "Replenishment",
  },
  {
    id: "TRF-240922-014",
    sku: "D2C-LAMP-001",
    product: "Modern Accent Table Lamp",
    quantity: 12,
    from: "Delhi NCR",
    to: "Jaipur",
    status: "Delivered",
    created: "22 Sep 2026, 02:51 PM",
    eta: "23 Sep 2026",
    reason: "Low stock recovery",
  },
  {
    id: "TRF-240922-011",
    sku: "D2C-DRESS-001",
    product: "Flowy Printed Midi Dress",
    quantity: 20,
    from: "Bengaluru",
    to: "Bhiwandi",
    status: "Delivered",
    created: "22 Sep 2026, 11:37 AM",
    eta: "23 Sep 2026",
    reason: "West demand",
  },
];

const DESTINATIONS = [
  {
    city: "Mumbai",
    state: "Maharashtra",
    warehouse: "Bhiwandi",
    warehouseId: "BHI-01",
    region: "West",
    distance: 32,
    sla: "1–2 days",
  },
  {
    city: "Pune",
    state: "Maharashtra",
    warehouse: "Bhiwandi",
    warehouseId: "BHI-01",
    region: "West",
    distance: 151,
    sla: "1–2 days",
  },
  {
    city: "Delhi",
    state: "Delhi",
    warehouse: "Delhi NCR",
    warehouseId: "DEL-01",
    region: "North",
    distance: 28,
    sla: "1–2 days",
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    warehouse: "Jaipur",
    warehouseId: "JAI-01",
    region: "North West",
    distance: 19,
    sla: "1–2 days",
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    warehouse: "Bengaluru",
    warehouseId: "BLR-01",
    region: "South",
    distance: 24,
    sla: "1–2 days",
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    warehouse: "Bengaluru",
    warehouseId: "BLR-01",
    region: "South",
    distance: 569,
    sla: "2–3 days",
  },
];

const TRANSFER_STATUSES = [
  "All",
  "Pending Pickup",
  "In Transit",
  "Delivered",
  "Cancelled",
];

function CapacityBar({ value }) {
  const status =
    value >= 90
      ? "danger"
      : value >= 80
      ? "warning"
      : "healthy";

  return (
    <div className="warehouse-capacity-wrap">
      <div className="warehouse-capacity-line">
        <span>Capacity</span>
        <strong>{value}%</strong>
      </div>

      <div className="warehouse-capacity-track">
        <span
          className={status}
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function WarehouseDetails({
  warehouse,
  onClose,
}) {
  return (
    <motion.aside
      className="warehouse-details-drawer"
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
      <header>
        <div>
          <span>WAREHOUSE PROFILE</span>
          <h2>{warehouse.name}</h2>
          <small>
            {warehouse.id} · {warehouse.city}
          </small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="warehouse-details-body">
        <div className="warehouse-detail-status">
          <CheckCircle2 size={15} />
          {warehouse.status}
        </div>

        <section className="warehouse-detail-grid">
          <div>
            <span>Units</span>
            <strong>
              {warehouse.units.toLocaleString("en-IN")}
            </strong>
          </div>

          <div>
            <span>Reserved</span>
            <strong>
              {warehouse.reserved.toLocaleString("en-IN")}
            </strong>
          </div>

          <div>
            <span>Orders today</span>
            <strong>
              {warehouse.ordersToday}
            </strong>
          </div>

          <div>
            <span>Dispatch</span>
            <strong>
              {warehouse.avgDispatch}
            </strong>
          </div>
        </section>

        <section className="warehouse-detail-section">
          <h3>Capacity</h3>

          <CapacityBar
            value={warehouse.capacity}
          />

          <p>
            {100 - warehouse.capacity}% storage capacity
            remaining.
          </p>
        </section>

        <section className="warehouse-detail-section">
          <h3>Warehouse manager</h3>

          <div className="warehouse-manager">
            <div>
              <strong>
                {warehouse.manager}
              </strong>
              <span>
                {warehouse.phone}
              </span>
            </div>

            <Edit3 size={14} />
          </div>
        </section>

        <section className="warehouse-detail-section">
          <h3>Location</h3>

          <div className="warehouse-address">
            <MapPin size={15} />
            <span>
              {warehouse.address}
            </span>
          </div>
        </section>

        <section className="warehouse-detail-section">
          <h3>Active carriers</h3>

          <div className="warehouse-carrier-list">
            {warehouse.carriers.map(
              (carrier) => (
                <span key={carrier}>
                  {carrier}
                </span>
              )
            )}
          </div>
        </section>

        <section className="warehouse-detail-section">
          <h3>Service performance</h3>

          <div className="warehouse-performance">
            <div>
              <span>On-time SLA</span>
              <strong>
                {warehouse.sla}
              </strong>
            </div>

            <div>
              <span>Average dispatch</span>
              <strong>
                {warehouse.avgDispatch}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <footer>
        <button
          type="button"
          onClick={onClose}
        >
          Close
        </button>

        <button type="button">
          Edit warehouse
        </button>
      </footer>
    </motion.aside>
  );
}

function TransferDrawer({
  onClose,
  onCreate,
}) {
  const [sku, setSku] = useState("");
  const [product, setProduct] =
    useState("");
  const [quantity, setQuantity] =
    useState("");
  const [from, setFrom] =
    useState("Bhiwandi");
  const [to, setTo] =
    useState("Bengaluru");
  const [reason, setReason] =
    useState("Replenishment");

  const createTransfer = () => {
    if (
      !sku ||
      !product ||
      !quantity ||
      from === to
    ) {
      return;
    }

    onCreate?.({
      id: `TRF-${Date.now()}`,
      sku,
      product,
      quantity: Number(quantity),
      from,
      to,
      status: "Pending Pickup",
      created: "Just now",
      eta: "To be calculated",
      reason,
    });

    onClose();
  };

  return (
    <motion.aside
      className="warehouse-transfer-drawer"
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
      <header>
        <div>
          <span>INVENTORY MOVEMENT</span>
          <h2>Create stock transfer</h2>
          <small>
            Move inventory between fulfilment centres.
          </small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="warehouse-transfer-body">
        <label>
          <span>SKU</span>
          <input
            value={sku}
            onChange={(event) =>
              setSku(event.target.value)
            }
            placeholder="D2C-SKU-001"
          />
        </label>

        <label>
          <span>Product</span>
          <input
            value={product}
            onChange={(event) =>
              setProduct(event.target.value)
            }
            placeholder="Product name"
          />
        </label>

        <label>
          <span>Quantity</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value)
            }
            placeholder="Units"
          />
        </label>

        <div className="warehouse-transfer-route">
          <label>
            <span>From warehouse</span>
            <select
              value={from}
              onChange={(event) =>
                setFrom(event.target.value)
              }
            >
              {INITIAL_WAREHOUSES.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                  >
                    {warehouse.name}
                  </option>
                )
              )}
            </select>
          </label>

          <ArrowRight size={17} />

          <label>
            <span>To warehouse</span>
            <select
              value={to}
              onChange={(event) =>
                setTo(event.target.value)
              }
            >
              {INITIAL_WAREHOUSES.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                  >
                    {warehouse.name}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <label>
          <span>Transfer reason</span>
          <select
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
          >
            <option>
              Replenishment
            </option>
            <option>
              Regional demand
            </option>
            <option>
              Low stock recovery
            </option>
            <option>
              Seasonal allocation
            </option>
            <option>
              Manual balancing
            </option>
          </select>
        </label>

        <section className="transfer-preview">
          <div>
            <Package size={16} />
            <span>Transfer preview</span>
          </div>

          <p>
            {quantity || "0"} units will move from{" "}
            <strong>{from}</strong> to{" "}
            <strong>{to}</strong>.
          </p>

          <small>
            Final availability and transfer eligibility will
            be validated by the inventory service.
          </small>
        </section>
      </div>

      <footer>
        <button
          type="button"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={createTransfer}
        >
          <Send size={13} />
          Create transfer
        </button>
      </footer>
    </motion.aside>
  );
}

function TransferStatus({ status }) {
  const className =
    status
      .toLowerCase()
      .replaceAll(" ", "-");

  return (
    <span
      className={`transfer-status ${className}`}
    >
      <i />
      {status}
    </span>
  );
}

export default function AdminWarehousesPage({
  warehouses: externalWarehouses,
  transfers: externalTransfers,
  onWarehouseUpdate,
  onTransferCreate,
}) {
  const [warehouses] =
    useState(
      externalWarehouses ||
        INITIAL_WAREHOUSES
    );

  const [transfers, setTransfers] =
    useState(
      externalTransfers ||
        INITIAL_TRANSFERS
    );

  const [selectedWarehouse, setSelectedWarehouse] =
    useState(null);

  const [showTransferDrawer, setShowTransferDrawer] =
    useState(false);

  const [transferSearch, setTransferSearch] =
    useState("");

  const [transferStatus, setTransferStatus] =
    useState("All");

  const [transferSort, setTransferSort] =
    useState("newest");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(5);

  const totalUnits =
    warehouses.reduce(
      (sum, warehouse) =>
        sum + warehouse.units,
      0
    );

  const totalOrders =
    warehouses.reduce(
      (sum, warehouse) =>
        sum + warehouse.ordersToday,
      0
    );

  const averageSla =
    warehouses.length
      ? (
          warehouses.reduce(
            (sum, warehouse) =>
              sum +
              Number(
                warehouse.sla.replace(
                  "%",
                  ""
                )
              ),
            0
          ) /
          warehouses.length
        ).toFixed(1)
      : "0.0";

  const filteredTransfers =
    useMemo(() => {
      const query =
        transferSearch
          .trim()
          .toLowerCase();

      const filtered =
        transfers.filter((transfer) => {
          const matchesSearch =
            !query ||
            `${transfer.id} ${transfer.sku} ${transfer.product} ${transfer.from} ${transfer.to}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            transferStatus === "All" ||
            transfer.status ===
              transferStatus;

          return (
            matchesSearch &&
            matchesStatus
          );
        });

      return [...filtered].sort(
        (a, b) => {
          if (
            transferSort ===
            "quantity-high"
          ) {
            return (
              b.quantity -
              a.quantity
            );
          }

          if (
            transferSort ===
            "quantity-low"
          ) {
            return (
              a.quantity -
              b.quantity
            );
          }

          return b.id.localeCompare(
            a.id
          );
        }
      );
    }, [
      transfers,
      transferSearch,
      transferStatus,
      transferSort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTransfers.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleTransfers =
    filteredTransfers.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const transferStats = {
    pending: transfers.filter(
      (transfer) =>
        transfer.status ===
        "Pending Pickup"
    ).length,
    transit: transfers.filter(
      (transfer) =>
        transfer.status ===
        "In Transit"
    ).length,
    delivered: transfers.filter(
      (transfer) =>
        transfer.status ===
        "Delivered"
    ).length,
  };

  const handleCreateTransfer =
    (transfer) => {
      setTransfers((current) => [
        transfer,
        ...current,
      ]);

      onTransferCreate?.(
        transfer
      );

      setPage(1);
    };

  return (
    <main className="admin-warehouses-page">
      <div className="admin-warehouses-heading">
        <div>
          <span>FULFILMENT NETWORK</span>
          <h1>Warehouses</h1>
          <p>
            Manage fulfilment centres, regional stock and
            inter-warehouse movement.
          </p>
        </div>

        <div className="warehouse-heading-actions">
          <button
            type="button"
            onClick={() =>
              setShowTransferDrawer(
                true
              )
            }
          >
            <ArrowUpDown size={14} />
            Transfer stock
          </button>

          <button type="button">
            <Plus size={14} />
            Add warehouse
          </button>
        </div>
      </div>

      <section className="warehouse-network-kpis">
        <div>
          <span>FULFILMENT CENTRES</span>
          <strong>
            {warehouses.length}
          </strong>
          <small>
            All operational
          </small>
        </div>

        <div>
          <span>NETWORK INVENTORY</span>
          <strong>
            {totalUnits.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Units across network
          </small>
        </div>

        <div>
          <span>ORDERS TODAY</span>
          <strong>
            {totalOrders}
          </strong>
          <small>
            Across all FCs
          </small>
        </div>

        <div>
          <span>ON-TIME SLA</span>
          <strong className="green">
            {averageSla}%
          </strong>
          <small>
            Network average
          </small>
        </div>

        <div>
          <span>ACTIVE TRANSFERS</span>
          <strong className="orange">
            {transferStats.pending +
              transferStats.transit}
          </strong>
          <small>
            Moving between FCs
          </small>
        </div>
      </section>

      <section className="warehouse-network">
        <div className="warehouse-network-title">
          <div>
            <span>NETWORK OVERVIEW</span>
            <h2>Fulfilment centres</h2>
          </div>

          <button type="button">
            <Settings2 size={13} />
            Network settings
          </button>
        </div>

        <div className="warehouse-card-grid">
          {warehouses.map(
            (warehouse) => (
              <motion.article
                key={warehouse.id}
                whileHover={{
                  y: -2,
                }}
                className="warehouse-operation-card"
              >
                <div className="warehouse-operation-top">
                  <div className="warehouse-operation-icon">
                    <WarehouseIcon />
                  </div>

                  <span className="warehouse-operational">
                    <i />
                    {warehouse.status}
                  </span>
                </div>

                <div className="warehouse-operation-name">
                  <div>
                    <h3>
                      {warehouse.name}
                    </h3>
                    <span>
                      {warehouse.city} ·{" "}
                      {warehouse.id}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedWarehouse(
                        warehouse
                      )
                    }
                  >
                    <ArrowRight
                      size={14}
                    />
                  </button>
                </div>

                <CapacityBar
                  value={
                    warehouse.capacity
                  }
                />

                <div className="warehouse-operation-metrics">
                  <div>
                    <span>Inventory</span>
                    <strong>
                      {warehouse.units.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Reserved</span>
                    <strong>
                      {warehouse.reserved}
                    </strong>
                  </div>

                  <div>
                    <span>Orders</span>
                    <strong>
                      {warehouse.ordersToday}
                    </strong>
                  </div>
                </div>

                <footer>
                  <span>
                    Dispatch{" "}
                    <strong>
                      {warehouse.avgDispatch}
                    </strong>
                  </span>

                  <span>
                    SLA{" "}
                    <strong>
                      {warehouse.sla}
                    </strong>
                  </span>
                </footer>
              </motion.article>
            )
          )}
        </div>
      </section>

      <section className="allocation-section">
        <div className="allocation-heading">
          <div>
            <span>FULFILMENT LOGIC</span>
            <h2>Destination allocation</h2>
            <p>
              Preferred warehouse mapping used as an input
              for inventory and delivery decisions.
            </p>
          </div>

          <button type="button">
            Edit allocation rules
          </button>
        </div>

        <div className="allocation-table-wrapper">
          <table className="allocation-table">
            <thead>
              <tr>
                <th>DESTINATION</th>
                <th>REGION</th>
                <th>PREFERRED FC</th>
                <th>DISTANCE</th>
                <th>TARGET SLA</th>
                <th>RULE</th>
              </tr>
            </thead>

            <tbody>
              {DESTINATIONS.map(
                (destination) => (
                  <tr
                    key={`${destination.city}-${destination.warehouse}`}
                  >
                    <td>
                      <strong>
                        {destination.city}
                      </strong>
                      <span>
                        {destination.state}
                      </span>
                    </td>

                    <td>
                      <span className="region-badge">
                        {destination.region}
                      </span>
                    </td>

                    <td>
                      <div className="allocation-warehouse">
                        <Warehouse
                          size={14}
                        />
                        <strong>
                          {destination.warehouse}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {destination.distance} km
                    </td>

                    <td>
                      <span className="sla-value">
                        {destination.sla}
                      </span>
                    </td>

                    <td>
                      <span className="allocation-rule">
                        Stock + SLA + distance
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="transfer-section">
        <div className="transfer-heading">
          <div>
            <span>INVENTORY MOVEMENT</span>
            <h2>Stock transfers</h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowTransferDrawer(
                true
              )
            }
          >
            <Plus size={13} />
            New transfer
          </button>
        </div>

        <div className="transfer-toolbar">
          <div className="transfer-search">
            <Search size={14} />

            <input
              value={transferSearch}
              onChange={(event) => {
                setTransferSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search transfer, SKU or product..."
            />
          </div>

          <label>
            <span>Status</span>
            <div>
              <select
                value={transferStatus}
                onChange={(event) => {
                  setTransferStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {TRANSFER_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                    >
                      {status}
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
                value={transferSort}
                onChange={(event) =>
                  setTransferSort(
                    event.target.value
                  )
                }
              >
                <option value="newest">
                  Newest
                </option>
                <option value="quantity-high">
                  Highest quantity
                </option>
                <option value="quantity-low">
                  Lowest quantity
                </option>
              </select>

              <ChevronDown
                size={12}
              />
            </div>
          </label>
        </div>

        <div className="transfer-table-wrapper">
          <table className="transfer-table">
            <thead>
              <tr>
                <th>TRANSFER</th>
                <th>PRODUCT</th>
                <th>QUANTITY</th>
                <th>ROUTE</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th>ETA</th>
              </tr>
            </thead>

            <tbody>
              {visibleTransfers.map(
                (transfer) => (
                  <tr
                    key={transfer.id}
                  >
                    <td>
                      <strong>
                        {transfer.id}
                      </strong>
                      <span>
                        {transfer.created}
                      </span>
                    </td>

                    <td>
                      <div className="transfer-product">
                        <div>
                          <Package
                            size={15}
                          />
                        </div>

                        <section>
                          <strong>
                            {transfer.product}
                          </strong>
                          <span>
                            {transfer.sku}
                          </span>
                        </section>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {transfer.quantity}
                      </strong>
                      <span>units</span>
                    </td>

                    <td>
                      <div className="transfer-route">
                        <span>
                          {transfer.from}
                        </span>
                        <ArrowRight
                          size={12}
                        />
                        <span>
                          {transfer.to}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="transfer-reason">
                        {transfer.reason}
                      </span>
                    </td>

                    <td>
                      <TransferStatus
                        status={
                          transfer.status
                        }
                      />
                    </td>

                    <td>
                      <span className="transfer-eta">
                        {transfer.eta}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <footer className="transfer-pagination">
          <span>
            Showing{" "}
            <strong>
              {visibleTransfers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredTransfers.length}
            </strong>{" "}
            transfers
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
                <option value="5">
                  5
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
                size={13}
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
                size={13}
              />
            </button>
          </div>
        </footer>
      </section>

      {selectedWarehouse && (
        <>
          <div
            className="warehouse-drawer-backdrop"
            onClick={() =>
              setSelectedWarehouse(
                null
              )
            }
          />

          <WarehouseDetails
            warehouse={
              selectedWarehouse
            }
            onClose={() =>
              setSelectedWarehouse(
                null
              )
            }
          />
        </>
      )}

      {showTransferDrawer && (
        <>
          <div
            className="warehouse-drawer-backdrop"
            onClick={() =>
              setShowTransferDrawer(
                false
              )
            }
          />

          <TransferDrawer
            onClose={() =>
              setShowTransferDrawer(
                false
              )
            }
            onCreate={
              handleCreateTransfer
            }
          />
        </>
      )}
    </main>
  );
}

function WarehouseIcon() {
  return (
    <Boxes
      size={18}
      strokeWidth={1.8}
    />
  );
}