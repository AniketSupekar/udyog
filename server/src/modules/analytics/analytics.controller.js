// src/modules/analytics/analytics.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { getCache, setCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

/* ─── GET /api/analytics/overview ───────────────────────────────────── */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cacheKey = `analytics:overview:${businessId}`;

  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [revenueTrend, topClients, paymentBreakdown, collectionSummary, products] =
    await Promise.all([
      // Monthly revenue trend — delivered orders
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
            _id: { year: { $year: "$deliveryDate" }, month: { $month: "$deliveryDate" } },
            revenue: { $sum: "$financial.total" },
            collected: { $sum: "$payment.totalPaid" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Top 5 clients by revenue
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

      // Payment method breakdown
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

      // This month delivered summary
      Order.aggregate([
        {
          $match: {
            businessId: new mongoose.Types.ObjectId(businessId),
            status: "DELIVERED",
            deliveryDate: { $gte: monthStart, $lte: monthEnd },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$financial.total" },
            totalCollected: { $sum: "$payment.totalPaid" },
            totalOrders: { $sum: 1 },
            // unwind items to calculate cost
            items: { $push: "$items" },
          },
        },
      ]),

      // All active products with costPrice set
      Product.find({
        businessId,
        isActive: true,
        costPrice: { $ne: null, $gt: 0 },
      }).select("name basePrice costPrice").lean(),
    ]);

  // Build product cost map: productName -> costPrice/basePrice ratio
  // We'll use this to estimate cost from order line items
  const productCostMap = {};
  products.forEach(p => {
    productCostMap[p.name.toLowerCase()] = {
      basePrice: p.basePrice,
      costPrice: p.costPrice,
    };
  });

  // Calculate profit for this month's delivered orders
  // by looking up cost price for each line item
  const thisMonthOrders = await Order.find({
    businessId,
    status: "DELIVERED",
    deliveryDate: { $gte: monthStart, $lte: monthEnd },
    isDeleted: false,
  }).select("items financial").lean();

  let totalCost = 0;
  let itemsWithCost = 0;
  let itemsWithoutCost = 0;

  thisMonthOrders.forEach(order => {
    order.items.forEach(item => {
      const key = item.productName?.toLowerCase();
      const product = productCostMap[key];
      if (product && product.costPrice) {
        totalCost += product.costPrice * item.quantity;
        itemsWithCost++;
      } else {
        itemsWithoutCost++;
      }
    });
  });

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const formattedTrend = revenueTrend.map((m) => ({
    month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    shortMonth: MONTHS[m._id.month - 1],
    revenue: Math.round(m.revenue),
    collected: Math.round(m.collected),
    orders: m.orders,
  }));

  const summary = collectionSummary[0] || { totalRevenue: 0, totalCollected: 0, totalOrders: 0 };
  const revenue = Math.round(summary.totalRevenue);
  const cost = Math.round(totalCost);
  const profit = revenue - cost;
  const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const collectionRate = revenue > 0
    ? Math.round((summary.totalCollected / revenue) * 100)
    : 0;
  const hasCostData = products.length > 0;

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
      revenue,
      collected: Math.round(summary.totalCollected),
      outstanding: Math.round(revenue - summary.totalCollected),
      orders: summary.totalOrders,
      collectionRate,
      cost,
      profit,
      profitMargin,
      hasCostData,
      partialCostData: itemsWithoutCost > 0 && itemsWithCost > 0,
    },
  };

  await setCache(cacheKey, data, 300);
  sendSuccess(res, data);
});