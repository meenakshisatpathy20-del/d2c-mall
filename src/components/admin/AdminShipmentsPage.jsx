import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Send,
  Truck,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminShipmentsPage.css";

const INITIAL_SHIPMENTS = [
  {
    shipmentId: "SHP-240923-0841",
    orderId: "D2C24092381",
    customer: "Ananya Sharma",
    phone: "+91 98XXXXXX41",
    warehouse: "Bhiwandi",
    carrier: "Delhivery",
    awb: "DEL9827415632",
    status: "In Transit",
    payment: "Prepaid",
    amount: 2398,
    origin: "Mumbai",
    destination: "Pune",
    created: "23 Sep 2026, 11:24 AM",
    pickup: "23 Sep 2026",
    eta: "25 Sep 2026",
    lastUpdate: "Reached Pune Hub",
    service: "Surface",
  },
  {
    shipmentId: "SHP-240923-0838",
    orderId: "D2C24092376",
    customer: "Rahul Verma",
    phone: "+91 97XXXXXX18",
    warehouse: "Delhi NCR",
    carrier: "Shiprocket",
    awb: "SRK7418529630",
    status: "Ready for Pickup",
    payment: "COD",
    amount: 1699,
    origin: "Delhi",
    destination: "Jaipur",
    created: "23 Sep 2026, 10:48 AM",
    pickup: "Pending",
    eta: "27 Sep 2026",
    lastUpdate: "Shipment created",
    service: "Surface",
  },
  {
    shipmentId: "SHP-240923-0831",
    orderId: "D2C24092369",
    customer: "Meera Iyer",
    phone: "+91 96XXXXXX62",
    warehouse: "Bengaluru",
    carrier: "Blue Dart",
    awb: "BD4829157301",
    status: "Out for Delivery",
    payment: "Prepaid",
    amount: 3199,
    origin: "Bengaluru",
    destination: "Bengaluru",
    created: "22 Sep 2026, 04:32 PM",
    pickup: "22 Sep 2026",
    eta: "23 Sep 2026",
    lastUpdate: "Out for delivery",
    service: "Express",
  },
  {
    shipmentId: "SHP-240922-0827",
    orderId: "D2C24092291",
    customer: "Arjun Nair",
    phone: "+91 99XXXXXX07",
    warehouse: "Bhiwandi",
    carrier: "Delhivery",
    awb: "DEL6372918450",
    status: "Delivered",
    payment: "Prepaid",
    amount: 1299,
    origin: "Mumbai",
    destination: "Mumbai",
    created: "22 Sep 2026, 09:17 AM",
    pickup: "22 Sep 2026",
    eta: "23 Sep 2026",
    lastUpdate: "Delivered to customer",
    service: "Surface",
  },
  {
    shipmentId: "SHP-240922-0819",
    orderId: "D2C24092274",
    customer: "Priya Menon",
    phone: "+91 95XXXXXX33",
    warehouse: "Bengaluru",
    carrier: "Ecom Express",
    awb: "ECX5192837461",
    status: "Delayed",
    payment: "COD",
    amount: 899,
    origin: "Bengaluru",
    destination: "Hyderabad",
    created: "21 Sep 2026, 02:42 PM",
    pickup: "21 Sep 2026",
    eta: "23 Sep 2026",
    lastUpdate: "Weather delay at hub",
    service: "Surface",
  },
  {
    shipmentId: "SHP-240921-0798",
    orderId: "D2C24092158",
    customer: "Vikram Singh",
    phone: "+91 94XXXXXX12",
    warehouse: "Jaipur",
    carrier: "XpressBees",
    awb: "XB7391826450",
    status: "Pickup Pending",
    payment: "COD",
    amount: 2499,
    origin: "Jaipur",
    destination: "Delhi",
    created: "21 Sep 2026, 11:03 AM",
    pickup: "Pending",
    eta: "25 Sep 2026",
    lastUpdate: "Pickup assigned",
    service: "Surface",
  },
  {
    shipmentId: "SHP-240920-0783",
    orderId: "D2C24092044",
    customer: "Kavya Rao",
    phone: "+91 93XXXXXX64",
    warehouse: "Delhi NCR",
    carrier: "Delhivery",
    awb: "DEL4185273960",
    status: "Delivered",
    payment: "Prepaid",
    amount: 1799,
    origin: "Delhi",
    destination: "Lucknow",
    created: "20 Sep 2026, 03:21 PM",
    pickup: "20 Sep 2026",
    eta: "23 Sep 2026",
    lastUpdate: "Delivered to customer",
    service: "Surface",
  },
];

