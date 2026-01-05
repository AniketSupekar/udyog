import express from "express";
import { triggerNotifications, getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/trigger", triggerNotifications);
router.get("/", getAllNotifications);
router.patch("/:id/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);

export default router;