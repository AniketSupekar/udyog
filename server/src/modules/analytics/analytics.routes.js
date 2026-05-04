// src/modules/analytics/analytics.routes.js
import express from "express";
import { getAnalyticsOverview } from "./analytics.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();
router.get("/overview", protect, getAnalyticsOverview);
export default router;