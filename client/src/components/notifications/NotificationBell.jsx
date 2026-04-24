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
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={22} className={unreadCount > 0 ? "text-blue-600" : "text-gray-600"} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1">
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