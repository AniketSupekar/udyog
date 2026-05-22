// src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import { getAnalyticsOverview } from "../services/analytics.api";
import { getBusinessSnapshot } from "../services/dashboard.api";
import { fetchOrders } from "../services/order.api";
import { formatCurrency } from "../utils/currency.util";
import { TrendingUp, IndianRupee, CheckCircle, Users, CreditCard, BarChart2, Plus } from "lucide-react";
import { format, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

const MONTH_OPTIONS = Array.from({ length: 12 }).map((_, i) => {
  const d = subMonths(new Date(), i);
  return { label: format(d, "MMMM yyyy"), value: format(d, "yyyy-MM") };
});

export default function Analytics() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [month, setMonth] = useState(MONTH_OPTIONS[0].value);
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAnalyticsOverview(),
      fetchOrders({ page: 1, limit: 1 }),
      getBusinessSnapshot({ month: MONTH_OPTIONS[0].value }),
    ])
      .then(([overview, ordersRes, snapshotRes]) => {
        const snap = snapshotRes.data.data;
        // Patch thisMonth with snapshot data which is more reliable
        if (overview && snap) {
          const revenue = snap.totalRevenue || 0;
          const collected = snap.totalCollected || 0;
          overview.thisMonth = {
            ...overview.thisMonth,
            revenue,
            collected,
            outstanding: revenue - collected,
            orders: snap.deliveredOrders || overview.thisMonth?.orders || 0,
            collectionRate: revenue > 0 ? Math.round((collected / revenue) * 100) : 0,
          };
        }
        setOverview(overview);
        setSnapshot(snap);
        setTotalOrders(ordersRes.pagination?.total ?? ordersRes.data?.length ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return; // skip first render, already loaded above
    setSnapshotLoading(true);
    getBusinessSnapshot({ month })
      .then(res => setSnapshot(res.data.data))
      .catch(console.error)
      .finally(() => setSnapshotLoading(false));
  }, [month]);

  if (loading) {
    return (
      <div className="page">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)}
      </div>
    );
  }

  const thisMonth = overview?.thisMonth || {};
  const collectionRate = thisMonth.collectionRate || 0;

  // True empty state — no orders at all
  if (totalOrders === 0) {
    return (
      <div className="page animate-in">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Business performance overview</p>
        </div>
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <div className="empty-state-icon">
            <BarChart2 size={22} color="var(--color-text-tertiary)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>No data yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: 4, textAlign: "center", maxWidth: 240 }}>
            Create your first order to start seeing revenue trends and insights here.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate("/orders/create")}>
            <Plus size={15} /> Create First Order
          </button>
        </div>
      </div>
    );
  }

  // Has orders but none delivered yet — show data with helpful note
  const hasDeliveredOrders = (thisMonth.revenue || 0) > 0 || (overview?.revenueTrend?.length ?? 0) > 0 || (overview?.topClients?.length ?? 0) > 0;

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Business performance overview</p>
      </div>



      {/* THIS MONTH METRICS */}
      <p className="section-label">This Month</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MetricCard label="Revenue" value={formatCurrency(thisMonth.revenue || 0)} icon={IndianRupee} iconColor="#1D4ED8" />
        <MetricCard label="Collected" value={formatCurrency(thisMonth.collected || 0)} icon={CheckCircle} iconColor="#15803D" />
        <MetricCard label="Outstanding" value={formatCurrency(thisMonth.outstanding || 0)} icon={TrendingUp} iconColor="#B91C1C" />
        <MetricCard label="Orders" value={thisMonth.orders || 0} icon={BarChart2} iconColor="#6D28D9" />
      </div>

      {/* COLLECTION RATE */}
      <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Collection Rate</p>
          <p className="amount" style={{ fontSize: "1.25rem", fontWeight: 700, color: collectionRate >= 80 ? "#15803D" : collectionRate >= 50 ? "#B45309" : collectionRate > 0 ? "#B91C1C" : "var(--color-text-tertiary)" }}>
            {collectionRate}%
          </p>
        </div>
        <div style={{ height: 8, background: "var(--color-bg)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, collectionRate)}%`,
            background: collectionRate >= 80 ? "#16A34A" : collectionRate >= 50 ? "#D97706" : "#DC2626",
            borderRadius: 99,
            transition: "width 0.6s ease",
            minWidth: collectionRate > 0 ? 4 : 0,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
          <span>Collected: {formatCurrency(thisMonth.collected || 0)}</span>
          <span>Total: {formatCurrency(thisMonth.revenue || 0)}</span>
        </div>
      </div>

      {/* REVENUE TREND */}
      {overview?.revenueTrend?.length > 0 && (
        <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
          <p className="section-label">Revenue Trend (6 months)</p>
          <RevenueBars data={overview.revenueTrend} />
        </div>
      )}

      {/* TOP CLIENTS */}
      {overview?.topClients?.length > 0 && (
        <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Users size={15} color="var(--color-accent)" />
            <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Top Clients</p>
          </div>
          {overview.topClients.map((client, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < overview.topClients.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: ["#EFF6FF","#F0FDF4","#FEF3C7","#F5F3FF","#FEF2F2"][i],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8125rem",
                  color: ["#1D4ED8","#15803D","#B45309","#6D28D9","#B91C1C"][i],
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>{client.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{client.orders} orders</p>
                </div>
              </div>
              <p className="amount" style={{ fontWeight: 700, color: "var(--color-accent)" }}>{formatCurrency(client.revenue)}</p>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENT METHOD BREAKDOWN */}
      {overview?.paymentBreakdown?.length > 0 && (
        <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <CreditCard size={15} color="var(--color-accent)" />
            <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Payment Methods</p>
          </div>
          {overview.paymentBreakdown.map((p, i) => {
            const totalAmt = overview.paymentBreakdown.reduce((s, x) => s + x.total, 0);
            const pct = totalAmt > 0 ? Math.round((p.total / totalAmt) * 100) : 0;
            const colors = ["#16A34A","#2563EB","#D97706","#7C3AED","#DC2626"];
            return (
              <div key={i} style={{ marginBottom: i < overview.paymentBreakdown.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{p.method}</span>
                  <span style={{ display: "flex", gap: 10 }}>
                    <span className="amount" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{formatCurrency(p.total)}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", minWidth: 32, textAlign: "right" }}>{pct}%</span>
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTHLY SNAPSHOT */}
      <p className="section-label">Monthly Snapshot</p>
      <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Delivered Orders</p>
          <select value={month} onChange={e => setMonth(e.target.value)} className="input" style={{ width: "auto", height: 36, fontSize: "0.8125rem" }}>
            {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {snapshotLoading ? (
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        ) : snapshot ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <SnapCard label="Orders" value={snapshot.deliveredOrders || 0} color="#15803D" />
            <SnapCard label="Revenue" value={formatCurrency(snapshot.totalRevenue || 0)} color="#1D4ED8" />
            <SnapCard label="Collected" value={formatCurrency(snapshot.totalCollected || 0)} color="#6D28D9" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RevenueBars({ data }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((d, i) => {
        const heightPct = Math.max(4, (d.revenue / maxRevenue) * 100);
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: "0.6rem", color: isLast ? "var(--color-accent)" : "var(--color-text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: isLast ? 600 : 400 }}>
              {formatCurrency(d.revenue)}
            </p>
            <div style={{ width: "100%", height: `${heightPct}%`, background: isLast ? "var(--color-accent)" : "var(--color-border)", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease", minHeight: 4 }} />
            <p style={{ fontSize: "0.625rem", color: isLast ? "var(--color-accent)" : "var(--color-text-tertiary)", fontWeight: isLast ? 600 : 400 }}>
              {d.shortMonth}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, iconColor }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px", boxShadow: "var(--shadow-xs)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={15} color={iconColor} />
        <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-tertiary)" }}>{label}</p>
      </div>
      <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}

function SnapCard({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 4 }}>{label}</p>
      <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}