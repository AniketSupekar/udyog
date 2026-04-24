// src/models/Business.js
// Renamed from Nursery.js — industry-agnostic
// Represents one tenant in the system

import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [100, "Business name too long"],
    },

    logo: {
      type: String, // Cloudinary URL
      default: null,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    // UPI ID for payment links
    upiId: {
      type: String,
      trim: true,
      default: null,
    },

    // GST number for invoices
    gstNumber: {
      type: String,
      trim: true,
      default: null,
    },

    // Default tax rate applied to new orders
    defaultTaxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Invoice prefix e.g. "ORD", "INV", "BILL"
    invoicePrefix: {
      type: String,
      default: "ORD",
      trim: true,
      uppercase: true,
      maxlength: 6,
    },

    // Subscription
    subscriptionPlan: {
      type: String,
      enum: ["FREE", "STARTER", "PRO", "ENTERPRISE"],
      default: "FREE",
    },

    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "businesses",
  }
);

businessSchema.index({ isActive: 1 });

export default mongoose.model("Business", businessSchema);