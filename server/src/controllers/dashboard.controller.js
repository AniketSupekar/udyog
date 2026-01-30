import mongoose from "mongoose";
import Order from "../models/Order.js";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

/* =======================
   SHARED DATE HELPERS
======================= */
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

/* =======================
   CACHE KEYS
======================= */
const getDashboardKeys = (nurseryId, extra = "") => ({
  summary: `dashboardSummary:${nurseryId}:${extra}`,
  tenantSummary: `dashboardSummaryForTenant:${nurseryId}:${extra}`,
  snapshot: `businessSnapshot:${nurseryId}:${extra}`,
  tenantSnapshot: `businessSnapshotForTenant:${nurseryId}:${extra}`
});

/* =======================
   CACHE INVALIDATION
======================= */
export const invalidateDashboardCache = async (nurseryId) => {
  const keys = getDashboardKeys(nurseryId);
  await Promise.all([
    redis.del(keys.summary),
    redis.del(keys.tenantSummary),
    redis.del(keys.snapshot),
    redis.del(keys.tenantSnapshot)
  ]);
};

/* =======================
   DASHBOARD SUMMARY
======================= */
export const getDashboardSummary = async (req, res) => {
  try {
    const nurseryId = new mongoose.Types.ObjectId(req.user.nurseryId);
    const { month, year } = req.query;
    const extra = month && year ? `${month}:${year}` : "all";
    const cacheKey = getDashboardKeys(nurseryId, extra).summary;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

    const result = await Order.aggregate([
      { $match: { nurseryId, isDeleted: false } },
      {
        $facet: {
          dueToday: [
            { $match: { deliveryDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "DELIVERED" } } },
            { $count: "count" }
          ],
          overdue: [
            { $match: { deliveryDate: { $lt: todayStart }, status: { $ne: "DELIVERED" } } },
            { $count: "count" }
          ],
          upcoming: [
            { $match: { deliveryDate: { $gt: todayEnd, $lte: upcomingEnd } } },
            { $count: "count" }
          ],
          pending: [
            { $match: { status: "PENDING" } },
            { $count: "count" }
          ]
        }
      }
    ]);

    const data = result[0];
    const response = {
      dueToday: data.dueToday[0]?.count || 0,
      overdue: data.overdue[0]?.count || 0,
      upcoming: data.upcoming[0]?.count || 0,
      pending: data.pending[0]?.count || 0
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   ORDER LIST HELPERS
======================= */
const baseFind = (query) =>
  Order.find(query).sort({ deliveryDate: 1, createdAt: -1 }).limit(15).lean();

export const getOverdueOrders = async (req, res) => {
  try {
    const { todayStart } = getDateRanges();
    const orders = await baseFind({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $lt: todayStart },
      status: { $ne: "DELIVERED" },
      isDeleted: false
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDueTodayOrders = async (req, res) => {
  try {
    const { todayStart, todayEnd } = getDateRanges();
    const orders = await baseFind({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "DELIVERED" },
      isDeleted: false
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUpcomingOrders = async (req, res) => {
  try {
    const { todayEnd, upcomingEnd } = getDateRanges();
    const orders = await baseFind({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
      isDeleted: false
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   BUSINESS SNAPSHOT
======================= */
export const getBusinessSnapshot = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const { startDate, endDate, month } = req.query;

    const extra = month || (startDate && endDate ? `${startDate}-${endDate}` : "currentMonth");
    const cacheKey = getDashboardKeys(nurseryId, extra).snapshot;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate); start.setHours(0, 0, 0, 0);
      end = new Date(endDate); end.setHours(23, 59, 59, 999);
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
      { $match: { nurseryId: new mongoose.Types.ObjectId(nurseryId), status: "DELIVERED", deliveryDate: { $gte: start, $lte: end } } },
      { $group: { _id: null, deliveredOrders: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } }
    ]);

    const response = result[0] || { deliveredOrders: 0, totalQuantity: 0 };
    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch business snapshot" });
  }
};

/* =======================
   FULL DASHBOARD
======================= */
export const getFullDashboard = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const { todayStart, todayEnd, upcomingEnd } = getDateRanges();
    const { month } = req.query;

    const [summary, overdue, dueToday, upcoming, snapshot] = await Promise.all([
      getDashboardSummaryForTenant(nurseryId, month),
      baseFind({ nurseryId, deliveryDate: { $lt: todayStart }, status: { $ne: "DELIVERED" }, isDeleted: false }),
      baseFind({ nurseryId, deliveryDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "DELIVERED" }, isDeleted: false }),
      baseFind({ nurseryId, deliveryDate: { $gt: todayEnd, $lte: upcomingEnd }, isDeleted: false }),
      getBusinessSnapshotForTenant(nurseryId, month)
    ]);

    res.json({ summary, overdue, dueToday, upcoming, snapshot });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* =======================
   TENANT HELPERS (WITH CACHE)
======================= */
export const getDashboardSummaryForTenant = async (nurseryId, month) => {
  const extra = month || "all";
  const cacheKey = getDashboardKeys(nurseryId, extra).tenantSummary;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

  const [dueToday, overdue, upcoming, pending] = await Promise.all([
    Order.countDocuments({ nurseryId, deliveryDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "DELIVERED" }, isDeleted: false }),
    Order.countDocuments({ nurseryId, deliveryDate: { $lt: todayStart }, status: { $ne: "DELIVERED" }, isDeleted: false }),
    Order.countDocuments({ nurseryId, deliveryDate: { $gt: todayEnd, $lte: upcomingEnd }, isDeleted: false }),
    Order.countDocuments({ nurseryId, status: "PENDING", isDeleted: false })
  ]);

  const response = { dueToday, overdue, upcoming, pending };
  await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
  return response;
};

export const getBusinessSnapshotForTenant = async (nurseryId, month, startDate, endDate) => {
  const extra = month || (startDate && endDate ? `${startDate}-${endDate}` : "currentMonth");
  const cacheKey = getDashboardKeys(nurseryId, extra).tenantSnapshot;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate); start.setHours(0, 0, 0, 0);
    end = new Date(endDate); end.setHours(23, 59, 59, 999);
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
    { $match: { nurseryId: new mongoose.Types.ObjectId(nurseryId), status: "DELIVERED", deliveryDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, deliveredOrders: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } }
  ]);

  const response = result[0] || { deliveredOrders: 0, totalQuantity: 0 };
  await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
  return response;
};