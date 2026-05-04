// src/models/Client.js
import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },

    // Business type for B2B
    type: {
      type: String,
      enum: ["INDIVIDUAL", "RETAIL", "WHOLESALE", "CORPORATE", "OTHER"],
      default: "INDIVIDUAL",
    },

    // Stats — updated on every order
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      lastOrderDate: { type: Date, default: null },
    },

    notes: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "clients",
  }
);

// Compound index for search
clientSchema.index({ businessId: 1, name: 1 });
clientSchema.index({ businessId: 1, phone: 1 });
clientSchema.index({ businessId: 1, isActive: 1, createdAt: -1 });

export default mongoose.model("Client", clientSchema);