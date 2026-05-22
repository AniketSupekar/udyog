// src/pages/Outstanding.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getOutstanding, quickMarkPaid } from "../services/payment.api";
import { getBusinessProfile } from "../services/business.api";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import { getPaymentReminderUrl } from "../utils/whatsapp.util";
import RecordPaymentModal from "../components/payments/RecordPaymentModal";
import StatusBadge from "../components/StatusBadge";
import { MessageCircle, CheckCircle, AlertTriangle, Clock, Calendar, IndianRupee, Search, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const FILTERS = [
  { key: "all",       label: "All" },
  { key: "overdue",   label: "Overdue" },
  { key: "due-today", label: "Due Today" },
  { key: "upcoming",  label: "Upcoming" },
];

export default function Outstanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [confirmPay, setConfirmPay] = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    getBusinessProfile().then(setBusiness).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOutstanding({ filter, page, limit: 20 });
      setData(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };

  const handleQuickPay = async (order) => {
    setConfirmPay(null);
    setMarkingPaid(order._id);
    try {
      await quickMarkPaid(order._id);
      toast.success(`✓ ${order.clientSnapshot?.name} marked as fully paid`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setMarkingPaid(null);
    }
  };

  const handlePaymentRecorded = () => {
    setSelectedOrder(null);
    load();
  };

  const businessName = business?.name || "My Business";

  const filteredData = search.trim()
    ? data.filter(o => o.clientSnapshot?.name?.toLowerCase().includes(search.toLowerCase()) || o.clientSnapshot?.phone?.includes(search))
    : data;

  const totalOutstanding = data.reduce((s, o) => s + (o.payment?.remainingAmount || 0), 0);
  const overdueCount = data.filter(o => o.daysOverdue > 0).length;

  return (
    <div className="page animate-in">

      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Outstanding Dues</h1>
        <p className="page-subtitle">Track and collect pending payments</p>
      </div>

      {/* SUMMARY CARD — clean white, no gradient */}
      <div className="card" style={{ padding: "16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 500, marginBottom: 4 }}>Total Outstanding</p>
          <p className="amount" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
        {overdueCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-danger-light)", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid #FECACA" }}>
            <AlertTriangle size={14} color="var(--color-danger)" />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-danger)", lineHeight: 1 }}>{overdueCount}</p>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-danger)", fontWeight: 500 }}>overdue</p>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
        <input
          type="text"
          placeholder="Search by name or phone..."
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

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, marginBottom: 16, scrollbarWidth: "none" }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className="btn btn-sm"
            style={{
              flexShrink: 0,
              background: filter === f.key ? "var(--color-cta)" : "var(--color-surface)",
              color: filter === f.key ? "white" : "var(--color-text-secondary)",
              border: `1.5px solid ${filter === f.key ? "var(--color-cta)" : "var(--color-border)"}`,
              fontWeight: filter === f.key ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />)}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <CheckCircle size={22} color="var(--color-success)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
            {search ? "No results found" : "All clear!"}
          </p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>
            {search ? "Try a different name or phone number" : "No outstanding dues in this view"}
          </p>
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredData.map((order) => (
            <OrderDueCard
              key={order._id}
              order={order}
              businessName={businessName}
              businessUpiId={business?.upiId}
              onView={() => navigate(`/orders/${order._id}`)}
              onRecordPayment={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
              onQuickPay={(e) => { e.stopPropagation(); setConfirmPay(order); }}
              isMarkingPaid={markingPaid === order._id}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            {page} / {pagination.totalPages}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {selectedOrder && (
        <RecordPaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={handlePaymentRecorded}
        />
      )}

      {/* QUICK PAY CONFIRMATION BOTTOM SHEET */}
      {confirmPay && (
        <div onClick={() => setConfirmPay(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 48, height: 48, background: "#F0FDF4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle size={22} color="var(--color-success)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 4 }}>
              Mark as fully paid?
            </p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 4 }}>
              {confirmPay.clientSnapshot?.name}
            </p>
            <p className="amount" style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-success)", marginBottom: 20 }}>
              {formatCurrency(confirmPay.payment?.remainingAmount)}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmPay(null)}>Cancel</button>
              <button
                className="btn"
                style={{ flex: 1, background: "var(--color-success)", color: "white" }}
                disabled={markingPaid === confirmPay._id}
                onClick={() => handleQuickPay(confirmPay)}
              >
                {markingPaid === confirmPay._id ? "Marking…" : "Yes, mark paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDueCard({ order, businessName, businessUpiId, onView, onRecordPayment, onQuickPay, isMarkingPaid }) {
  const overdue = order.daysOverdue > 0;
  const dueToday = order.daysOverdue === 0;

  const urgencyColor = overdue ? "var(--color-danger)" : dueToday ? "var(--color-warning)" : "var(--color-info)";
  const urgencyBg = overdue ? "var(--color-danger-light)" : dueToday ? "var(--color-warning-light)" : "var(--color-info-light)";
  const urgencyLabel = overdue ? `${order.daysOverdue}d overdue` : dueToday ? "Due today" : `Due ${formatDate(order.deliveryDate)}`;
  const UrgencyIcon = overdue ? AlertTriangle : dueToday ? Clock : Calendar;

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    getPaymentReminderUrl(order, businessName, businessUpiId);
  };

  return (
    <div
      className="card"
      style={{ padding: "16px", cursor: "pointer", transition: "all 0.15s", borderLeft: `3px solid ${urgencyColor}` }}
      onClick={onView}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {order.clientSnapshot?.name}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
            📞 {order.clientSnapshot?.phone}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 700, color: urgencyColor }}>
            {formatCurrency(order.payment?.remainingAmount)}
          </p>
          <StatusBadge status={order.payment?.status} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: urgencyBg, color: urgencyColor, fontSize: "0.75rem", fontWeight: 500 }}>
          <UrgencyIcon size={11} />
          {urgencyLabel}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          Total: {formatCurrency(order.financial?.total)}
        </span>
        {order.payment?.totalPaid > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>
            Paid: {formatCurrency(order.payment.totalPaid)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }} onClick={e => e.stopPropagation()}>
        {order.clientSnapshot?.phone && (
          <button onClick={handleWhatsApp} className="btn btn-sm" style={{ background: "#F0FDF4", color: "#15803D", border: "1.5px solid #BBF7D0", flex: 1 }}>
            <MessageCircle size={14} /> Remind
          </button>
        )}
        <button onClick={onRecordPayment} className="btn btn-sm btn-secondary" style={{ flex: 1 }}>
          <IndianRupee size={14} /> Record
        </button>
        <button onClick={onQuickPay} disabled={isMarkingPaid} className="btn btn-sm" style={{ background: "var(--color-cta)", color: "white", flex: 1 }}>
          <CheckCircle size={14} />
          {isMarkingPaid ? "…" : "Paid"}
        </button>
      </div>
    </div>
  );
}