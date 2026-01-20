import mongoose from "mongoose";

const nurserySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String, // URL (S3 / Cloudinary later)
    },

    phone: {
      type: String,
    },

    address: {
      type: String,
    },

    subscriptionPlan: {
      type: String,
      enum: ["FREE", "BASIC", "PRO"],
      default: "FREE",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Nursery", nurserySchema);
