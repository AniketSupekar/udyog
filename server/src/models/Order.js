import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: ["CREATED", "SCHEDULED", "DISPATCHED", "DELIVERED"],
      default: "CREATED"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Order", orderSchema);