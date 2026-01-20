// server/src/controllers/dashboard.controller.js
import mongoose from "mongoose";
import Order from "../models/Order.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingEnd = new Date();
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    upcomingEnd.setHours(23, 59, 59, 999);

    const [dueToday, overdue, upcoming, pending] = await Promise.all([
      Order.countDocuments({
        nurseryId,
        deliveryDate: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: "DELIVERED" },
        isDeleted: false
      }),

      Order.countDocuments({
        nurseryId,
        deliveryDate: { $lt: todayStart },
        status: { $ne: "DELIVERED" },
        isDeleted: false
      }),

      Order.countDocuments({
        nurseryId,
        deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
        isDeleted: false
      }),

      Order.countDocuments({
        nurseryId,
        status: "PENDING",
        isDeleted: false
      })
    ]);

    res.status(200).json({
      dueToday,
      overdue,
      upcoming,
      pending
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOverdueOrders = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $lt: todayStart },
      status: { $ne: "DELIVERED" },
      isDeleted: false
    })
      .sort({ deliveryDate: 1, createdAt: -1 })
      .limit(15);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDueTodayOrders = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "DELIVERED" },
      isDeleted: false
    })
      .sort({ deliveryDate: 1, createdAt: -1 })
      .limit(15);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingOrders = async (req, res) => {
  try {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingEnd = new Date();
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    upcomingEnd.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      nurseryId: req.user.nurseryId,
      deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
      isDeleted: false
    })
      .sort({ deliveryDate: 1, createdAt: -1 })
      .limit(15);

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBusinessSnapshot = async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    let start, end;

    // 1️⃣ Explicit date range (highest priority)
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    // 2️⃣ Month-based query (YYYY-MM)
    else if (month) {
      const [year, monthIndex] = month.split("-").map(Number);

      if (!year || !monthIndex) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      start = new Date(year, monthIndex - 1, 1, 0, 0, 0, 0);
      end = new Date(year, monthIndex, 0, 23, 59, 59, 999);
    }

    // 3️⃣ Default → current month
    else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
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
  } catch (error) {
    console.error("Business Snapshot Error:", error);
    res.status(500).json({ message: "Failed to fetch business snapshot" });
  }
};



