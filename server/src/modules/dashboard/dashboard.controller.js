// src/modules/dashboard/dashboard.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import { getCache, setCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ─── Date range helpers ────────────────────────────────────────────────────────
const getDateRanges = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);
  upcomingEnd.setHours(23, 59, 59, 999);

  return { todayStart, todayEnd, upcomingEnd };
};

// ─── Shared list query ─────────────────────────────────────────────────────────
const findOrderList = (query) =>
  Order.find(query)
    .sort({ deliveryDate: 1, createdAt: -1 })
    .limit(15)
    .select("clientSnapshot financial payment status deliveryDate orderDate createdAt notes")
    .lean();

/* ─── GET /api/dashboard/full ──────────────────────────────────────────────── */
// Single endpoint — frontend calls this once on mount
export const getFullDashboard = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

  const [summary, snapshot, overdue, dueToday, upcoming] = await Promise.all([
    getDashboardSummaryForTenant(businessId),
    getBusinessSnapshotForTenant(businessId),
    findOrderList({
      businessId,
      deliveryDate: { $lt: todayStart },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
    findOrderList({
      businessId,
      deliveryDate: { $gte: todayStart, $lte: todayEnd },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
    findOrderList({
      businessId,
      deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
  ]);

  sendSuccess(res, { summary, snapshot, overdue, dueToday, upcoming });
});

/* ─── GET /api/dashboard/summary ───────────────────────────────────────────── */
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummaryForTenant(req.user.businessId);
  sendSuccess(res, summary);
});

/* ─── GET /api/dashboard/snapshot ──────────────────────────────────────────── */
export const getBusinessSnapshot = asyncHandler(async (req, res) => {
  const { startDate, endDate, month } = req.query;
  const { businessId } = req.user;

  // If custom range requested — skip cache, compute fresh
  if (startDate || endDate || month) {
    const snapshot = await computeSnapshot(businessId, startDate, endDate, month);
    return sendSuccess(res, snapshot);
  }

  // Current month — use cache
  const snapshot = await getBusinessSnapshotForTenant(businessId);
  sendSuccess(res, snapshot);
});

/* ─── TENANT-SCOPED HELPERS (also used by notification service) ────────────── */

export const getDashboardSummaryForTenant = async (businessId) => {
  const cacheKey = `dashboard:summary:${businessId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

  const [dueToday, overdue, upcoming, pending, totalOutstanding] = await Promise.all([
    Order.countDocuments({
      businessId,
      deliveryDate: { $gte: todayStart, $lte: todayEnd },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
    Order.countDocuments({
      businessId,
      deliveryDate: { $lt: todayStart },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
    Order.countDocuments({
      businessId,
      deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
    }),
    Order.countDocuments({
      businessId,
      status: "PENDING",
      isDeleted: false,
    }),
    // Outstanding amount — sum of all remaining payments
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
          total: { $sum: "$payment.remainingAmount" },
        },
      },
    ]),
  ]);

  const data = {
    dueToday,
    overdue,
    upcoming,
    pending,
    totalOutstanding: totalOutstanding[0]?.total || 0,
  };

  await setCache(cacheKey, data, 30);
  return data;
};

export const getBusinessSnapshotForTenant = async (businessId) => {
  const cacheKey = `dashboard:snapshot:${businessId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const snapshot = await computeSnapshot(businessId);
  await setCache(cacheKey, snapshot, 60);
  return snapshot;
};

// ─── Internal: compute snapshot for any date range ────────────────────────────
const computeSnapshot = async (businessId, startDate, endDate, month) => {
  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (month) {
    const [year, m] = month.split("-").map(Number);
    start = new Date(year, m - 1, 1);
    end = new Date(year, m, 0, 23, 59, 59, 999);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const result = await Order.aggregate([
    {
      $match: {
        businessId: new mongoose.Types.ObjectId(businessId),
        status: "DELIVERED",
        deliveryDate: { $gte: start, $lte: end },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        deliveredOrders: { $sum: 1 },
        totalRevenue: { $sum: "$financial.total" },
        totalCollected: { $sum: "$payment.totalPaid" },
      },
    },
  ]);

  return result[0] || { deliveredOrders: 0, totalRevenue: 0, totalCollected: 0 };
};