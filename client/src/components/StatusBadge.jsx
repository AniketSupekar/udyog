// src/components/StatusBadge.jsx
const CONFIG = {
  CREATED:   { label: "Created",   bg: "#EFF6FF", color: "#1D4ED8" },
  PENDING:   { label: "Pending",   bg: "#FFFBEB", color: "#B45309" },
  DELIVERED: { label: "Delivered", bg: "#F0FDF4", color: "#15803D" },
  CANCELLED: { label: "Cancelled", bg: "#FEF2F2", color: "#B91C1C" },
  UNPAID:    { label: "Unpaid",    bg: "#FEF2F2", color: "#B91C1C" },
  PARTIAL:   { label: "Partial",   bg: "#FFFBEB", color: "#B45309" },
  PAID:      { label: "Paid",      bg: "#F0FDF4", color: "#15803D" },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status, bg: "#F3F4F6", color: "#4B5563" };

  return (
    <span
      className="badge"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}