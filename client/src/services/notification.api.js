// src/services/notification.api.js
import api from "./api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data.data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread-count");
  return data.data.count;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");
  return data;
};

export const clearReadNotifications = async () => {
  const { data } = await api.delete("/notifications/clear");
  return data;
};