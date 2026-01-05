const BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api/notifications" 
    : "https://your-backend-render-url.onrender.com/api/notifications";

export async function getNotifications() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(id) {
  const res = await fetch(`${BASE_URL}/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification read");
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${BASE_URL}/read-all`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark all notifications read");
  return res.json();
}