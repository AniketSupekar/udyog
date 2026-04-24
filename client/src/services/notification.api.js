// src/services/notification.api.js
import api from "./api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data.data; // unwrap — returns array
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");
  return data;
};