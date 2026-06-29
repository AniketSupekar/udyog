import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderDetails,
  recordPayment,
  softDeleteOrder,
  convertQuoteToOrder,
} from "./order.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/",              getAllOrders);
router.post("/",             createOrder);
router.get("/:id",           getOrderById);
router.patch("/:id",         updateOrderDetails);
router.patch("/:id/status",  updateOrderStatus);
router.patch("/:id/convert", convertQuoteToOrder);
router.post("/:id/payments", recordPayment);
router.patch("/:id/delete",  softDeleteOrder);

export default router;