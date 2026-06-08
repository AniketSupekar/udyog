// src/modules/store/store.routes.js
import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import {
  getStorefront,
  placeStorefrontOrder,
  getOrderStatus,
  updateStoreSettings,
} from "./store.controller.js";

const router = Router();

// ── Public routes — no auth ────────────────────────────────────────────────
router.get("/:slug", getStorefront);
router.post("/:slug/order", placeStorefrontOrder);
router.get("/:slug/order/:orderId", getOrderStatus);

// ── Protected — admin only ─────────────────────────────────────────────────
router.patch("/settings", protect, updateStoreSettings);

export default router;