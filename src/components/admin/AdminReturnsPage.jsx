import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import "./AdminReturnsPage.css";

const INITIAL_RETURNS = [
  {
    id: "RET-260923-041",
    orderId: "D2C24090841",
    customer: "Ananya Sharma",
    phone: "+91 98XXXXXX41",
    product: "Relaxed Fit Cotton Shirt",
    sku: "D2C-W-SHIRT-001",
    qty: 1,
    amount: 899,
    reason: "Size issue",
    status: "Pickup Scheduled",
    refundStatus: "Pending",
    refundMethod: "Original payment",
    warehouse: "Bhiwandi",
    pickupDate: "25 Sep 2026",
    requested: "23 Sep 2026, 12:10 PM",
    address: "Mumbai, Maharashtra",
    inspection: "Pending",
  },
  {
    id: "RET-260923-038",
    orderId: "D2C24089972",
    customer: "Rahul Verma",
    phone: "+91 97XXXXXX18",
    product: "Premium Oversized T-Shirt",
    sku: "URBAN-M-TEE-002",
    qty: 1,
    amount: 699,
    reason: "Wrong product received",
    status: "Approved",
    refundStatus: "Pending",
    refundMethod: "UPI",
    warehouse: "Delhi NCR",
    pickupDate: "24 Sep 2026",
    requested: "23 Sep 2026, 10:42 AM",
    address: "Jaipur, Rajasthan",
    inspection: "Pending",
  },
  {
    id: "RET-260922-034",
    orderId: "D2C24089116",
    customer: "Meera Iyer",
    phone: "+91 96XXXXXX62",
    product: "Hydrating Glow Face Serum",
    sku: "GLOW-SERUM-001",
    qty: 1,
    amount: 549,
    reason: "Damaged product",
    status: "Inspection",
    refundStatus: "Pending",
    refundMethod: "Original payment",
    warehouse: "Bengaluru",
    pickupDate: "23 Sep 2026",
    requested: "22 Sep 2026, 04:18 PM",
    address: "Bengaluru, Karnataka",
    inspection: "In progress",
  },
  {
    id: "RET-260922-029",
    orderId: "D2C24088432",
    customer: "Priya Menon",
    phone: "+91 95XXXXXX33",
    product: "Everyday Street Sneakers",
    sku: "STREET-SNK-004",
    qty: 1,
    amount: 1499,
    reason: "Size issue",
    status: "Refund Pending",
    refundStatus: "Processing",
    refundMethod: "UPI",
    warehouse: "Bengaluru",
    pickupDate: "21 Sep 2026",
    requested: "22 Sep 2026, 09:26 AM",
    address: "Hyderabad, Telangana",
    inspection: "Passed",
  },
  {
    id: "RET-260921-024",
    orderId: "D2C24087391",
    customer: "Vikram Singh",
    phone: "+91 94XXXXXX12",
    product: "Wireless Noise-Cancelling Headphones",
    sku: "SOUND-HDP-001",
    qty: 1,
    amount: 2499,
    reason: "Product not as expected",
    status: "Completed",
    refundStatus: "Refunded",
    refundMethod: "Card",
    warehouse: "Delhi NCR",
    pickupDate: "20 Sep 2026",
    requested: "21 Sep 2026, 11:07 AM",
    address: "Delhi, Delhi",
    inspection: "Passed",
  },
  {
    id: "RET-260920-019",
    orderId: "D2C24086428",
    customer: "Kavya Rao",
    phone: "+91 93XXXXXX64",
    product: "Flowy Printed Midi Dress",
    sku: "D2C-DRESS-002",
    qty: 1,
    amount: 1299,
    reason: "Changed my mind",
    status: "Rejected",
    refundStatus: "Not eligible",
    refundMethod: "Original payment",
    warehouse: "Delhi NCR",
    pickupDate: "Not applicable",
    requested: "20 Sep 2026, 03:32 PM",
    address: "Delhi, Delhi",
    inspection: "Not required",
  },
  {
    id: "RET-260919-015",
    orderId: "D2C24085117",
    customer: "Arjun Nair",
    phone: "+91 99XXXXXX07",
    product: "Modern Accent Table Lamp",
    sku: "CASA-LAMP-003",
    qty: 1,
    amount: 1199,
    reason: "Damaged product",
    status: "Pickup Pending",
    refundStatus: "Pending",
    refundMethod: "UPI",
    warehouse: "Bhiwandi",
    pickupDate: "24 Sep 2026",
    requested: "19 Sep 2026, 05:42 PM",
    address: "Mumbai, Maharashtra",
    inspection: "Pending",
  },
];

