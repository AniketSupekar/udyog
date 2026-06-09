// src/components/dashboard/SummaryCards.jsx
import { useNavigate } from "react-router-dom";
import { Calendar, AlertTriangle, Clock, Hourglass, Store } from "lucide-react";

export default function SummaryCards({ summary }) {
  const navigate = useNavigate();
  if (!summary) return null;

  const cards = [
    {
      label: "Due Today",
      value: summary.dueToday,
      icon: Calendar,
      color: "var(--color-warning)",
      bg: "var(--color-warning-light)",
      route: "/orders?filter=due-today",
    },
    {
      label: "Overdue",
      value: summary.overdue,
      icon: AlertTriangle,
      color: "var(--color-danger)",
      bg: "var(--color-danger-light)",
      route: "/orders?filter=overdue",
    },
    {
      label: "Upcoming",
      value: summary.upcoming,
      icon: Clock,
      color: "#2563EB",
      bg: "#EFF6FF",
      route: "/orders?filter=upcoming",
    },
    {
      label: "Pending",
      value: summary.pending,
      icon: Hourglass,
      color: "var(--color-accent)",
      bg: "var(--color-accent-light)",
      route: "/orders?status=PENDING",
    },
  ];

  const hasStorefrontOrders = summary.storefrontNew > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Main summary grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.route)}
              style={{
                background: card.bg,
                border: `1px solid ${card.color}22`,
                borderRadius: "var(--radius-xl)",
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "var(--shadow-xs)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
            >
              <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.7)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={16} color={card.color} />
              </div>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                {card.value ?? 0}
              </p>
              <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: card.color, marginTop: 4 }}>{card.label}</p>
            </button>
          );
        })}
      </div>

      {/* Store Orders banner — only shown when there are new storefront orders */}
      {hasStorefrontOrders && (
        <button
          onClick={() => navigate("/orders?source=STOREFRONT")}
          style={{
            width: "100%",
            background: "var(--color-accent-light)",
            border: "1.5px solid var(--color-accent)",
            borderRadius: "var(--radius-xl)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
        >
          <div style={{ width: 36, height: 36, background: "var(--color-accent)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Store size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-accent)" }}>
              {summary.storefrontNew} new store order{summary.storefrontNew > 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-accent)", opacity: 0.7, marginTop: 1 }}>
              From your public storefront — tap to review
            </p>
          </div>
          <div style={{ width: 8, height: 8, background: "var(--color-accent)", borderRadius: "50%", flexShrink: 0, animation: "pulse 2s infinite" }} />
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}