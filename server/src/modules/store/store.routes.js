// src/modules/store/store.routes.js
import express from "express";
import {
  getStorefront,
  placeStorefrontOrder,
  getOrderStatus,
  getOrdersByPhone,
  updateStoreSettings,
} from "./store.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import {
  storefrontLimiter,
  storeOrderLimiter,
  storeTrackLimiter,
} from "../../middleware/rateLimiter.middleware.js";

const router = express.Router();

// Public routes — each has its own appropriate rate limit
router.get("/:slug",                storefrontLimiter,  getStorefront);
router.post("/:slug/order",         storeOrderLimiter,  placeStorefrontOrder);
router.get("/:slug/order/:orderId", storefrontLimiter,  getOrderStatus);
router.get("/:slug/orders",         storeTrackLimiter,  getOrdersByPhone);

// Protected — admin only
router.patch("/settings", protect, updateStoreSettings);

export default router;