import express from "express";
import { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead, triggerNotifications } from "./notification.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getAllNotifications);
router.patch("/read-all", protect, markAllNotificationsAsRead);
router.patch("/:id/read", protect, markNotificationAsRead);
router.post("/trigger", protect, triggerNotifications);

export default router;