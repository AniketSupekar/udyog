// src/modules/dashboard/dashboard.routes.js
import express from "express";
import {
  getFullDashboard,
  getDashboardSummary,
  getBusinessSnapshot,
} from "./dashboard.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/full", protect, getFullDashboard);       // primary — loads everything
router.get("/summary", protect, getDashboardSummary); // summary counts only
router.get("/snapshot", protect, getBusinessSnapshot); // revenue snapshot

export default router;