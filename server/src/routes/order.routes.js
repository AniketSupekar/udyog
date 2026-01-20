import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  softDeleteOrder,
  updateOrderDetails,
  updateOrderStatus
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getAllOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/delete", protect, softDeleteOrder);
router.patch("/:id", protect, updateOrderDetails);

export default router;