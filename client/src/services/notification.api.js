const BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api/notifications" 
    : "https://nursery-app-iin1.onrender.com/api/notifications";

const fetchWithAuth = (url, options = {}) =>
  fetch(url, {
    credentials: "include",
    ...options
  });

export async function getNotifications() {
  const res = await fetchWithAuth(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(id) {
  const res = await fetchWithAuth(`${BASE_URL}/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification read");
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetchWithAuth(`${BASE_URL}/read-all`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark all notifications read");
  return res.json();
}