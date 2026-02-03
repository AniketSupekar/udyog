import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    nurseryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nursery",
      required: true,
      index: true,
    },

    customer: {
      name: {
        type: String,
        required: true,
        index: true, // 🔥 critical for search speed
      },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    orderDate: {
      type: Date,
      required: true,
      index: true,
    },

    deliveryDate: {
      type: Date,
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      required: true,
    },

    notificationSent: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["CREATED", "PENDING", "DELIVERED"],
      default: "CREATED",
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Main order listing (dashboard / orders page)
orderSchema.index({
  nurseryId: 1,
  isDeleted: 1,
  status: 1,
  deliveryDate: 1,
});

// Fast customer search
orderSchema.index({
  nurseryId: 1,
  "customer.name": 1,
});

// Notifications / cron jobs
orderSchema.index({
  nurseryId: 1,
  deliveryDate: 1,
  notificationSent: 1,
});

// Optimized for dashboard order lists (filter + sort)
orderSchema.index({
  nurseryId: 1,
  isDeleted: 1,
  deliveryDate: 1,
  createdAt: -1,
});

export default mongoose.model("Order", orderSchema);