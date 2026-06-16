// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFullDashboard } from "../services/dashboard.api";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import StatusBadge from "../components/StatusBadge";
import { AlertTriangle, Clock, Calendar, Hourglass, ChevronRight, IndianRupee, Store } from "lucide-react";
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
    <>
      {/* STICKY NAVBAR HEADER */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
        padding: "12px var(--page-padding)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <img
          src="/logo.jpeg"
          alt="Udyog"
          style={{ height: 30, width: "auto", objectFit: "contain" }}
        />
        <NotificationBell />
      </div>

      <div className="page animate-in" style={{ paddingTop: 20 }}>

        {/* OUTSTANDING BANNER */}
        {summary?.totalOutstanding > 0 && (
          <button
            onClick={() => navigate("/outstanding")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "var(--radius-lg)", padding: "14px 16px",
              marginBottom: 12, cursor: "pointer", transition: "all 0.15s",
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

        {/* STOREFRONT ORDERS BANNER */}
        {summary?.storefrontNew > 0 && (
          <button
            onClick={() => navigate("/orders?source=STOREFRONT")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--color-accent-light)", border: "1.5px solid var(--color-accent)",
              borderRadius: "var(--radius-lg)", padding: "14px 16px",
              marginBottom: 12, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "var(--color-accent)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={18} color="white" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-accent)", fontWeight: 500 }}>New Store Orders</p>
                <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                  {summary.storefrontNew} order{summary.storefrontNew > 1 ? "s" : ""} to review
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: "var(--color-accent)", borderRadius: "50%", animation: "pulse 2s infinite" }} />
              <ChevronRight size={18} color="var(--color-accent)" />
            </div>
          </button>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }`}</style>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <SummaryCard
            label="Due Today" value={summary?.dueToday || 0}
            icon={Calendar} iconColor="#B45309" pill="Today" pillBg="#FFFBEB" pillColor="#B45309"
            onClick={() => navigate("/orders?filter=due-today")}
          />
          <SummaryCard
            label="Overdue" value={summary?.overdue || 0}
            icon={AlertTriangle} iconColor="#B91C1C" pill="Urgent" pillBg="#FEF2F2" pillColor="#B91C1C"
            onClick={() => navigate("/orders?filter=overdue")}
          />
          <SummaryCard
            label="Upcoming" value={summary?.upcoming || 0}
            icon={Clock} iconColor="#1D4ED8" pill="7 days" pillBg="#EFF6FF" pillColor="#1D4ED8"
            onClick={() => navigate("/orders?filter=upcoming")}
          />
          <SummaryCard
            label="Pending" value={summary?.pending || 0}
            icon={Hourglass} iconColor="#6D28D9" pill="Active" pillBg="#F5F3FF" pillColor="#6D28D9"
            onClick={() => navigate("/orders?status=PENDING")}
          />
        </div>

        {/* ORDER SECTIONS */}
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
    </>
  );
}

function SummaryCard({ label, value, icon: Icon, iconColor, pill, pillBg, pillColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: "14px", textAlign: "left",
        cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow-xs)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Icon size={17} color={iconColor} />
        <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: pillColor, background: pillBg, padding: "2px 7px", borderRadius: 4 }}>
          {pill}
        </span>
      </div>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1, fontFamily: "var(--font-mono)" }}>{value}</p>
      <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", marginTop: 6 }}>{label}</p>
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {order.clientSnapshot?.name}
                </p>
                {order.source === "STOREFRONT" && (
                  <span style={{ flexShrink: 0, fontSize: "0.5625rem", fontWeight: 700, background: "var(--color-accent-light)", color: "var(--color-accent)", padding: "1px 5px", borderRadius: 3, border: "1px solid #C7D2FE" }}>
                    STORE
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{formatDate(order.deliveryDate)}</p>
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
    <>
      <div style={{ height: 65, background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }} />
      <div className="page">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />)}
      </div>
    </>
  );
}