const STATUS_OPTIONS = [
  "All",
  "Pickup Pending",
  "Pickup Scheduled",
  "Approved",
  "Inspection",
  "Refund Pending",
  "Completed",
  "Rejected",
];

const REASONS = [
  "All",
  "Size issue",
  "Wrong product received",
  "Damaged product",
  "Product not as expected",
  "Changed my mind",
];

function ReturnStatus({ status }) {
  return (
    <span
      className={`return-status ${status
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  );
}

function RefundStatus({ status }) {
  const isComplete = status === "Refunded";
  const isProcessing = status === "Processing";

  return (
    <span
      className={`refund-status ${
        isComplete
          ? "complete"
          : isProcessing
            ? "processing"
            : "pending"
      }`}
    >
      {isComplete ? (
        <CheckCircle2 size={11} />
      ) : (
        <Wallet size={11} />
      )}
      {status}
    </span>
  );
}

function ReturnTimeline({ item }) {
  const steps = [
    {
      label: "Request raised",
      completed: true,
      date: item.requested,
    },
    {
      label: "Return approved",
      completed: [
        "Approved",
        "Pickup Scheduled",
        "Inspection",
        "Refund Pending",
        "Completed",
      ].includes(item.status),
      date:
        item.status === "Rejected"
          ? "Rejected"
          : "Completed",
    },
    {
      label: "Pickup",
      completed: [
        "Inspection",
        "Refund Pending",
        "Completed",
      ].includes(item.status),
      date: item.pickupDate,
    },
    {
      label: "Inspection",
      completed: [
        "Refund Pending",
        "Completed",
      ].includes(item.status),
      date: item.inspection,
    },
    {
      label: "Refund",
      completed:
        item.refundStatus === "Refunded",
      date:
        item.refundStatus === "Refunded"
          ? "Completed"
          : "Pending",
    },
  ];

  return (
    <div className="return-timeline">
      {steps.map((step, index) => (
        <div
          className={`return-timeline-item ${
            step.completed ? "completed" : ""
          }`}
          key={step.label}
        >
          <div className="return-timeline-marker">
            {step.completed ? (
              <CheckCircle2 size={14} />
            ) : (
              <span />
            )}

            {index < steps.length - 1 && (
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

function ReturnDrawer({
  item,
  onClose,
  onStatusUpdate,
}) {
  const [status, setStatus] = useState(
    item.status
  );

  const saveStatus = () => {
    onStatusUpdate?.(
      item.id,
      status
    );
  };

  return (
    <motion.aside
      className="return-details-drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
    >
      <header>
        <div>
          <span>RETURN REQUEST</span>
          <h2>{item.id}</h2>
          <small>
            Order {item.orderId}
          </small>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      <div className="return-drawer-body">
        <ReturnStatus status={item.status} />

        <section className="return-product-card">
          <div className="return-product-icon">
            <Package size={18} />
          </div>

          <div>
            <strong>{item.product}</strong>
            <span>{item.sku}</span>
            <small>
              Qty {item.qty} · ₹
              {item.amount.toLocaleString(
                "en-IN"
              )}
            </small>
          </div>
        </section>

        <section className="return-drawer-section">
          <header>
            <RefreshCw size={14} />
            <span>Return journey</span>
          </header>

          <ReturnTimeline item={item} />
        </section>

        <section className="return-drawer-section">
          <header>
            <Package size={14} />
            <span>Return reason</span>
          </header>

          <div className="return-reason-card">
            <strong>{item.reason}</strong>
            <span>
              Customer initiated return request
            </span>
          </div>
        </section>

        <section className="return-drawer-section">
          <header>
            <UserRound size={14} />
            <span>Customer</span>
          </header>

          <div className="return-customer-card">
            <strong>{item.customer}</strong>
            <span>{item.phone}</span>
            <span>{item.orderId}</span>
          </div>
        </section>

        <section className="return-drawer-section">
          <header>
            <MapPin size={14} />
            <span>Pickup details</span>
          </header>

          <div className="return-pickup-card">
            <div>
              <span>Pickup address</span>
              <strong>{item.address}</strong>
            </div>

            <div>
              <span>Pickup date</span>
              <strong>
                {item.pickupDate}
              </strong>
            </div>

            <div>
              <span>Warehouse</span>
              <strong>
                {item.warehouse}
              </strong>
            </div>
          </div>
        </section>

        <section className="return-drawer-section">
          <header>
            <IndianRupee size={14} />
            <span>Refund</span>
          </header>

          <div className="return-refund-card">
            <div>
              <span>Refund amount</span>
              <strong>
                ₹
                {item.amount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>Method</span>
              <strong>
                {item.refundMethod}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <RefundStatus
                status={
                  item.refundStatus
                }
              />
            </div>
          </div>
        </section>

        <section className="return-drawer-section">
          <header>
            <RefreshCw size={14} />
            <span>Update return</span>
          </header>

          <label className="return-status-update">
            <span>Status</span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
            >
              {STATUS_OPTIONS.filter(
                (value) =>
                  value !== "All"
              ).map((value) => (
                <option
                  key={value}
                >
                  {value}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="return-save-status"
            onClick={saveStatus}
          >
            Save return status
          </button>
        </section>
      </div>

      <footer>
        <button type="button">
          Contact customer
        </button>

        <button type="button">
          Process refund
        </button>
      </footer>
    </motion.aside>
  );
}

export default function AdminReturnsPage({
  returns: externalReturns,
  onReturnStatusChange,
}) {
  const [returns, setReturns] =
    useState(
      externalReturns ||
        INITIAL_RETURNS
    );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [reason, setReason] =
    useState("All");

  const [sort, setSort] =
    useState("recent");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(6);

  const [selectedReturn, setSelectedReturn] =
    useState(null);

  const filteredReturns =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      const result =
        returns.filter((item) => {
          const matchesSearch =
            !query ||
            `${item.id} ${item.orderId} ${item.customer} ${item.product} ${item.sku} ${item.phone}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === "All" ||
            item.status === status;

          const matchesReason =
            reason === "All" ||
            item.reason === reason;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesReason
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

          return b.id.localeCompare(
            a.id
          );
        }
      );
    }, [
      returns,
      search,
      status,
      reason,
      sort,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReturns.length /
        pageSize
    )
  );

  const currentPage =
    Math.min(page, totalPages);

  const visibleReturns =
    filteredReturns.slice(
      (currentPage - 1) *
        pageSize,
      currentPage * pageSize
    );

  const metrics = useMemo(() => {
    const pending =
      returns.filter(
        (item) =>
          item.refundStatus ===
          "Pending"
      ).length;

    const processing =
      returns.filter(
        (item) =>
          item.refundStatus ===
          "Processing"
      ).length;

    const refunded =
      returns.filter(
        (item) =>
          item.refundStatus ===
          "Refunded"
      ).length;

    const refundValue =
      returns
        .filter(
          (item) =>
            item.refundStatus !==
            "Not eligible"
        )
        .reduce(
          (sum, item) =>
            sum + item.amount,
          0
        );

    return {
      total: returns.length,
      pending,
      processing,
      refunded,
      refundValue,
    };
  }, [returns]);

  const handleStatusUpdate = (
    returnId,
    nextStatus
  ) => {
    setReturns((current) =>
      current.map((item) =>
        item.id === returnId
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    setSelectedReturn(
      (current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current
    );

    onReturnStatusChange?.(
      returnId,
      nextStatus
    );
  };

  return (
    <main className="admin-returns-page">
      <div className="admin-returns-heading">
        <div>
          <span>POST-PURCHASE OPERATIONS</span>
          <h1>Returns & Refunds</h1>
          <p>
            Manage return requests, pickup, inspection and
            customer refunds.
          </p>
        </div>

        <button type="button">
          <RefreshCw size={14} />
          Refresh returns
        </button>
      </div>

      <section className="return-kpis">
        <div>
          <span>TOTAL RETURNS</span>
          <strong>{metrics.total}</strong>
          <small>
            All return requests
          </small>
        </div>

        <div>
          <span>REFUNDS PENDING</span>
          <strong className="orange">
            {metrics.pending}
          </strong>
          <small>
            Need action
          </small>
        </div>

        <div>
          <span>REFUNDS PROCESSING</span>
          <strong className="blue">
            {metrics.processing}
          </strong>
          <small>
            Payment gateway processing
          </small>
        </div>

        <div>
          <span>REFUNDED</span>
          <strong className="green">
            {metrics.refunded}
          </strong>
          <small>
            Successfully completed
          </small>
        </div>

        <div>
          <span>RETURN VALUE</span>
          <strong>
            ₹
            {metrics.refundValue.toLocaleString(
              "en-IN"
            )}
          </strong>
          <small>
            Eligible return value
          </small>
        </div>
      </section>

      <section className="return-operations">
        <div className="return-toolbar">
          <div className="return-search">
            <Search size={14} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search return, order, customer, product or SKU..."
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
                  (value) => (
                    <option
                      key={value}
                    >
                      {value}
                    </option>
                  )
                )}
              </select>

              <ChevronDown size={12} />
            </div>
          </label>

          <label>
            <span>Reason</span>

            <div>
              <select
                value={reason}
                onChange={(event) => {
                  setReason(
                    event.target.value
                  );
                  setPage(1);
                }}
              >
                {REASONS.map(
                  (value) => (
                    <option
                      key={value}
                    >
                      {value}
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
                <option value="recent">
                  Recent
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
        </div>

        <div className="return-table-wrapper">
          <table className="return-table">
            <thead>
              <tr>
                <th>RETURN</th>
                <th>CUSTOMER</th>
                <th>PRODUCT</th>
                <th>REASON</th>
                <th>VALUE</th>
                <th>WAREHOUSE</th>
                <th>RETURN STATUS</th>
                <th>REFUND</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visibleReturns.map(
                (item) => (
                  <tr
                    key={item.id}
                    onClick={() =>
                      setSelectedReturn(
                        item
                      )
                    }
                  >
                    <td>
                      <div className="return-id-cell">
                        <div>
                          <RefreshCw
                            size={14}
                          />
                        </div>

                        <section>
                          <strong>
                            {item.id}
                          </strong>

                          <span>
                            {item.orderId}
                          </span>

                          <small>
                            {item.requested}
                          </small>
                        </section>
                      </div>
                    </td>

                    <td>
                      <div className="return-customer-cell">
                        <strong>
                          {item.customer}
                        </strong>

                        <span>
                          {item.phone}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="return-product-cell">
                        <strong>
                          {item.product}
                        </strong>

                        <span>
                          {item.sku}
                        </span>

                        <small>
                          Qty {item.qty}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className="return-reason">
                        {item.reason}
                      </span>
                    </td>

                    <td>
                      <strong className="return-amount">
                        ₹
                        {item.amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <span className="return-warehouse">
                        <MapPin size={11} />
                        {item.warehouse}
                      </span>
                    </td>

                    <td>
                      <ReturnStatus
                        status={
                          item.status
                        }
                      />
                    </td>

                    <td>
                      <RefundStatus
                        status={
                          item.refundStatus
                        }
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="return-open-button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setSelectedReturn(
                            item
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

              {visibleReturns.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="return-empty"
                  >
                    <RefreshCw size={26} />

                    <strong>
                      No returns found
                    </strong>

                    <span>
                      Try changing your search or
                      filters.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="return-pagination">
          <span>
            Showing{" "}
            <strong>
              {visibleReturns.length}
            </strong>{" "}
            of{" "}
            <strong>
              {filteredReturns.length}
            </strong>{" "}
            returns
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
              <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </section>

      {selectedReturn && (
        <>
          <div
            className="return-drawer-backdrop"
            onClick={() =>
              setSelectedReturn(null)
            }
          />

          <ReturnDrawer
            item={selectedReturn}
            onClose={() =>
              setSelectedReturn(null)
            }
            onStatusUpdate={
              handleStatusUpdate
            }
          />
        </>
      )}
    </main>
  );
}