// src/pages/OrdersList.jsx
import { useEffect, useState, useRef } from "react";
import { fetchOrders } from "../services/order.api";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { Search, Plus, X, SlidersHorizontal, Phone } from "lucide-react";
import { formatDate } from "../utils/date.util";
import { formatCurrency } from "../utils/currency.util";

const STATUS_FILTERS = ["", "CREATED", "PENDING", "DELIVERED", "CANCELLED"];

const STATUS_BORDER = {
  CREATED: "#6366F1",
  PENDING: "#D97706",
  DELIVERED: "#16A34A",
  CANCELLED: "#9CA3AF",
};

export default function OrdersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const status = searchParams.get("status") || "";
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const debounceRef = useRef(null);

  const isDashboardView = Boolean(filter || status);
  const contextTitle = filter === "overdue" ? "Overdue Orders"
    : filter === "due-today" ? "Due Today"
    : filter === "upcoming" ? "Upcoming Orders"
    : status ? `${status.charAt(0)}${status.slice(1).toLowerCase()} Orders`
    : null;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setDebouncedSearch(search); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchOrders({ page, limit: 15, search: debouncedSearch, status, filter })
      .then(res => { setOrders(res.data || []); setPagination(res.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, filter, page]);

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        {isDashboardView && (
          <button onClick={() => navigate(-1)} style={{ fontSize: "0.8125rem", color: "var(--color-accent)", marginBottom: 8, display: "block", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            ← Back
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className="page-title">{contextTitle || "Orders"}</h1>
            <p className="page-subtitle">{orders.length > 0 ? `${pagination?.total || orders.length} total orders` : "Manage all customer orders"}</p>
          </div>
          {!isDashboardView && (
            <Link to="/orders/create" className="btn btn-primary btn-sm">
              <Plus size={15} /> New
            </Link>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: 38, paddingRight: search ? 36 : 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn-icon btn-secondary"
          style={{ borderColor: showFilters ? "var(--color-accent)" : "var(--color-border)", color: showFilters ? "var(--color-accent)" : "var(--color-text-secondary)" }}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="card animate-in" style={{ padding: "14px 16px", marginBottom: 14 }}>
          <p className="section-label">Filter by Status</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STATUS_FILTERS.map(s => (
              <button
                key={s || "ALL"}
                className="btn btn-sm"
                onClick={() => {
                  setPage(1);
                  const params = Object.fromEntries(searchParams.entries());
                  if (s) params.status = s; else delete params.status;
                  setSearchParams(params);
                  setShowFilters(false);
                }}
                style={{
                  background: status === s || (!s && !status) ? "var(--color-accent)" : "var(--color-surface)",
                  color: status === s || (!s && !status) ? "white" : "var(--color-text-secondary)",
                  border: `1.5px solid ${status === s || (!s && !status) ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 16 }} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={20} color="var(--color-text-tertiary)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>No orders found</p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {orders.map(order => {
              const borderColor = STATUS_BORDER[order.status] || "var(--color-border-strong)";
              return (
                <Link key={order._id} to={`/orders/${order._id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      background: "var(--color-surface)",
                      border: "1.5px solid var(--color-border)",
                      borderLeft: `3px solid ${borderColor}`,
                      borderRadius: "var(--radius-xl)",
                      padding: "14px 16px",
                      transition: "box-shadow 0.15s",
                      boxShadow: "var(--shadow-xs)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.clientSnapshot?.name}
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={11} /> {order.clientSnapshot?.phone}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ height: 1, background: "var(--color-border)", margin: "10px 0" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Delivery</p>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{formatDate(order.deliveryDate)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Total</p>
                        <p className="amount" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{formatCurrency(order.financial?.total)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Balance</p>
                        <p className="amount" style={{ fontSize: "0.8125rem", fontWeight: 600, color: order.payment?.remainingAmount > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                          {order.payment?.remainingAmount > 0 ? formatCurrency(order.payment?.remainingAmount) : "Paid ✓"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {pagination?.totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, alignItems: "center" }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {!isDashboardView && (
        <Link
          to="/orders/create"
          aria-label="Create new order"
          style={{
            position: "fixed",
            bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)",
            right: 24,
            width: 52,
            height: 52,
            background: "var(--color-cta)",
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            textDecoration: "none",
            zIndex: 40,
          }}
        >
          <Plus size={22} color="white" />
        </Link>
      )}
    </div>
  );
}