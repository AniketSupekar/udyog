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

const router = express.Router();

// Public routes
router.get("/:slug", getStorefront);
router.post("/:slug/order", placeStorefrontOrder);
router.get("/:slug/order/:orderId", getOrderStatus);
router.get("/:slug/orders", getOrdersByPhone); // phone lookup

// Protected routes
router.patch("/settings", protect, updateStoreSettings);

export default router;