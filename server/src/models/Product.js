// src/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    unit: {
      type: String,
      default: "piece",
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

productSchema.index({ businessId: 1, isActive: 1, name: 1 });
// Ensure no duplicate product names per business
productSchema.index({ businessId: 1, name: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);