// src/components/notifications/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import { getNotifications } from "../../services/notification.api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);
  useEffect(() => { if (open) fetchNotifications(); }, [open]);

  return (
    <div style={{ position: "relative" }} ref={bellRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: 38,
          height: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-strong)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border)"}
      >
        <Bell size={18} color={unreadCount > 0 ? "var(--color-accent)" : "var(--color-text-secondary)"} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            background: "var(--color-danger)",
            color: "white",
            borderRadius: "var(--radius-full)",
            fontSize: "0.625rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "1.5px solid var(--color-surface)",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          setNotifications={setNotifications}
          loading={loading}
          parentRef={bellRef}
          closePanel={() => setOpen(false)}
        />
      )}
    </div>
  );
}