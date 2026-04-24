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
      required: true,
    },

    type: {
      type: String,
      enum: ["DELIVERY_REMINDER", "PAYMENT_REMINDER", "ORDER_CREATED", "ORDER_DELIVERED"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

notificationSchema.index({ businessId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);