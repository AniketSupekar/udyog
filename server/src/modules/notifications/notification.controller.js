// src/modules/notifications/notification.controller.js
import Notification from "../../models/Notification.js";
import { getCache, setCache, delCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

/* ─── GET /api/notifications ─────────────────────────────────────────────── */
export const getAllNotifications = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cacheKey = `notifications:${businessId}`;

  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const notifications = await Notification.find({ businessId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  await setCache(cacheKey, notifications, 60);
  sendSuccess(res, notifications);
});

/* ─── GET /api/notifications/unread-count ────────────────────────────────── */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    businessId: req.user.businessId,
    isRead: false,
  });
  sendSuccess(res, { count });
});

/* ─── PATCH /api/notifications/:id/read ─────────────────────────────────── */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, businessId: req.user.businessId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  await delCache(`notifications:${req.user.businessId}`);
  sendSuccess(res, notification);
});

/* ─── PATCH /api/notifications/read-all ─────────────────────────────────── */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { businessId: req.user.businessId, isRead: false },
    { isRead: true }
  );
  await delCache(`notifications:${req.user.businessId}`);
  sendSuccess(res, null, "All notifications marked as read");
});

/* ─── DELETE /api/notifications/clear ───────────────────────────────────── */
// Clears all read notifications — keeps inbox clean
export const clearReadNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    businessId: req.user.businessId,
    isRead: true,
  });
  await delCache(`notifications:${req.user.businessId}`);
  sendSuccess(res, null, "Read notifications cleared");
});