import { createTomorrowDeliveryNotifications } from "../services/notification.service.js";
import Notification from "../models/Notification.js";

export const triggerNotifications = async (req, res) => {
  try {
    const result = await createTomorrowDeliveryNotifications();
    res.json({
      success: true,
      message: "Notifications processed",
      ...result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
  console.error("❌ Notification fetch error:", error);
  res.status(500).json({
    message: "Failed to fetch notifications",
    error: error.message
  });
}
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};