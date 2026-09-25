
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import "./AdminFranchisePage.css";

const INITIAL_APPLICATIONS = [
  {
    id: "FR-26092301",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    phone: "+91 9876543210",
    city: "Mumbai",
    state: "Maharashtra",
    model: "FOFO",
    investment: "₹15L – ₹30L",
    experience: "5 years in fashion retail",
    storeArea: "1200 sq.ft.",
    property: "Yes",
    message: "Interested in opening a D2C Mall store in Andheri.",
    status: "New",
    submittedAt: "2026-09-23T10:30:00",
    followUpDate: "",
    notes: "",
  },
  {
    id: "FR-26092302",
    name: "Sneha Kapoor",
    email: "sneha@example.com",
    phone: "+91 9876543211",
    city: "Delhi",
    state: "Delhi",
    model: "FOCO",
    investment: "₹30L – ₹50L",
    experience: "Commercial property investor",
    storeArea: "1600 sq.ft.",
    property: "Yes",
    message: "Available commercial property in South Delhi.",
    status: "Under Review",
    submittedAt: "2026-09-23T09:15:00",
    followUpDate: "2026-09-26",
    notes: "Review property details.",
  },
  {
    id: "FR-26092203",
    name: "Rohan Shah",
    email: "rohan@example.com",
    phone: "+91 9876543212",
    city: "Ahmedabad",
    state: "Gujarat",
    model: "FOFO",
    investment: "₹15L – ₹30L",
    experience: "Owns two lifestyle stores",
    storeArea: "1100 sq.ft.",
    property: "Yes",
    message: "Interested in expansion through D2C Mall.",
    status: "Contacted",
    submittedAt: "2026-09-22T16:45:00",
    followUpDate: "2026-09-25",
    notes: "Initial discussion completed.",
  },
  {
    id: "FR-26092204",
    name: "Priya Nair",
    email: "priya@example.com",
    phone: "+91 9876543213",
    city: "Bengaluru",
    state: "Karnataka",
    model: "FOCO",
    investment: "₹30L – ₹50L",
    experience: "Retail and hospitality",
    storeArea: "1800 sq.ft.",
    property: "Yes",
    message: "Looking for a franchise opportunity in Bengaluru.",
    status: "Site Verification",
    submittedAt: "2026-09-22T11:20:00",
    followUpDate: "2026-09-27",
    notes: "Site visit needs confirmation.",
  },
  {
    id: "FR-26092105",
    name: "Aditya Singh",
    email: "aditya@example.com",
    phone: "+91 9876543214",
    city: "Jaipur",
    state: "Rajasthan",
    model: "FOFO",
    investment: "₹10L – ₹15L",
    experience: "3 years in retail",
    storeArea: "900 sq.ft.",
    property: "Looking",
    message: "Interested in a Jaipur franchise.",
    status: "Approved",
    submittedAt: "2026-09-21T14:10:00",
    followUpDate: "",
    notes: "Application approved for next-stage discussion.",
  },
  {
    id: "FR-26092006",
    name: "Neha Gupta",
    email: "neha@example.com",
    phone: "+91 9876543215",
    city: "Pune",
    state: "Maharashtra",
    model: "FOFO",
    investment: "₹15L – ₹30L",
    experience: "First-time entrepreneur",
    storeArea: "800 sq.ft.",
    property: "No",
    message: "Exploring franchise opportunities.",
    status: "Rejected",
    submittedAt: "2026-09-20T12:00:00",
    followUpDate: "",
    notes: "Application closed after review.",
  },
];

const STATUSES = [
  "New",
  "Under Review",
  "Contacted",
  "Site Verification",
  "Approved",
  "Rejected",
];

const STATUS_CLASS = {
  New: "new",
  "Under Review": "review",
  Contacted: "contacted",
  "Site Verification": "verification",
  Approved: "approved",
  Rejected: "rejected",
};

function formatDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`af-status ${
        STATUS_CLASS[status] || "new"
      }`}
    >
      <span className="af-status-dot" />
      {status}
    </span>
  );
}

