import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

export const createTomorrowDeliveryNotifications = async (nurseryId) => {
  if (!nurseryId) {
    console.warn("⚠️ Skipping notifications: nurseryId missing");
    return { created: 0 };
  }

  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    23, 59, 59, 999
  );

  const orders = await Order.find({
    nurseryId,
    deliveryDate: { $gte: start, $lte: end },
    status: { $ne: "DELIVERED" },
    isDeleted: { $ne: true },
    notificationSent: { $ne: true }
  });

  if (!orders.length) {
    return { created: 0 };
  }

  const notifications = orders.map(order => ({
    nurseryId,
    title: "Delivery Scheduled Tomorrow",
    message: `Order for ${order.customer.name} is scheduled for delivery tomorrow.`,
    orderId: order._id
  }));

  await Notification.insertMany(notifications);

  await Order.updateMany(
    { _id: { $in: orders.map(o => o._id) } },
    { $set: { notificationSent: true } }
  );

  return { created: notifications.length };
};