const STATUS_OPTIONS = [
  "All",
  "Ready for Pickup",
  "Pickup Pending",
  "In Transit",
  "Out for Delivery",
  "Delayed",
  "Delivered",
  "Cancelled",
];

const CARRIERS = [
  "All",
  "Shiprocket",
  "Delhivery",
  "Blue Dart",
  "Ecom Express",
  "XpressBees",
];

function ShipmentStatus({ status }) {
  const className = status
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span className={`shipment-status ${className}`}>
      <i />
      {status}
    </span>
  );
}

function ShipmentTimeline({ shipment }) {
  const steps = [
    {
      label: "Shipment created",
      date: shipment.created,
      completed: true,
    },
    {
      label: "Pickup",
      date:
        shipment.pickup === "Pending"
          ? "Awaiting pickup"
          : shipment.pickup,
      completed: ![
        "Ready for Pickup",
        "Pickup Pending",
      ].includes(shipment.status),
    },
    {
      label: "In transit",
      date:
        shipment.status === "In Transit" ||
        shipment.status === "Out for Delivery" ||
        shipment.status === "Delivered" ||
        shipment.status === "Delayed"
          ? shipment.lastUpdate
          : "Pending",
      completed: [
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Delayed",
      ].includes(shipment.status),
    },
    {
      label: "Out for delivery",
      date:
        shipment.status === "Out for Delivery" ||
        shipment.status === "Delivered"
          ? "Today"
          : "Pending",
      completed: [
        "Out for Delivery",
        "Delivered",
      ].includes(shipment.status),
    },
    {
      label: "Delivered",
      date:
        shipment.status === "Delivered"
          ? "Completed"
          : "Pending",
      completed: shipment.status === "Delivered",
    },
  ];

  return (
    <div className="shipment-timeline">
      {steps.map((step, index) => (
        <div
          className={`shipment-timeline-item ${
            step.completed ? "completed" : ""
          }`}
          key={step.label}
        >
          <div className="shipment-timeline-marker">
            {step.completed ? (
              <CheckCircle2 size={14} />
            ) : (
              <span />
            )}

            {index !== steps.length - 1 && (
              <i />
            )}
          </div>

          <div>
            <strong>{step.label}</strong>
            <span>{step.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShipmentDrawer({
  shipment,
  onClose,
  onStatusUpdate,
}) {
  const [status, setStatus] = useState(
    shipment.status
  );

  const saveStatus = () => {
    onStatusUpdate?.(
      shipment.shipmentId,
      status
    );
  };

  return (
    <motion.aside
      className="shipment-details-drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
    >
      <header>
        <div>
          <span>SHIPMENT DETAILS</span>
          <h2>{shipment.shipmentId}</h2>
          <small>
            Order {shipment.orderId}
          </small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="shipment-drawer-body">
        <div className="shipment-drawer-status">
          <ShipmentStatus status={shipment.status} />
        </div>

        <section className="shipment-summary-card">
          <div>
            <span>Carrier</span>
            <strong>{shipment.carrier}</strong>
          </div>

          <div>
            <span>AWB</span>
            <strong>{shipment.awb}</strong>
          </div>

          <div>
            <span>Service</span>
            <strong>{shipment.service}</strong>
          </div>

          <div>
            <span>Payment</span>
            <strong>{shipment.payment}</strong>
          </div>
        </section>

        <section className="shipment-drawer-section">
          <header>
            <Package size={14} />
            <span>Shipment journey</span>
          </header>

          <ShipmentTimeline shipment={shipment} />
        </section>

        <section className="shipment-drawer-section">
          <header>
            <MapPin size={14} />
            <span>Route</span>
          </header>

          <div className="shipment-route-card">
            <div>
              <i />
              <span>Origin</span>
              <strong>{shipment.origin}</strong>
            </div>

            <ArrowRight size={15} />

            <div>
              <i />
              <span>Destination</span>
              <strong>{shipment.destination}</strong>
            </div>
          </div>
        </section>

        <section className="shipment-drawer-section">
          <header>
            <Truck size={14} />
            <span>Customer</span>
          </header>

          <div className="shipment-customer">
            <strong>{shipment.customer}</strong>
            <span>{shipment.phone}</span>
            <span>{shipment.orderId}</span>
          </div>
        </section>

        <section className="shipment-drawer-section">
          <header>
            <RefreshCw size={14} />
            <span>Update shipment</span>
          </header>

          <label className="shipment-status-update">
            <span>Status</span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              {STATUS_OPTIONS
                .filter(
                  (item) => item !== "All"
                )
                .map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>

          <button
            type="button"
            className="shipment-save-status"
            onClick={saveStatus}
          >
            Save status
          </button>
        </section>

        <section className="shipment-drawer-section">
          <header>
            <Clock3 size={14} />
            <span>Latest update</span>
          </header>

          <div className="shipment-latest-update">
            <strong>{shipment.lastUpdate}</strong>
            <span>
              Last carrier event received for this shipment.
            </span>
          </div>
        </section>
      </div>

      <footer>
        <button type="button">
          <Copy size={13} />
          Copy AWB
        </button>

        <button type="button">
          <ExternalLink size={13} />
          Track carrier
        </button>
      </footer>
    </motion.aside>
  );
}

function CreateShipmentDrawer({
  onClose,
  onCreate,
}) {
  const [orderId, setOrderId] =
    useState("");
  const [warehouse, setWarehouse] =
    useState("Bhiwandi");
  const [carrier, setCarrier] =
    useState("Shiprocket");
  const [service, setService] =
    useState("Surface");
  const [amount, setAmount] =
    useState("");
  const [payment, setPayment] =
    useState("Prepaid");

  const createShipment = () => {
    if (!orderId || !amount) {
      return;
    }

    const shipment = {
      shipmentId: `SHP-${Date.now()}`,
      orderId,
      customer: "Order customer",
      phone: "",
      warehouse,
      carrier,
      awb: "Awaiting AWB",
      status: "Ready for Pickup",
      payment,
      amount: Number(amount),
      origin: warehouse,
      destination: "To be resolved",
      created: "Just now",
      pickup: "Pending",
      eta: "To be calculated",
      lastUpdate: "Shipment created",
      service,
    };

    onCreate?.(shipment);
    onClose();
  };

  return (
    <motion.aside
      className="shipment-create-drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
    >
      <header>
        <div>
          <span>SHIPMENT CREATION</span>
          <h2>Create shipment</h2>
          <small>
            Shipment creation will later call the backend
            Shiprocket service.
          </small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="shipment-create-body">
        <label>
          <span>Order ID</span>
          <input
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value)
            }
            placeholder="D2C24092381"
          />
        </label>

        <label>
          <span>Warehouse</span>
          <select
            value={warehouse}
            onChange={(event) =>
              setWarehouse(event.target.value)
            }
          >
            <option>Bhiwandi</option>
            <option>Delhi NCR</option>
            <option>Jaipur</option>
            <option>Bengaluru</option>
          </select>
        </label>

        <label>
          <span>Carrier</span>
          <select
            value={carrier}
            onChange={(event) =>
              setCarrier(event.target.value)
            }
          >
            {CARRIERS.filter(
              (item) => item !== "All"
            ).map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Service</span>
          <select
            value={service}
            onChange={(event) =>
              setService(event.target.value)
            }
          >
            <option>Surface</option>
            <option>Express</option>
            <option>Priority</option>
          </select>
        </label>

        <label>
          <span>Payment method</span>
          <select
            value={payment}
            onChange={(event) =>
              setPayment(event.target.value)
            }
          >
            <option>Prepaid</option>
            <option>COD</option>
          </select>
        </label>

        <label>
          <span>Order value</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            placeholder="₹ 0"
          />
        </label>

        <section className="shipment-create-note">
          <Truck size={16} />

          <div>
            <strong>
              Carrier selection
            </strong>

            <p>
              Final carrier availability, serviceability,
              rate and SLA will be resolved by the backend
              before the shipment is created.
            </p>
          </div>
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
          onClick={createShipment}
        >
          <Send size={13} />
          Create shipment
        </button>
      </footer>
    </motion.aside>
  );
}

export default function AdminShipmentsPage({
  shipments: externalShipments,
  onShipmentCreate,
  onShipmentStatusChange,
}) {
  const [shipments, setShipments] =
    useState(
      externalShipments ||
        INITIAL_SHIPMENTS
    );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [carrier, setCarrier] =
    useState("All");

  const [sort, setSort] =
    useState("newest");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(6);

  const [selectedShipment, setSelectedShipment] =
    useState(null);

  const [createDrawer, setCreateDrawer] =
    useState(false);

  const filteredShipments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        shipments.filter((shipment) => {
          const matchesSearch =
            !query ||
            `${shipment.shipmentId} ${shipment.orderId} ${shipment.customer} ${shipment.awb} ${shipment.warehouse} ${shipment.carrier}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === "All" ||
            shipment.status === status;

          const matchesCarrier =
            carrier === "All" ||
            shipment.carrier === carrier;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCarrier
          );
        });

      return [...result].sort(
        (a, b) => {
          if (
            sort === "amount-high"
          ) {
            return b.amount - a.amount;
          }

          if (
            sort === "amount-low"
          ) {
            return a.amount - b.amount;
          }

          return b.shipmentId.localeCompare(
            a.shipmentId
          );
        }
      );
    }, [
      shipments,
      search,
      status,
      carrier,
      sort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredShipments.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleShipments =
    filteredShipments.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const stats = {
    total: shipments.length,
    pickup: shipments.filter(
      (item) =>
        item.status ===
          "Ready for Pickup" ||
        item.status === "Pickup Pending"
    ).length,
    transit: shipments.filter(
      (item) =>
        item.status === "In Transit"
    ).length,
    ofd: shipments.filter(
      (item) =>
        item.status ===
        "Out for Delivery"
    ).length,
    delayed: shipments.filter(
      (item) =>
        item.status === "Delayed"
    ).length,
    delivered: shipments.filter(
      (item) =>
        item.status === "Delivered"
    ).length,
  };

  const handleCreate = (
    shipment
  ) => {
    setShipments((current) => [
      shipment,
      ...current,
    ]);

    onShipmentCreate?.(
      shipment
    );

    setPage(1);
  };

  const handleStatusUpdate = (
    shipmentId,
    nextStatus
  ) => {
    setShipments((current) =>
      current.map((shipment) =>
        shipment.shipmentId ===
        shipmentId
          ? {
              ...shipment,
              status: nextStatus,
              lastUpdate:
                "Status updated just now",
            }
          : shipment
      )
    );

    setSelectedShipment(
      (current) =>
        current
          ? {
              ...current,
              status: nextStatus,
              lastUpdate:
                "Status updated just now",
            }
          : current
    );

    onShipmentStatusChange?.(
      shipmentId,
      nextStatus
    );
  };

  return (
    <main className="admin-shipments-page">
      <div className="admin-shipments-heading">
        <div>
          <span>LOGISTICS OPERATIONS</span>
          <h1>Shipments</h1>
          <p>
            Create, monitor and manage customer shipments
            across carriers and fulfilment centres.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setCreateDrawer(true)
          }
        >
          <Plus size={14} />
          Create shipment
        </button>
      </div>

      <section className="shipment-kpis">
        <div>
          <span>TOTAL SHIPMENTS</span>
          <strong>{stats.total}</strong>
          <small>Active network</small>
        </div>

        <div>
          <span>AWAITING PICKUP</span>
          <strong className="orange">
            {stats.pickup}
          </strong>
          <small>Need warehouse action</small>
        </div>

        <div>
          <span>IN TRANSIT</span>
          <strong className="blue">
            {stats.transit}
          </strong>
          <small>Moving to customers</small>
        </div>

        <div>
          <span>OUT FOR DELIVERY</span>
          <strong className="green">
            {stats.ofd}
          </strong>
          <small>Last-mile today</small>
        </div>

        <div>
          <span>DELAYED</span>
          <strong className="red">
            {stats.delayed}
          </strong>
          <small>Needs attention</small>
        </div>

        <div>
          <span>DELIVERED</span>
          <strong>{stats.delivered}</strong>
          <small>Completed shipments</small>
        </div>
      </section>

      <section className="shipment-operations">
        <div className="shipment-toolbar">
          <div className="shipment-search">
            <Search size={14} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search shipment, order, AWB or customer..."
            />
          </div>

          <label>
            <span>Status</span>

            <div>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map(
                  (item) => (
                    <option key={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <label>
            <span>Carrier</span>

            <div>
              <select
                value={carrier}
                onChange={(event) => {
                  setCarrier(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {CARRIERS.map(
                  (item) => (
                    <option key={item}>
                      {item}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <label>
            <span>Sort</span>

            <div>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target.value
                  )
                }
              >
                <option value="newest">
                  Newest
                </option>
                <option value="amount-high">
                  Highest value
                </option>
                <option value="amount-low">
                  Lowest value
                </option>
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <button
            type="button"
            className="shipment-refresh"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="shipment-table-wrapper">
          <table className="shipment-table">
            <thead>
              <tr>
                <th>SHIPMENT</th>
                <th>ORDER / CUSTOMER</th>
                <th>CARRIER / AWB</th>
                <th>WAREHOUSE</th>
                <th>ROUTE</th>
                <th>PAYMENT</th>
                <th>STATUS</th>
                <th>ETA</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleShipments.map(
                (shipment) => (
                  <tr
                    key={
                      shipment.shipmentId
                    }
                    onClick={() =>
                      setSelectedShipment(
                        shipment
                      )
                    }
                  >
                    <td>
                      <div className="shipment-id-cell">
                        <div>
                          <Package
                            size={14}
                          />
                        </div>

                        <section>
                          <strong>
                            {shipment.shipmentId}
                          </strong>

                          <span>
                            {shipment.created}
                          </span>
                        </section>
                      </div>
                    </td>

                    <td>
                      <div className="shipment-customer-cell">
                        <strong>
                          {shipment.customer}
                        </strong>

                        <span>
                          {shipment.orderId}
                        </span>

                        <small>
                          {shipment.phone}
                        </small>
                      </div>
                    </td>

                    <td>
                      <div className="shipment-carrier-cell">
                        <strong>
                          {shipment.carrier}
                        </strong>

                        <span>
                          {shipment.awb}
                        </span>

                        <small>
                          {shipment.service}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className="shipment-warehouse">
                        <MapPin size={11} />
                        {shipment.warehouse}
                      </span>
                    </td>

                    <td>
                      <div className="shipment-route-cell">
                        <span>
                          {shipment.origin}
                        </span>
                        <ArrowRight
                          size={11}
                        />
                        <span>
                          {shipment.destination}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="shipment-payment">
                        <strong>
                          ₹
                          {shipment.amount.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span
                          className={
                            shipment.payment ===
                            "COD"
                              ? "cod"
                              : "prepaid"
                          }
                        >
                          {shipment.payment}
                        </span>
                      </div>
                    </td>

                    <td>
                      <ShipmentStatus
                        status={
                          shipment.status
                        }
                      />
                    </td>

                    <td>
                      <span className="shipment-eta">
                        {shipment.eta}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="shipment-open-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedShipment(
                            shipment
                          );
                        }}
                      >
                        <ArrowRight
                          size={14}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {visibleShipments.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="shipment-empty"
                  >
                    <Truck size={26} />

                    <strong>
                      No shipments found
                    </strong>

                    <span>
                      Try changing your filters or
                      search query.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="shipment-pagination">
          <span>
            Showing{" "}
            <strong>
              {visibleShipments.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredShipments.length}
            </strong>{" "}
            shipments
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
              <ChevronLeft size={13} />
            </button>

            <span>
              {currentPage} / {totalPages}
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
              <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </section>

      {selectedShipment && (
        <>
          <div
            className="shipment-drawer-backdrop"
            onClick={() =>
              setSelectedShipment(null)
            }
          />

          <ShipmentDrawer
            shipment={selectedShipment}
            onClose={() =>
              setSelectedShipment(null)
            }
            onStatusUpdate={
              handleStatusUpdate
            }
          />
        </>
      )}

      {createDrawer && (
        <>
          <div
            className="shipment-drawer-backdrop"
            onClick={() =>
              setCreateDrawer(false)
            }
          />

          <CreateShipmentDrawer
            onClose={() =>
              setCreateDrawer(false)
            }
            onCreate={handleCreate}
          />
        </>
      )}
    </main>
  );
}