import express from "express";
import { getDashboardSummary, getOverdueOrders, getDueTodayOrders, getUpcomingOrders, getBusinessSnapshot, getFullDashboard } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);
router.get("/overdue", protect, getOverdueOrders);
router.get("/due-today", protect, getDueTodayOrders);
router.get("/upcoming", protect, getUpcomingOrders);
router.get("/business-snapshot", protect, getBusinessSnapshot);

router.get("/full-dashboard", protect, getFullDashboard);
export default router;