// src/modules/analytics/analytics.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import { getCache, setCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

/* ─── GET /api/analytics/overview ───────────────────────────────────── */
// Revenue trend (last 6 months) + top clients + payment breakdown
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cacheKey = `analytics:overview:${businessId}`;

  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  // Build last 6 months date range
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [revenueTrend, topClients, paymentBreakdown, collectionSummary] =
    await Promise.all([

      // 1. Monthly revenue trend (last 6 months)
      Order.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "DELIVERED",
            deliveryDate: { $gte: sixMonthsAgo },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$deliveryDate" },
              month: { $month: "$deliveryDate" },
            },
            revenue: { $sum: "$financial.total" },
            collected: { $sum: "$payment.totalPaid" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 2. Top 5 clients by revenue (all time)
      Order.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "DELIVERED",
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$clientSnapshot.name",
            phone: { $first: "$clientSnapshot.phone" },
            revenue: { $sum: "$financial.total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      // 3. Payment method breakdown (current month)
      Order.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            isDeleted: false,
          },
        },
        { $unwind: "$payment.transactions" },
        {
          $group: {
            _id: "$payment.transactions.method",
            total: { $sum: "$payment.transactions.amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 4. Collection summary (current month)
      Order.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "DELIVERED",
            deliveryDate: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1),
              $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
            },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$financial.total" },
            totalCollected: { $sum: "$payment.totalPaid" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Format revenue trend with month labels
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedTrend = revenueTrend.map((m) => ({
    month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    shortMonth: MONTHS[m._id.month - 1],
    revenue: Math.round(m.revenue),
    collected: Math.round(m.collected),
    orders: m.orders,
  }));

  const summary = collectionSummary[0] || { totalRevenue: 0, totalCollected: 0, totalOrders: 0 };
  const collectionRate = summary.totalRevenue > 0
    ? Math.round((summary.totalCollected / summary.totalRevenue) * 100)
    : 0;

  const data = {
    revenueTrend: formattedTrend,
    topClients: topClients.map((c) => ({
      name: c._id,
      phone: c.phone,
      revenue: Math.round(c.revenue),
      orders: c.orders,
    })),
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p._id,
      total: Math.round(p.total),
      count: p.count,
    })),
    thisMonth: {
      revenue: Math.round(summary.totalRevenue),
      collected: Math.round(summary.totalCollected),
      outstanding: Math.round(summary.totalRevenue - summary.totalCollected),
      orders: summary.totalOrders,
      collectionRate,
    },
  };

  await setCache(cacheKey, data, 300); // 5 min cache
  sendSuccess(res, data);
});