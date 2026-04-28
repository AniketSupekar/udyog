// src/pages/Outstanding.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getOutstanding, quickMarkPaid } from "../services/payment.api";
import { recordPayment } from "../services/order.api";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import { getPaymentReminderUrl } from "../utils/whatsapp.util";
import RecordPaymentModal from "../components/payments/RecordPaymentModal";
import StatusBadge from "../components/StatusBadge";
import {
  MessageCircle,
  CheckCircle,
  ChevronRight,
  AlertTriangle,
  Clock,
  Calendar,
  IndianRupee,
  Filter,
} from "lucide-react";

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "overdue",   label: "Overdue" },
  { key: "due-today", label: "Due Today" },
  { key: "upcoming",  label: "Upcoming" },
];

export default function Outstanding() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState({ totalOutstanding: 0, overdueCount: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOutstanding({ filter, page, limit: 20 });
      setData(res.data);
      setPagination(res.pagination);
      // Calculate summary from first load (all filter)
      if (filter === "all" && page === 1) {
        const total = res.data.reduce((sum, o) => sum + (o.payment?.remainingAmount || 0), 0);
        const overdue = res.data.filter((o) => o.daysOverdue > 0).length;
        setSummary({ totalOutstanding: total, overdueCount: overdue });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  const handleQuickPay = async (order, e) => {
    e.stopPropagation();
    if (!window.confirm(`Mark ₹${order.payment.remainingAmount} as paid for ${order.clientSnapshot?.name}?`)) return;
    setMarkingPaid(order._id);
    try {
      await quickMarkPaid(order._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setMarkingPaid(null);
    }
  };

  const handlePaymentRecorded = () => {
    setSelectedOrder(null);
    load();
  };

  const totalOutstanding = data.reduce((s, o) => s + (o.payment?.remainingAmount || 0), 0);
  const overdueOrders = data.filter((o) => o.daysOverdue > 0);

  return (
    <div className="page animate-in">

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <h1 className="page-title">Outstanding Dues</h1>
        <p className="page-subtitle">Track and collect pending payments</p>
      </div>

      {/* ── SUMMARY BANNER ── */}
      <div
        className="card p-5 mb-5"
        style={{
          background: "linear-gradient(135deg, #0F1117 0%, #1a2035 100%)",
          border: "none",
          color: "white",
        }}
      >
        <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Total Outstanding
        </p>
        <p
          className="amount"
          style={{ fontSize: "2rem", fontWeight: 700, color: "white", letterSpacing: "-0.03em", marginTop: 4 }}
        >
          {formatCurrency(totalOutstanding)}
        </p>

        {overdueOrders.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 12,
              padding: "4px 10px",
              background: "rgba(220, 38, 38, 0.2)",
              borderRadius: 99,
              border: "1px solid rgba(220,38,38,0.3)",
            }}
          >
            <AlertTriangle size={12} color="#FCA5A5" />
            <span style={{ fontSize: "0.75rem", color: "#FCA5A5", fontWeight: 500 }}>
              {overdueOrders.length} overdue {overdueOrders.length === 1 ? "order" : "orders"}
            </span>
          </div>
        )}
      </div>

      {/* ── FILTER TABS ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 2,
          marginBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className="btn btn-sm"
            style={{
              flexShrink: 0,
              background: filter === f.key ? "var(--color-accent)" : "var(--color-surface)",
              color: filter === f.key ? "white" : "var(--color-text-secondary)",
              border: `1.5px solid ${filter === f.key ? "var(--color-accent)" : "var(--color-border)"}`,
              fontWeight: filter === f.key ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      {loading ? (
        <div className="stagger space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <CheckCircle size={22} color="var(--color-accent)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
            All clear!
          </p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>
            No outstanding dues in this view
          </p>
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((order) => (
            <OrderDueCard
              key={order._id}
              order={order}
              onView={() => navigate(`/orders/${order._id}`)}
              onWhatsApp={(e) => {
                e.stopPropagation();
                const url = getPaymentReminderUrl(order, "My Business");
                if (url) window.open(url, "_blank");
              }}
              onRecordPayment={(e) => {
                e.stopPropagation();
                setSelectedOrder(order);
              }}
              onQuickPay={handleQuickPay}
              isMarkingPaid={markingPaid === order._id}
            />
          ))}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            {page} / {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {selectedOrder && (
        <RecordPaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={handlePaymentRecorded}
        />
      )}
    </div>
  );
}

/* ─── Order Due Card ────────────────────────────────────────────────── */
function OrderDueCard({ order, onView, onWhatsApp, onRecordPayment, onQuickPay, isMarkingPaid }) {
  const overdue = order.daysOverdue > 0;
  const dueToday = order.daysOverdue === 0;

  const urgencyColor = overdue
    ? "var(--color-danger)"
    : dueToday
    ? "var(--color-warning)"
    : "var(--color-info)";

  const urgencyBg = overdue
    ? "var(--color-danger-light)"
    : dueToday
    ? "var(--color-warning-light)"
    : "var(--color-info-light)";

  const urgencyLabel = overdue
    ? `${order.daysOverdue}d overdue`
    : dueToday
    ? "Due today"
    : `Due ${formatDate(order.deliveryDate)}`;

  const UrgencyIcon = overdue ? AlertTriangle : dueToday ? Clock : Calendar;

  return (
    <div
      className="card"
      style={{
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.15s",
        borderLeft: `3px solid ${urgencyColor}`,
      }}
      onClick={onView}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "var(--color-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {order.clientSnapshot?.name}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
            📞 {order.clientSnapshot?.phone}
          </p>
        </div>

        {/* Amount */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 700, color: urgencyColor }}>
            {formatCurrency(order.payment?.remainingAmount)}
          </p>
          <StatusBadge status={order.payment?.status} />
        </div>
      </div>

      {/* Urgency + Order info */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 12,
        flexWrap: "wrap",
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 99,
          background: urgencyBg,
          color: urgencyColor,
          fontSize: "0.75rem",
          fontWeight: 500,
        }}>
          <UrgencyIcon size={11} />
          {urgencyLabel}
        </span>

        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          Total: {formatCurrency(order.financial?.total)}
        </span>

        {order.payment?.totalPaid > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-accent)" }}>
            Paid: {formatCurrency(order.payment.totalPaid)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp reminder */}
        {order.clientSnapshot?.phone && (
          <button
            onClick={onWhatsApp}
            className="btn btn-sm"
            style={{
              background: "#F0FDF4",
              color: "#15803D",
              border: "1.5px solid #BBF7D0",
              flex: 1,
            }}
          >
            <MessageCircle size={14} />
            Remind
          </button>
        )}

        {/* Record partial payment */}
        <button
          onClick={onRecordPayment}
          className="btn btn-sm btn-secondary"
          style={{ flex: 1 }}
        >
          <IndianRupee size={14} />
          Record
        </button>

        {/* Quick mark all paid */}
        <button
          onClick={(e) => onQuickPay(order, e)}
          disabled={isMarkingPaid}
          className="btn btn-sm"
          style={{
            background: "var(--color-accent)",
            color: "white",
            flex: 1,
          }}
        >
          <CheckCircle size={14} />
          {isMarkingPaid ? "…" : "Paid"}
        </button>
      </div>
    </div>
  );
}