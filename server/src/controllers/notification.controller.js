// src/controllers/notification.controller.js
import Notification from "../models/Notification.js";
import redis from "../utils/redis.js";

/* ======================
   TRIGGER NOTIFICATIONS
====================== */
export const triggerNotifications = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;

    // Call service that creates tomorrow's delivery notifications
    const notifications = await createTomorrowDeliveryNotifications(nurseryId);

    // Cache notifications safely for 60 seconds
    if (notifications && notifications.length > 0) {
      await redis.set(
        `notifications:${nurseryId}`,
        JSON.stringify(notifications),
        "EX",
        60
      );
    }

    res.json({
      success: true,
      message: "Notifications processed",
      ...notifications
    });
  } catch (err) {
    console.error("❌ Trigger notification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================
   GET ALL NOTIFICATIONS
====================== */
export const getAllNotifications = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const cacheKey = `notifications:${nurseryId}`;

    // Try to fetch from Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // If not cached, fetch from DB
    const notifications = await Notification.find({ nurseryId })
      .sort({ createdAt: -1 })
      .lean();

    // Cache fetched notifications safely
    if (notifications && notifications.length > 0) {
      await redis.set(cacheKey, JSON.stringify(notifications), "EX", 60);
    }

    res.json(notifications);
  } catch (error) {
    console.error("❌ Notification fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};

/* ======================
   MARK NOTIFICATION AS READ
====================== */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, nurseryId: req.user.nurseryId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Invalidate cache since a notification status changed
    await redis.del(`notifications:${req.user.nurseryId}`);

    res.json(notification);
  } catch (error) {
    console.error("❌ Mark notification read error:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

/* ======================
   MARK ALL NOTIFICATIONS AS READ
====================== */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { nurseryId: req.user.nurseryId, isRead: false },
      { isRead: true }
    );

    // Invalidate cache since multiple notifications changed
    await redis.del(`notifications:${req.user.nurseryId}`);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Mark all notifications read error:", error);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};