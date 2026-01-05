import { useNavigate } from "react-router-dom";
import { markNotificationRead } from "../../services/notification.api";

export default function NotificationItem({ notification, setNotifications }) {
  const navigate = useNavigate();

  const handleClick = async () => {
    // Optimistic UI update
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );

      try {
        await markNotificationRead(notification._id);
      } catch (err) {
        console.error(err);
      }
    }

    // Navigate to order details page
    navigate(`/order/${notification.orderId}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 mb-1 rounded-md cursor-pointer transition-colors duration-200
        ${notification.isRead ? "bg-gray-50 hover:bg-gray-100" : "bg-blue-50 hover:bg-blue-100"}
        shadow-sm hover:shadow-md flex items-center`}
    >
      {/* Pulsing unread dot */}
      {!notification.isRead && (
        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-ping"></span>
      )}

      <div>
        <strong className="block text-gray-800">{notification.title}</strong>
        <p className="text-gray-600 text-sm truncate">{notification.message}</p>
        <small className="text-gray-400 text-xs">
          {new Date(notification.createdAt).toLocaleString()}
        </small>
      </div>
    </div>
  );
}