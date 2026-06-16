import { useEffect, useState } from "react";
import { getAnalyticsOverview } from "../services/analytics.api";
import { getBusinessSnapshot } from "../services/dashboard.api";
import { fetchOrders } from "../services/order.api";
import { formatCurrency } from "../utils/currency.util";
import { Users, CreditCard, BarChart2, Plus, TrendingUp, Receipt } from "lucide-react";
import { format, subMonths } from "date-fns";
import { useNavigate } from "react-router-dom";

const MONTH_OPTIONS = Array.from({ length: 12 }).map((_, i) => {
  const d = subMonths(new Date(), i);
  return { label: format(d, "MMMM yyyy"), value: format(d, "yyyy-MM") };
});

const CATEGORY_COLORS = {
  RENT:      { color: "#7C3AED", bg: "#F5F3FF" },
  SALARIES:  { color: "#1D4ED8", bg: "#EFF6FF" },
  UTILITIES: { color: "#D97706", bg: "#FEF3C7" },
  TRANSPORT: { color: "#0891B2", bg: "#ECFEFF" },
  SUPPLIES:  { color: "#15803D", bg: "#F0FDF4" },
  MARKETING: { color: "#DB2777", bg: "#FDF2F8" },
  EQUIPMENT: { color: "#9F580A", bg: "#FFFBEB" },
  OTHER:     { color: "#6B7280", bg: "#F9FAFB" },
};

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
      .then(([overviewRes, ordersRes, snapshotRes]) => {
        setOverview(overviewRes);
        setSnapshot(snapshotRes.data.data);
        setTotalOrders(ordersRes.pagination?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
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

  if (totalOrders === 0) {
    return (
      <div className="page animate-in">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Business performance overview</p>
        </div>
        <div className="empty-state card" style={{ marginTop: 24 }}>
          <div className="empty-state-icon"><BarChart2 size={22} color="var(--color-text-tertiary)" /></div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>No data yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: 4, textAlign: "center", maxWidth: 240 }}>
            Create your first order to start seeing insights here.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate("/orders/create")}>
            <Plus size={15} /> Create First Order
          </button>
        </div>
      </div>
    );
  }

  const t = overview?.thisMonth || {};
  const expensesByCategory = overview?.expensesByCategory || [];
  const totalExpenses = t.expenses || 0;

  return (
    <div className="page animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Business performance overview</p>
        </div>
        <button
          onClick={() => navigate("/expenses")}
          className="btn btn-ghost btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <Receipt size={15} /> Expenses
        </button>
      </div>

      {/* ── THIS MONTH ── */}
      <p className="section-label">This Month</p>

      {/* Revenue / COGS / Expenses / Profit — four key numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Revenue</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: "#1D4ED8" }}>{formatCurrency(t.revenue || 0)}</p>
        </div>
        <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>COGS</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-danger)" }}>
            {t.hasCostData ? formatCurrency(t.cogs || 0) : "—"}
          </p>
        </div>
        <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Expenses</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: totalExpenses > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>
            {totalExpenses > 0 ? formatCurrency(totalExpenses) : "—"}
          </p>
        </div>
        <div className="card" style={{
          padding: "14px 12px", textAlign: "center",
          background: (t.hasCostData || t.hasExpenses) && t.profit > 0 ? "var(--color-success-light)" : "var(--color-surface)",
          border: (t.hasCostData || t.hasExpenses) && t.profit > 0 ? "1px solid #BBF7D0" : "1px solid var(--color-border)",
        }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Profit</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: (t.hasCostData || t.hasExpenses) ? (t.profit >= 0 ? "var(--color-success)" : "var(--color-danger)") : "var(--color-text-tertiary)" }}>
            {(t.hasCostData || t.hasExpenses) ? formatCurrency(t.profit || 0) : "—"}
          </p>
        </div>
      </div>

      {/* Margin + Collection */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Margin</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: (t.hasCostData || t.hasExpenses) ? (t.profitMargin >= 30 ? "var(--color-success)" : t.profitMargin >= 10 ? "var(--color-warning)" : "var(--color-danger)") : "var(--color-text-tertiary)" }}>
            {(t.hasCostData || t.hasExpenses) ? `${t.profitMargin}%` : "—"}
          </p>
        </div>
        <div className="card" style={{ padding: "14px 12px", textAlign: "center" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Collected</p>
          <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-success)" }}>{t.collectionRate || 0}%</p>
        </div>
      </div>

      {/* Nudge if no cost or expense data */}
      {!t.hasCostData && !t.hasExpenses && (
        <div style={{ background: "var(--color-warning-light)", border: "1px solid #FCD34D", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <TrendingUp size={15} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: "0.8125rem", color: "var(--color-warning)" }}>
            Add <strong>cost prices</strong> to products and log <strong>expenses</strong> to see real profit here.
          </p>
        </div>
      )}

      {t.partialCostData && (
        <div style={{ background: "var(--color-warning-light)", border: "1px solid #FCD34D", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16 }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-warning)" }}>
            Some products don't have a cost price — profit may be understated.
          </p>
        </div>
      )}

      {/* Delivered orders */}
      <div className="card" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Delivered Orders</p>
        <p className="amount" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{t.orders || 0}</p>
      </div>

      {/* EXPENSES BREAKDOWN */}
      {expensesByCategory.length > 0 && (
        <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Receipt size={15} color="var(--color-accent)" />
              <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Expenses Breakdown</p>
            </div>
            <button
              onClick={() => navigate("/expenses")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-accent)", fontWeight: 500 }}
            >
              View all
            </button>
          </div>
          {expensesByCategory.map((e, i) => {
            const cat = CATEGORY_COLORS[e.category] || CATEGORY_COLORS.OTHER;
            const pct = totalExpenses > 0 ? Math.round((e.total / totalExpenses) * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: i < expensesByCategory.length - 1 ? 14 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="amount" style={{ fontSize: "0.875rem" }}>{formatCurrency(e.total)}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", minWidth: 32, textAlign: "right" }}>{pct}%</span>
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--color-bg)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>Total</span>
            <span className="amount" style={{ fontWeight: 700, color: "var(--color-danger)" }}>{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      )}

      {/* REVENUE TREND */}
      {overview?.revenueTrend?.length > 0 && (
        <div className="card" style={{ padding: "16px", marginBottom: 20 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Revenue Trend</p>
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
                  width: 30, height: 30, borderRadius: "50%",
                  background: ["#EFF6FF","#F0FDF4","#FEF3C7","#F5F3FF","#FEF2F2"][i],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.8125rem",
                  color: ["#1D4ED8","#15803D","#B45309","#6D28D9","#B91C1C"][i],
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{client.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{client.orders} orders</p>
                </div>
              </div>
              <p className="amount" style={{ fontWeight: 700, color: "var(--color-accent)", fontSize: "0.9rem" }}>{formatCurrency(client.revenue)}</p>
            </div>
          ))}
        </div>
      )}

      {/* PAYMENT METHODS */}
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
                    <span className="amount" style={{ fontSize: "0.875rem" }}>{formatCurrency(p.total)}</span>
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
            <SnapCard label="Orders" value={snapshot.deliveredOrders || 0} color="var(--color-text-primary)" />
            <SnapCard label="Revenue" value={formatCurrency(snapshot.totalRevenue || 0)} color="#1D4ED8" />
            <SnapCard label="Collected" value={formatCurrency(snapshot.totalCollected || 0)} color="var(--color-success)" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RevenueBars({ data }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
      {data.map((d, i) => {
        const heightPct = Math.max(4, (d.revenue / maxRevenue) * 100);
        const isLast = i === data.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <p style={{ fontSize: "0.6rem", color: isLast ? "var(--color-accent)" : "var(--color-text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: isLast ? 600 : 400 }}>
              {formatCurrency(d.revenue)}
            </p>
            <div style={{ width: "100%", height: `${heightPct}%`, background: isLast ? "var(--color-accent)" : "var(--color-border)", borderRadius: "4px 4px 0 0", minHeight: 4 }} />
            <p style={{ fontSize: "0.625rem", color: isLast ? "var(--color-accent)" : "var(--color-text-tertiary)", fontWeight: isLast ? 600 : 400 }}>
              {d.shortMonth}
            </p>
          </div>
        );
      })}
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