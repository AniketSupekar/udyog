import mongoose from "mongoose";
import Order from "../../models/Order.js";
import Expense from "../../models/Expense.js";
import {
  getCache, setCache,
  CACHE_KEYS, CACHE_TTL,
} from "../../utils/cacheManager.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cacheKey = CACHE_KEYS.analyticsOverview(businessId);

  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const addEffectiveDate = {
    $addFields: {
      effectiveDate: { $ifNull: ["$deliveryDate", "$createdAt"] },
    },
  };

  const [
    revenueTrend,
    topClients,
    paymentBreakdown,
    collectionSummary,
    cogsSummary,
    expensesByCategory,
    totalExpenses,
  ] = await Promise.all([

    // Revenue trend — 6 months
    Order.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "DELIVERED", isDeleted: false } },
      addEffectiveDate,
      { $match: { effectiveDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$effectiveDate" }, month: { $month: "$effectiveDate" } },
          revenue: { $sum: "$financial.total" },
          collected: { $sum: "$payment.totalPaid" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Top 5 clients
    Order.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "DELIVERED", isDeleted: false } },
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
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), isDeleted: false } },
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

    // This month revenue + collection
    Order.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "DELIVERED", isDeleted: false } },
      addEffectiveDate,
      { $match: { effectiveDate: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$financial.total" },
          totalCollected: { $sum: "$payment.totalPaid" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),

    // COGS — read directly from order items costPrice (accurate per-order cost)
    Order.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "DELIVERED", isDeleted: false } },
      addEffectiveDate,
      { $match: { effectiveDate: { $gte: monthStart, $lte: monthEnd } } },
      { $unwind: "$items" },
      { $match: { "items.costPrice": { $ne: null, $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalCOGS: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } },
          itemsWithCost: { $sum: 1 },
        },
      },
    ]),

    // Expenses by category this month
    Expense.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), date: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]),

    // Total expenses this month
    Expense.aggregate([
      { $match: { businessId: new mongoose.Types.ObjectId(businessId), date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  // Check if any items this month are missing costPrice — for partial data warning
  const itemsWithoutCost = await Order.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId), status: "DELIVERED", isDeleted: false } },
    addEffectiveDate,
    { $match: { effectiveDate: { $gte: monthStart, $lte: monthEnd } } },
    { $unwind: "$items" },
    { $match: { $or: [{ "items.costPrice": null }, { "items.costPrice": { $exists: false } }] } },
    { $count: "count" },
  ]);

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
  const cogs = Math.round(cogsSummary[0]?.totalCOGS || 0);
  const expenses = Math.round(totalExpenses[0]?.total || 0);
  const profit = revenue - cogs - expenses;
  const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const collectionRate = revenue > 0 ? Math.round((summary.totalCollected / revenue) * 100) : 0;
  const hasCostData = (cogsSummary[0]?.itemsWithCost || 0) > 0;
  const partialCostData = hasCostData && (itemsWithoutCost[0]?.count || 0) > 0;

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
      cogs,
      expenses,
      profit,
      profitMargin,
      hasCostData,
      hasExpenses: expenses > 0,
      partialCostData,
    },
    expensesByCategory: expensesByCategory.map(e => ({
      category: e._id,
      total: Math.round(e.total),
      count: e.count,
    })),
  };

  await setCache(cacheKey, data, CACHE_TTL.analyticsOverview);
  sendSuccess(res, data);
});