import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

export const createTomorrowDeliveryNotifications = async (nurseryId) => {

  // 1️⃣ Calculate tomorrow date range
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);


  // 2️⃣ Find eligible orders
const orders = await Order.find({
  nurseryId, // 👈 TENANCY ENFORCED HERE
  deliveryDate: { $gte: start, $lte: end },
  status: { $ne: "DELIVERED" },
  isDeleted: { $ne: true },
  notificationSent: { $ne: true }
})

  if (!orders.length) {
    return { created: 0 };
  }

  // 3️⃣ Prepare notifications
  const notifications = orders.map(order => ({
    nurseryId: order.nurseryId,
    title: "Delivery Scheduled Tomorrow",
    message: `Order for ${order.customer.name} is scheduled for delivery tomorrow.`,
    orderId: order._id
  }));

  // 4️⃣ Insert notifications
  await Notification.insertMany(notifications);

  // 5️⃣ Mark orders as notified
  await Order.updateMany(
    { _id: { $in: orders.map(o => o._id) } },
    { $set: { notificationSent: true } }
  );

  return { created: notifications.length };
};
