import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title too long"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    category: {
      type: String,
      enum: ["RENT", "SALARIES", "UTILITIES", "TRANSPORT", "SUPPLIES", "MARKETING", "EQUIPMENT", "OTHER"],
      default: "OTHER",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes too long"],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "expenses",
  }
);

expenseSchema.index({ businessId: 1, date: -1 });
expenseSchema.index({ businessId: 1, category: 1 });

export default mongoose.model("Expense", expenseSchema);