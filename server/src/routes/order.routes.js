import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  softDeleteOrder,
  updateOrderDetails,
  updateOrderStatus
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/delete", softDeleteOrder);
router.patch("/:id", updateOrderDetails);

export default router;