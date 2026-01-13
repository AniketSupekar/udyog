// server/src/controllers/dashboard.controller.js
import Order from "../models/Order.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingEnd = new Date();
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);
    upcomingEnd.setHours(23, 59, 59, 999);

    const [dueToday, overdue, upcoming, pending] = await Promise.all([
      Order.countDocuments({
        deliveryDate: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: "DELIVERED" },
        isDeleted: false
      }),

      Order.countDocuments({
        deliveryDate: { $lt: todayStart },
        status: { $ne: "DELIVERED" },
        isDeleted: false
      }),

      Order.countDocuments({
        deliveryDate: { $gt: todayEnd, $lte: upcomingEnd },
        isDeleted: false
      }),

      Order.countDocuments({
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
