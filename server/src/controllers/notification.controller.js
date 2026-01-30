import { createTomorrowDeliveryNotifications } from "../services/notification.service.js";
import Notification from "../models/Notification.js";
import { getCache, setCache, delCache } from "../utils/redis.js";

export const triggerNotifications = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;   
    const result = await createTomorrowDeliveryNotifications(nurseryId);
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
    const nurseryId = req.user.nurseryId;
    const cacheKey = `notifications:${nurseryId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const notifications = await Notification.find({ nurseryId }).sort({ createdAt: -1 }).lean();

    await setCache(cacheKey, notifications, 60); // 60 seconds TTL
    res.json(notifications);
  } catch (error) {
    console.error("❌ Notification fetch error:", error);
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate({ _id: id, nurseryId: req.user.nurseryId }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    await delCache(`notifications:${req.user.nurseryId}`);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ nurseryId: req.user.nurseryId, isRead: false }, { isRead: true });
    await delCache(`notifications:${req.user.nurseryId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};