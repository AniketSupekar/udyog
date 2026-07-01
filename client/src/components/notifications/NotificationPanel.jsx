// src/components/notifications/NotificationPanel.jsx
import { useEffect, useRef } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { markAllNotificationsRead, clearReadNotifications } from "../../services/notification.api";

export default function NotificationPanel({ notifications, setNotifications, setUnreadCount, loading, onClose }) {
  const panelRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    // slight delay so the bell click doesn't immediately close it
    const t = setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handleClickOutside); };
  }, [onClose]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasRead = notifications.some(n => n.isRead);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleClearRead = async () => {
    try {
      await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch {}
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: 64, right: 12,
        width: "calc(100vw - 24px)",
        maxWidth: 380,
        maxHeight: "70dvh",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fadeUp 0.15s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>Notifications</p>
          {unreadCount > 0 && (
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, background: "var(--color-accent-light)", color: "var(--color-accent)", padding: "1px 7px", borderRadius: 99 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all read"
              style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", color: "var(--color-text-tertiary)" }}
            >
              <CheckCheck size={15} />
            </button>
          )}
          {hasRead && (
            <button
              onClick={handleClearRead}
              title="Clear read notifications"
              style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", color: "var(--color-text-tertiary)" }}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", color: "var(--color-text-tertiary)" }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: "var(--color-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Bell size={20} color="var(--color-text-tertiary)" />
            </div>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: 4 }}>All caught up</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)" }}>No notifications yet</p>
          </div>
        ) : (
          <div style={{ padding: "6px 8px" }}>
            {notifications.map(n => (
              <NotificationItem
                key={n._id}
                notification={n}
                setNotifications={setNotifications}
                setUnreadCount={setUnreadCount}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}