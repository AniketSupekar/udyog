import { useEffect, useState, useRef } from "react";
import NotificationPanel from "./NotificationPanel";
import { getNotifications } from "../../services/notification.api";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const bellRef = useRef();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
  setLoading(true);
  try {
    const data = await getNotifications();

    // FIX: normalize response
    setNotifications(Array.isArray(data) ? data : data.notifications || []);
  } catch (err) {
    console.error(err);
    setNotifications([]);
  } finally {
    setLoading(false);
  }
};


    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 transform hover:scale-110"
                aria-label="Notifications"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 text-gray-700 transition-colors duration-200 ${unreadCount > 0 ? "text-blue-600" : ""
                        }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full px-2 text-xs font-semibold animate-pulse">
                        {unreadCount}
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
