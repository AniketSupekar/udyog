// server/src/controllers/dashboard.controller.js
import mongoose from "mongoose";
import Order from "../models/Order.js";

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
   DASHBOARD SUMMARY
======================= */
export const getDashboardSummary = async (req, res) => {
  try {
    const nurseryId = new mongoose.Types.ObjectId(req.user.nurseryId);
    const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

    const result = await Order.aggregate([
      {
        $match: {
          nurseryId,
          isDeleted: false
        }
      },
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

    res.json({
      dueToday: data.dueToday[0]?.count || 0,
      overdue: data.overdue[0]?.count || 0,
      upcoming: data.upcoming[0]?.count || 0,
      pending: data.pending[0]?.count || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =======================
   ORDER LIST HELPERS
======================= */
const baseFind = (query) =>
  Order.find(query)
    .sort({ deliveryDate: 1, createdAt: -1 })
    .limit(15)
    .lean();

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
    const { startDate, endDate, month } = req.query;
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
          nurseryId: new mongoose.Types.ObjectId(req.user.nurseryId),
          status: "DELIVERED",
          deliveryDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          deliveredOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    res.json(result[0] || { deliveredOrders: 0, totalQuantity: 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch business snapshot" });
  }
};

/* =======================
   FULL DASHBOARD (FAST)
======================= */
export const getFullDashboard = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

    const [
      summary,
      overdue,
      dueToday,
      upcoming,
      snapshot
    ] = await Promise.all([
      getDashboardSummaryForTenant(nurseryId),
      baseFind({ nurseryId, deliveryDate: { $lt: todayStart }, status: { $ne: "DELIVERED" }, isDeleted: false }),
      baseFind({ nurseryId, deliveryDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "DELIVERED" }, isDeleted: false }),
      baseFind({ nurseryId, deliveryDate: { $gt: todayEnd, $lte: upcomingEnd }, isDeleted: false }),
      getBusinessSnapshotForTenant(nurseryId)
    ]);

    res.json({ summary, overdue, dueToday, upcoming, snapshot });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/* =======================
   TENANT HELPERS
======================= */
export const getDashboardSummaryForTenant = async (nurseryId) => {
  const { todayStart, todayEnd, upcomingEnd } = getDateRanges();

  const [dueToday, overdue, upcoming, pending] = await Promise.all([
    Order.countDocuments({ nurseryId, deliveryDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "DELIVERED" }, isDeleted: false }),
    Order.countDocuments({ nurseryId, deliveryDate: { $lt: todayStart }, status: { $ne: "DELIVERED" }, isDeleted: false }),
    Order.countDocuments({ nurseryId, deliveryDate: { $gt: todayEnd, $lte: upcomingEnd }, isDeleted: false }),
    Order.countDocuments({ nurseryId, status: "PENDING", isDeleted: false })
  ]);

  return { dueToday, overdue, upcoming, pending };
};

export const getBusinessSnapshotForTenant = async (nurseryId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await Order.aggregate([
    { $match: { nurseryId: new mongoose.Types.ObjectId(nurseryId), status: "DELIVERED", deliveryDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, deliveredOrders: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } }
  ]);

  return result[0] || { deliveredOrders: 0, totalQuantity: 0 };
};