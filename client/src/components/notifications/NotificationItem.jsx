// src/components/notifications/NotificationItem.jsx
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Clock, CreditCard, Truck } from "lucide-react";
import { markNotificationRead } from "../../services/notification.api";

const TYPE_CONFIG = {
  STOREFRONT_ORDER: {
    Icon: ShoppingBag,
    color: "#6366F1",
    bg: "#EEF2FF",
  },
  OVERDUE_ORDER: {
    Icon: Clock,
    color: "#B91C1C",
    bg: "#FEF2F2",
  },
  PAYMENT_RECEIVED: {
    Icon: CreditCard,
    color: "#15803D",
    bg: "#F0FDF4",
  },
  DELIVERY_REMINDER: {
    Icon: Truck,
    color: "#D97706",
    bg: "#FFFBEB",
  },
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationItem({ notification, setNotifications, setUnreadCount, onClose }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.DELIVERY_REMINDER;
  const { Icon } = cfg;

  const handleClick = async () => {
    if (!notification.isRead) {
      // Optimistic update
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try { await markNotificationRead(notification._id); } catch {}
    }
    if (notification.link) {
      onClose();
      navigate(notification.link);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 8px", borderRadius: "var(--radius-md)",
        cursor: notification.link ? "pointer" : "default",
        background: notification.isRead ? "transparent" : "var(--color-accent-light)",
        marginBottom: 2, transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={e => e.currentTarget.style.background = notification.isRead ? "var(--color-bg)" : "#E0E7FF"}
      onMouseLeave={e => e.currentTarget.style.background = notification.isRead ? "transparent" : "var(--color-accent-light)"}
    >
      {/* Type icon */}
      <div style={{ width: 34, height: 34, background: cfg.bg, borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon size={16} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: notification.isRead ? 500 : 700, color: "var(--color-text-primary)", marginBottom: 2, lineHeight: 1.35 }}>
          {notification.title}
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4, marginBottom: 4 }}>
          {notification.message}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div style={{ width: 7, height: 7, background: "var(--color-accent)", borderRadius: "50%", flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}