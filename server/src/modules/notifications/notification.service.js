// src/modules/notifications/notification.service.js
import Order from "../../models/Order.js";
import Notification from "../../models/Notification.js";

/**
 * Creates delivery reminder notifications for orders due tomorrow
 * Called by cron job endpoint in app.js
 * Uses bulkWrite — single DB round trip for all inserts + updates
 */
export const createTomorrowDeliveryNotifications = async (businessId) => {
  if (!businessId) {
    console.warn("⚠️ Skipping notifications: businessId missing");
    return { created: 0 };
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const orders = await Order.find(
    {
      businessId,
      deliveryDate: { $gte: start, $lte: end },
      status: { $nin: ["DELIVERED", "CANCELLED"] },
      isDeleted: false,
      "reminders.deliveryReminderSent": false,
    },
    { clientSnapshot: 1 } // projection — only what we need
  ).lean();

  if (!orders.length) return { created: 0 };

  const bulkOps = [];

  for (const order of orders) {
    bulkOps.push(
      {
        insertOne: {
          document: {
            businessId,
            orderId: order._id,
            type: "DELIVERY_REMINDER",
            title: "Delivery Scheduled Tomorrow",
            message: `Order for ${order.clientSnapshot.name} is due for delivery tomorrow.`,
            isRead: false,
          },
        },
      },
      {
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { "reminders.deliveryReminderSent": true } },
        },
      }
    );
  }

  await Notification.bulkWrite(bulkOps);
  return { created: orders.length };
};