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
    unit: { type: String, default: "piece", trim: true },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    costPrice: {
      type: Number,
      default: null, // purchase/cost price — optional
      min: [0, "Cost price cannot be negative"],
    },
    description: { type: String, trim: true, default: null },
    category: { type: String, trim: true, default: null },
    isPublic: { type: Boolean, default: false },
    images: {
      type: [String],
      default: [],
      validate: { validator: (v) => v.length <= 3, message: "Maximum 3 images per product" },
    },
    isAvailable: { type: Boolean, default: true },
    trackStock: { type: Boolean, default: false },
    stock: { type: Number, default: null, min: [0, "Stock cannot be negative"] },
    minOrderQty: { type: Number, default: 1, min: [1, "Minimum order quantity must be at least 1"] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "products" }
);

productSchema.index({ businessId: 1, isActive: 1, name: 1 });
productSchema.index({ businessId: 1, name: 1 }, { unique: true });
productSchema.index({ businessId: 1, isPublic: 1, isAvailable: 1 });

export default mongoose.model("Product", productSchema);