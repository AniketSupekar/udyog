// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFullDashboard } from "../services/dashboard.api";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import StatusBadge from "../components/StatusBadge";
import { AlertTriangle, Clock, Calendar, Hourglass, ChevronRight, IndianRupee } from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFullDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { summary, overdue, dueToday, upcoming } = data;

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
            {greeting()},
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em", lineHeight: 1.2, marginTop: 2 }}>
            {user?.name?.split(" ")[0] || "Admin"} 👋
          </h1>
        </div>
        <NotificationBell />
      </div>

      {/* OUTSTANDING BANNER */}
      {summary?.totalOutstanding > 0 && (
        <button
          onClick={() => navigate("/outstanding")}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
            border: "1.5px solid #FECACA", borderRadius: "var(--radius-lg)", padding: "14px 16px",
            marginBottom: 20, cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: "white", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IndianRupee size={18} color="var(--color-danger)" />
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-danger)", fontWeight: 500 }}>Outstanding Dues</p>
              <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-danger)" }}>
                {formatCurrency(summary.totalOutstanding)}
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="var(--color-danger)" />
        </button>
      )}

      {/* SUMMARY CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <SummaryCard label="Due Today" value={summary?.dueToday || 0} icon={Calendar} bg="#FFFBEB" color="#B45309" onClick={() => navigate("/orders?filter=due-today")} />
        <SummaryCard label="Overdue" value={summary?.overdue || 0} icon={AlertTriangle} bg="#FEF2F2" color="#B91C1C" onClick={() => navigate("/orders?filter=overdue")} />
        <SummaryCard label="Upcoming" value={summary?.upcoming || 0} icon={Clock} bg="#EFF6FF" color="#1D4ED8" onClick={() => navigate("/orders?filter=upcoming")} />
        <SummaryCard label="Pending" value={summary?.pending || 0} icon={Hourglass} bg="#F5F3FF" color="#6D28D9" onClick={() => navigate("/orders?status=PENDING")} />
      </div>

      {/* ORDER LISTS */}
      {overdue?.length > 0 && (
        <OrderSection title="Overdue" icon={<AlertTriangle size={15} color="var(--color-danger)" />} titleColor="var(--color-danger)" orders={overdue} viewAllPath="/orders?filter=overdue" navigate={navigate} />
      )}
      {dueToday?.length > 0 && (
        <OrderSection title="Due Today" icon={<Calendar size={15} color="var(--color-warning)" />} titleColor="var(--color-warning)" orders={dueToday} viewAllPath="/orders?filter=due-today" navigate={navigate} />
      )}
      {upcoming?.length > 0 && (
        <OrderSection title="Upcoming (7 days)" icon={<Clock size={15} color="var(--color-info)" />} titleColor="var(--color-info)" orders={upcoming} viewAllPath="/orders?filter=upcoming" navigate={navigate} />
      )}

      {!overdue?.length && !dueToday?.length && !upcoming?.length && (
        <div className="empty-state card" style={{ marginTop: 8 }}>
          <div className="empty-state-icon"><Calendar size={22} color="var(--color-text-tertiary)" /></div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>All clear today</p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>No orders due, overdue, or upcoming</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate("/orders/create")}>Create First Order</button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, bg, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: bg, borderRadius: "var(--radius-lg)", padding: "16px", textAlign: "left", border: "none", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={17} color={color} />
      </div>
      <p style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value}</p>
      <p style={{ fontSize: "0.8125rem", fontWeight: 500, color, marginTop: 6 }}>{label}</p>
    </button>
  );
}

function OrderSection({ title, icon, titleColor, orders, viewAllPath, navigate }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon}
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: titleColor }}>{title}</span>
        </div>
        <button onClick={() => navigate(viewAllPath)} style={{ fontSize: "0.8125rem", color: titleColor, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
          View all <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {orders.slice(0, 3).map((order) => (
          <button
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="card"
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer", border: "1px solid var(--color-border)", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
          >
            <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {order.clientSnapshot?.name}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 3 }}>{formatDate(order.deliveryDate)}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <StatusBadge status={order.status} />
              <ChevronRight size={16} color="var(--color-text-tertiary)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page">
      <div className="skeleton" style={{ height: 52, borderRadius: 12, marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
      </div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />)}
    </div>
  );
}