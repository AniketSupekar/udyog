// src/models/Business.js
import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    logo: {
      type: String, // Cloudinary URL
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
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
    upiId: {
      type: String,
      trim: true,
      default: null,
    },
    gstNumber: {
      type: String,
      trim: true,
      default: null,
    },
    defaultTaxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    invoicePrefix: {
      type: String,
      default: "ORD",
      trim: true,
      uppercase: true,
      maxlength: 6,
    },

    // Onboarding progress tracking
    onboarding: {
      profileCompleted: { type: Boolean, default: false },
      upiAdded: { type: Boolean, default: false },
      firstProductAdded: { type: Boolean, default: false },
      firstOrderCreated: { type: Boolean, default: false },
    },

    subscriptionPlan: {
      type: String,
      enum: ["FREE", "STARTER", "PRO", "ENTERPRISE"],
      default: "FREE",
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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