function ApplicationDrawer({
  application,
  onClose,
  onStatusChange,
  onNotesChange,
  onFollowUpChange,
}) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes || "");
  const [followUp, setFollowUp] = useState(
    application.followUpDate || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(application.status);
    setNotes(application.notes || "");
    setFollowUp(application.followUpDate || "");
    setError("");
  }, [application]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      if (status !== application.status) {
        await onStatusChange(application.id, status);
      }

      if (notes !== (application.notes || "")) {
        await onNotesChange(application.id, notes);
      }

      if (followUp !== (application.followUpDate || "")) {
        await onFollowUpChange(application.id, followUp);
      }

      onClose();
    } catch (err) {
      setError(err?.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.aside
      className="af-drawer"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.25 }}
    >
      <header className="af-drawer-header">
        <div>
          <span className="af-eyebrow">APPLICATION DETAILS</span>
          <h2>{application.id}</h2>
          <p>Submitted {formatDate(application.submittedAt)}</p>
        </div>

        <button
          type="button"
          className="af-icon-button"
          onClick={onClose}
          aria-label="Close application"
        >
          <X size={19} />
        </button>
      </header>

      <div className="af-drawer-content">
        <div className="af-drawer-status">
          <span>Current status</span>
          <StatusBadge status={application.status} />
        </div>

        <section className="af-detail-section">
          <h3>
            <Users size={16} />
            Applicant
          </h3>

          <div className="af-applicant-profile">
            <div className="af-avatar">
              {application.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div>
              <strong>{application.name}</strong>
              <span>{application.experience || "Not provided"}</span>
            </div>
          </div>

          <div className="af-contact-list">
            <a href={`mailto:${application.email}`}>
              <Mail size={15} />
              {application.email}
            </a>

            <a href={`tel:${application.phone}`}>
              <Phone size={15} />
              {application.phone}
            </a>

            <span>
              <MapPin size={15} />
              {application.city}, {application.state}
            </span>
          </div>
        </section>

        <section className="af-detail-section">
          <h3>
            <Store size={16} />
            Franchise proposal
          </h3>

          <div className="af-detail-grid">
            <div>
              <span>Model</span>
              <strong>{application.model}</strong>
            </div>

            <div>
              <span>Investment</span>
              <strong>{application.investment}</strong>
            </div>

            <div>
              <span>Store area</span>
              <strong>{application.storeArea || "Not specified"}</strong>
            </div>

            <div>
              <span>Property</span>
              <strong>{application.property || "Not specified"}</strong>
            </div>
          </div>

          {application.message && (
            <div className="af-applicant-message">
              <span>Applicant's message</span>
              <p>{application.message}</p>
            </div>
          )}
        </section>

        <section className="af-detail-section">
          <h3>
            <Clock3 size={16} />
            Application review
          </h3>

          <label className="af-field">
            <span>Application status</span>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="af-field">
            <span>Next follow-up</span>

            <input
              type="date"
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
            />
          </label>

          <label className="af-field">
            <span>Internal notes</span>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              placeholder="Add review notes, discussion details or next steps..."
            />
          </label>

          {error && <p className="af-error">{error}</p>}
        </section>
      </div>

      <footer className="af-drawer-footer">
        <button type="button" className="af-secondary" onClick={onClose}>
          Cancel
        </button>

        <button
          type="button"
          className="af-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
          {!saving && <ArrowRight size={15} />}
        </button>
      </footer>
    </motion.aside>
  );
}

