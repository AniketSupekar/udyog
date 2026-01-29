import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

/**
 * Create notifications for orders scheduled tomorrow
 * Optimizations:
 * 1. Use projection in Order.find to reduce payload
 * 2. Use lean() to avoid mongoose document overhead
 * 3. Bulk map only necessary fields
 * 4. Use bulkWrite to combine insert + update for speed
 */
export const createTomorrowDeliveryNotifications = async (nurseryId) => {
  if (!nurseryId) {
    console.warn("⚠️ Skipping notifications: nurseryId missing");
    return { created: 0 };
  }

  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const orders = await Order.find(
    {
      nurseryId,
      deliveryDate: { $gte: start, $lte: end },
      status: { $ne: "DELIVERED" },
      isDeleted: false,
      notificationSent: false
    },
    { customer: 1 } // only need customer name
  ).lean();

  if (!orders.length) return { created: 0 };

  const bulkOps = [];

  for (const order of orders) {
    bulkOps.push(
      {
        insertOne: {
          document: {
            nurseryId,
            title: "Delivery Scheduled Tomorrow",
            message: `Order for ${order.customer.name} is scheduled for delivery tomorrow.`,
            orderId: order._id
          }
        }
      },
      {
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { notificationSent: true } }
        }
      }
    );
  }

  await Notification.bulkWrite(bulkOps);

  return { created: orders.length };
};