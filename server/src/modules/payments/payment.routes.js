// src/modules/payments/payment.routes.js
import express from "express";
import { getOutstanding, quickMarkPaid } from "./payment.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/outstanding", protect, getOutstanding);
router.post("/:orderId/quick-pay", protect, quickMarkPaid);

export default router;