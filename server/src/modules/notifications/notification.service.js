// src/modules/notifications/notification.service.js
import Order from "../../models/Order.js";
import Notification from "../../models/Notification.js";
import { delCache } from "../../config/redis.js";

const invalidateCache = (businessId) => delCache(`notifications:${businessId}`);

/* ─── Reusable internal helper ───────────────────────────────────────────── */
const createNotification = async ({ businessId, orderId = null, type, title, message, link = null }) => {
  try {
    await Notification.create({ businessId, orderId, type, title, message, link });
    await invalidateCache(businessId);
  } catch (err) {
    // Notifications are non-critical — never let them crash the main flow
    console.error(`⚠️ Failed to create notification [${type}]:`, err.message);
  }
};

/* ─── STOREFRONT_ORDER — called when customer places a storefront order ─── */
export const notifyStorefrontOrder = async ({ businessId, orderId, customerName, total }) => {
  await createNotification({
    businessId,
    orderId,
    type: "STOREFRONT_ORDER",
    title: "New Store Order",
    message: `${customerName} placed an order for ₹${total.toLocaleString("en-IN")} on your storefront.`,
    link: `/orders/${orderId}`,
  });
};

/* ─── PAYMENT_RECEIVED — called when admin records a payment ─────────────── */
export const notifyPaymentReceived = async ({ businessId, orderId, customerName, amount, isPaid }) => {
  await createNotification({
    businessId,
    orderId,
    type: "PAYMENT_RECEIVED",
    title: isPaid ? "Payment Complete" : "Payment Received",
    message: isPaid
      ? `${customerName}'s order is now fully paid.`
      : `₹${amount.toLocaleString("en-IN")} received from ${customerName}.`,
    link: `/orders/${orderId}`,
  });
};

/* ─── DELIVERY_REMINDER — cron: orders due tomorrow ─────────────────────── */
export const createTomorrowDeliveryNotifications = async (businessId) => {
  if (!businessId) return { created: 0 };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const orders = await Order.find({
    businessId,
    deliveryDate: { $gte: start, $lte: end },
    status: { $nin: ["DELIVERED", "CANCELLED"] },
    isDeleted: false,
    "reminders.deliveryReminderSent": false,
  }, { clientSnapshot: 1 }).lean();

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
            title: "Delivery Due Tomorrow",
            message: `Order for ${order.clientSnapshot.name} is scheduled for delivery tomorrow.`,
            link: `/orders/${order._id}`,
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
  await invalidateCache(businessId);
  return { created: orders.length };
};

/* ─── OVERDUE_ORDER — cron: orders past delivery date, not delivered ─────── */
export const createOverdueOrderNotifications = async (businessId) => {
  if (!businessId) return { created: 0 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find overdue orders that haven't been notified yet
  const orders = await Order.find({
    businessId,
    deliveryDate: { $lt: todayStart },
    status: { $nin: ["DELIVERED", "CANCELLED"] },
    isDeleted: false,
    "reminders.paymentReminderSent": false, // reusing this flag for overdue
  }, { clientSnapshot: 1, deliveryDate: 1 }).lean();

  if (!orders.length) return { created: 0 };

  const bulkOps = [];
  for (const order of orders) {
    const daysOverdue = Math.floor((todayStart - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 24));
    bulkOps.push(
      {
        insertOne: {
          document: {
            businessId,
            orderId: order._id,
            type: "OVERDUE_ORDER",
            title: "Order Overdue",
            message: `${order.clientSnapshot.name}'s order is ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} past delivery date.`,
            link: `/orders/${order._id}`,
            isRead: false,
          },
        },
      },
      {
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { "reminders.paymentReminderSent": true } },
        },
      }
    );
  }

  await Notification.bulkWrite(bulkOps);
  await invalidateCache(businessId);
  return { created: orders.length };
};