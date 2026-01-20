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
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },

    orderDate: {
      type: Date,
      required: true
    },

    deliveryDate: {
      type: Date,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    rate: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true
    },

    advancePaid: {
      type: Number,
      default: 0,
      min: 0
    },

    remainingAmount: {
      type: Number,
      required: true
    },

    notificationSent: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["CREATED", "PENDING", "DELIVERED"],
      default: "CREATED"
    },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ nurseryId: 1, deliveryDate: 1, notificationSent: 1 });

export default mongoose.model("Order", orderSchema);