export default function AdminFranchisePage({
  applications: externalApplications,
  onStatusChange,
  onNotesChange,
  onFollowUpChange,
}) {
  const [localApplications, setLocalApplications] = useState(
    externalApplications ?? INITIAL_APPLICATIONS
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (externalApplications) {
      setLocalApplications(externalApplications);
    }
  }, [externalApplications]);

  const applications = externalApplications ?? localApplications;

  const selectedApplication = applications.find(
    (item) => item.id === selectedId
  );

  const metrics = useMemo(
    () => ({
      total: applications.length,
      new: applications.filter((item) => item.status === "New").length,
      inProgress: applications.filter((item) =>
        ["Under Review", "Contacted", "Site Verification"].includes(
          item.status
        )
      ).length,
      approved: applications.filter(
        (item) => item.status === "Approved"
      ).length,
      followUps: applications.filter(
        (item) =>
          item.followUpDate &&
          !["Approved", "Rejected"].includes(item.status)
      ).length,
    }),
    [applications]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = applications.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.id,
          item.name,
          item.email,
          item.phone,
          item.city,
          item.state,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        matchesSearch &&
        (statusFilter === "All" || item.status === statusFilter) &&
        (modelFilter === "All" || item.model === modelFilter)
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      }

      if (sort === "name") {
        return a.name.localeCompare(b.name);
      }

      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
  }, [applications, search, statusFilter, modelFilter, sort]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const updateApplication = async (id, changes, callback, value) => {
    if (callback) {
      await callback(id, value);
    }

    if (!externalApplications) {
      setLocalApplications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, ...changes } : item
        )
      );
    }
  };

  const exportCSV = () => {
    const columns = [
      "id",
      "name",
      "email",
      "phone",
      "city",
      "state",
      "model",
      "investment",
      "status",
      "submittedAt",
      "followUpDate",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const csv = [
      columns.join(","),
      ...filtered.map((item) =>
        columns.map((key) => escapeCSV(item[key])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "d2c-franchise-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-franchise-page">
      <header className="af-page-header">
        <div>
          <span className="af-eyebrow">EXPANSION OPERATIONS</span>
          <h1>Franchise Management</h1>
          <p>
            Review applications, manage prospects and track franchise
            expansion.
          </p>
        </div>

        <button type="button" className="af-export" onClick={exportCSV}>
          <Download size={15} />
          Export Applications
        </button>
      </header>

      <section className="af-metrics">
        {[
          {
            label: "TOTAL APPLICATIONS",
            value: metrics.total,
            icon: Users,
            tone: "navy",
            detail: "All enquiries",
          },
          {
            label: "NEW APPLICATIONS",
            value: metrics.new,
            icon: Mail,
            tone: "orange",
            detail: "Awaiting review",
          },
          {
            label: "IN PROGRESS",
            value: metrics.inProgress,
            icon: Clock3,
            tone: "blue",
            detail: "Active pipeline",
          },
          {
            label: "APPROVED",
            value: metrics.approved,
            icon: CheckCircle2,
            tone: "green",
            detail: "Approved applications",
          },
          {
            label: "FOLLOW-UPS",
            value: metrics.followUps,
            icon: CalendarDays,
            tone: "purple",
            detail: "Scheduled follow-ups",
          },
        ].map(({ label, value, icon: Icon, tone, detail }) => (
          <article className="af-metric" key={label}>
            <div className={`af-metric-icon ${tone}`}>
              <Icon size={17} />
            </div>

            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="af-panel">
        <div className="af-panel-heading">
          <div>
            <h2>Franchise Applications</h2>
            <p>Manage incoming and existing franchise enquiries.</p>
          </div>

          <span className="af-count">{filtered.length} applications</span>
        </div>

        <div className="af-toolbar">
          <div className="af-search">
            <Search size={16} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search applicant, city, phone or application ID"
            />
          </div>

          <div className="af-filter">
            <Filter size={14} />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="af-filter">
            <Store size={14} />

            <select
              value={modelFilter}
              onChange={(event) => {
                setModelFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by franchise model"
            >
              <option value="All">All models</option>
              <option value="FOFO">FOFO</option>
              <option value="FOCO">FOCO</option>
            </select>
          </div>

          <select
            className="af-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort applications"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Applicant name</option>
          </select>
        </div>

        <div className="af-table-scroll">
          <table className="af-table">
            <thead>
              <tr>
                <th>APPLICATION</th>
                <th>APPLICANT</th>
                <th>LOCATION</th>
                <th>MODEL</th>
                <th>INVESTMENT</th>
                <th>STATUS</th>
                <th>FOLLOW-UP</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {visible.map((application) => (
                <tr
                  key={application.id}
                  onClick={() => setSelectedId(application.id)}
                >
                  <td>
                    <div className="af-id-cell">
                      <strong>{application.id}</strong>
                      <span>{formatDate(application.submittedAt)}</span>
                    </div>
                  </td>

                  <td>
                    <div className="af-name-cell">
                      <div className="af-table-avatar">
                        {application.name[0]}
                      </div>

                      <div>
                        <strong>{application.name}</strong>
                        <span>{application.email}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="af-location-cell">
                      <MapPin size={13} />
                      <span>
                        {application.city}
                        <small>{application.state}</small>
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="af-model">{application.model}</span>
                  </td>

                  <td className="af-investment">
                    {application.investment}
                  </td>

                  <td>
                    <StatusBadge status={application.status} />
                  </td>

                  <td className="af-followup">
                    {formatDate(application.followUpDate)}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="af-row-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(application.id);
                      }}
                      aria-label={`View ${application.name}'s application`}
                    >
                      <ArrowRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length === 0 && (
            <div className="af-empty">
              <Building2 size={30} />
              <strong>No applications found</strong>
              <p>Try another search or change your filters.</p>
            </div>
          )}
        </div>

        <footer className="af-pagination">
          <span>
            Showing {visible.length} of {filtered.length} applications
          </span>

          <div>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      <AnimatePresence>
        {selectedApplication && (
          <>
            <motion.div
              className="af-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
            />

            <ApplicationDrawer
              key={selectedApplication.id}
              application={selectedApplication}
              onClose={() => setSelectedId(null)}
              onStatusChange={(id, value) =>
                updateApplication(
                  id,
                  { status: value },
                  onStatusChange,
                  value
                )
              }
              onNotesChange={(id, value) =>
                updateApplication(
                  id,
                  { notes: value },
                  onNotesChange,
                  value
                )
              }
              onFollowUpChange={(id, value) =>
                updateApplication(
                  id,
                  { followUpDate: value },
                  onFollowUpChange,
                  value
                )
              }
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}