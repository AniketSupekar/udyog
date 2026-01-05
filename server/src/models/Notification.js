import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
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

export default mongoose.model("Notification", notificationSchema);