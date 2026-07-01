// src/modules/notifications/notification.routes.js
import express from "express";
import {
  getAllNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from "./notification.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/",             getAllNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all",   markAllNotificationsAsRead);
router.delete("/clear",     clearReadNotifications);
router.patch("/:id/read",   markNotificationAsRead);

export default router;