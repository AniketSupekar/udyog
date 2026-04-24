// src/modules/orders/order.routes.js
import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
  recordPayment,
  softDeleteOrder,
} from "./order.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getAllOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, updateOrderStatus);
router.post("/:id/payments", protect, recordPayment);     // NEW — record a payment
router.patch("/:id", protect, updateOrderDetails);
router.delete("/:id", protect, softDeleteOrder);

export default router;