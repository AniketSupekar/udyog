// src/modules/payments/payment.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendPaginated } from "../../utils/ApiResponse.js";
import { getCache, setCache, delCache } from "../../config/redis.js";
import { daysOverdue } from "../../utils/calculations.js";

/* ─── GET /api/payments/outstanding ──────────────────────────────────── */
// All orders with unpaid/partial payment — sorted by urgency
export const getOutstanding = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { filter = "all", page = 1, limit = 20 } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Base query — all unpaid orders
  const baseQuery = {
    businessId,
    "payment.status": { $in: ["UNPAID", "PARTIAL"] },
    status: { $nin: ["CANCELLED"] },
    isDeleted: false,
  };

  // Apply filter
  if (filter === "overdue") {
    baseQuery.deliveryDate = { $lt: today };
  } else if (filter === "due-today") {
    baseQuery.deliveryDate = { $gte: today, $lte: todayEnd };
  } else if (filter === "upcoming") {
    baseQuery.deliveryDate = { $gt: todayEnd };
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total, summary] = await Promise.all([
    Order.find(baseQuery)
      .sort({ deliveryDate: 1, "payment.remainingAmount": -1 })
      .skip(skip)
      .limit(limitNum)
      .select("clientSnapshot financial payment status deliveryDate orderDate items createdAt")
      .lean(),
    Order.countDocuments(baseQuery),
    // Summary: total outstanding amount across ALL unpaid (not just current page)
    Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          "payment.status": { $in: ["UNPAID", "PARTIAL"] },
          status: { $nin: ["CANCELLED"] },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: "$payment.remainingAmount" },
          overdueCount: {
            $sum: {
              $cond: [{ $lt: ["$deliveryDate", today] }, 1, 0],
            },
          },
          dueTodayCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$deliveryDate", today] },
                    { $lte: ["$deliveryDate", todayEnd] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  // Enrich orders with daysOverdue
  const enriched = orders.map((order) => ({
    ...order,
    daysOverdue: daysOverdue(order.deliveryDate),
    isOverdue: daysOverdue(order.deliveryDate) > 0,
  }));

  const stats = summary[0] || { totalOutstanding: 0, overdueCount: 0, dueTodayCount: 0 };

  sendPaginated(
    res,
    enriched,
    { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    "Outstanding orders fetched"
  );
});

/* ─── POST /api/payments/outstanding — used by Dashboard summary ─────── */
// Quick mark as paid (full remaining amount in one tap)
export const quickMarkPaid = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { businessId } = req.user;

  const order = await Order.findOne({
    _id: orderId,
    businessId,
    isDeleted: false,
  });

  if (!order) throw ApiError.notFound("Order not found");
  if (order.payment.status === "PAID") {
    throw ApiError.badRequest("Order is already paid", "ALREADY_PAID");
  }

  const remaining = order.payment.remainingAmount;

  order.payment.transactions.push({
    amount: remaining,
    method: req.body.method || "CASH",
    note: "Marked as paid",
    recordedAt: new Date(),
  });

  order.payment.totalPaid = order.financial.total;
  order.payment.remainingAmount = 0;
  order.payment.status = "PAID";

  await order.save();

  await delCache(`dashboard:*:${businessId}`);

  sendSuccess(res, order, "Order marked as paid");
});