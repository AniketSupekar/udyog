import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    nurseryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Nursery",
    required: true,
    index: true,
  },
    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

notificationSchema.index({ nurseryId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);