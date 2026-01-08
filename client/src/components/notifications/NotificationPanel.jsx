import { useEffect, useRef } from "react";
import NotificationItem from "./NotificationItem";
import { markAllNotificationsRead } from "../../services/notification.api";

export default function NotificationPanel({
    notifications,
    setNotifications,
    loading,
    parentRef,
    closePanel
}) {
    const panelRef = useRef();

    // Click outside detection
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                parentRef.current &&
                !parentRef.current.contains(event.target)
            ) {
                closePanel();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [parentRef, closePanel]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div
            ref={panelRef}
            className="
    fixed sm:absolute
    top-16 sm:top-12
    left-4 right-4 sm:left-auto sm:right-0
    sm:w-96
    max-h-[28rem]
    bg-white
    border border-gray-200
    shadow-xl
    rounded-lg
    p-4
    overflow-y-auto
    z-50
    transform origin-top
  "
            style={{ animation: "slideDown 0.2s ease-out forwards" }}
        >


            <div className="flex justify-between items-center mb-2">
                <strong className="text-gray-800">Notifications</strong>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-blue-500 hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {loading && <p className="text-gray-500 text-center">Loading...</p>}

            {!loading && notifications.length === 0 && (
                <p className="text-gray-500 text-center">No notifications</p>
            )}

            {!loading &&
                notifications.map(n => (
                    <NotificationItem
                        key={n._id}
                        notification={n}
                        setNotifications={setNotifications}
                    />
                ))}
        </div>
    );
}