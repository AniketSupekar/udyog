// src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null, // optional — not all notifications are order-related
    },
    type: {
      type: String,
      enum: [
        "DELIVERY_REMINDER",  // cron — order due tomorrow
        "OVERDUE_ORDER",      // cron — order past due date
        "STOREFRONT_ORDER",   // realtime — customer placed storefront order
        "PAYMENT_RECEIVED",   // realtime — payment recorded on an order
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: null }, // frontend route to navigate to on click
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, collection: "notifications" }
);

notificationSchema.index({ businessId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);