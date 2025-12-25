import express from "express";
import { updateOrderStatus } from "../controllers/order.controller.js";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  softDeleteOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/delete", softDeleteOrder);


export default router;
