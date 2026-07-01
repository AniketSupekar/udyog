// src/components/notifications/NotificationBell.jsx
import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { createPortal } from "react-dom";
import NotificationPanel from "./NotificationPanel";
import { getNotifications, getUnreadCount } from "../../services/notification.api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  // Poll unread count every 30s — lightweight, just a count query
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) fetchNotifications();
  };

  return (
    <div style={{ position: "relative" }} ref={bellRef}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: "relative", width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer", transition: "border-color 0.15s", flexShrink: 0,
        }}
      >
        <Bell
          size={18}
          color={unreadCount > 0 ? "var(--color-accent)" : "var(--color-text-secondary)"}
          strokeWidth={unreadCount > 0 ? 2.5 : 1.8}
        />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            minWidth: 17, height: 17,
            background: "var(--color-danger)", color: "white",
            borderRadius: 99, fontSize: "0.5625rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", border: "2px solid var(--color-surface)",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <NotificationPanel
          notifications={notifications}
          setNotifications={setNotifications}
          setUnreadCount={setUnreadCount}
          loading={loading}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}