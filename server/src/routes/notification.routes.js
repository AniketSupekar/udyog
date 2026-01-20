import express from "express";
import { triggerNotifications, getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/trigger", protect, triggerNotifications);
router.get("/", protect, getAllNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);
router.patch("/read-all", protect, markAllNotificationsAsRead);

export default router;