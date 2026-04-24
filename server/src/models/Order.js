// src/models/Order.js
import mongoose from "mongoose";

// ─── Line Item Sub-Schema ──────────────────────────────────────────────────────
const lineItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      trim: true,
      default: "piece",
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    amount: {
      type: Number,
      required: true, // quantity * unitPrice (calculated, stored for performance)
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: true }
);

// ─── Payment Transaction Sub-Schema ───────────────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Payment amount must be greater than 0"],
    },
    method: {
      type: String,
      enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"],
      default: "CASH",
    },
    reference: {
      type: String,
      trim: true,
      default: null, // UPI ref, cheque number, etc.
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ─── Order Schema ──────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // Tenant isolation — every query must include this
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    // Client reference + snapshot (snapshot for billing even if client is deleted)
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    clientSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, default: "" },
      email: { type: String, default: null },
    },

    // Order dates
    orderDate: {
      type: Date,
      required: true,
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    // Line items
    items: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "Order must have at least one item",
      },
    },

    // Financial totals (calculated and stored — never compute on read)
    financial: {
      subtotal: { type: Number, required: true, min: 0 },
      discountType: {
        type: String,
        enum: ["NONE", "FIXED", "PERCENTAGE"],
        default: "NONE",
      },
      discountValue: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      taxType: {
        type: String,
        enum: ["NONE", "GST", "VAT", "OTHER"],
        default: "NONE",
      },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      taxAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },

    // Payment tracking
    payment: {
      advancePaid: { type: Number, default: 0, min: 0 },
      totalPaid: { type: Number, default: 0, min: 0 }, // advancePaid + all recorded payments
      remainingAmount: { type: Number, required: true, min: 0 },
      status: {
        type: String,
        enum: ["UNPAID", "PARTIAL", "PAID"],
        default: "UNPAID",
      },
      transactions: [transactionSchema],
    },

    // Order lifecycle
    status: {
      type: String,
      enum: ["CREATED", "PENDING", "DELIVERED", "CANCELLED"],
      default: "CREATED",
    },

    // Notes
    notes: {
      type: String,
      trim: true,
      default: null,
    },

    // Notification tracking
    reminders: {
      deliveryReminderSent: { type: Boolean, default: false },
      paymentReminderSent: { type: Boolean, default: false },
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

// Primary listing query
orderSchema.index({ businessId: 1, isDeleted: 1, deliveryDate: 1, createdAt: -1 });

// Dashboard queries
orderSchema.index({ businessId: 1, isDeleted: 1, status: 1, deliveryDate: 1 });

// Outstanding / payment queries
orderSchema.index({ businessId: 1, "payment.status": 1, isDeleted: 1 });

// Client order history
orderSchema.index({ businessId: 1, clientId: 1, createdAt: -1 });

// Customer name search (kept for backward compat)
orderSchema.index({ businessId: 1, "clientSnapshot.name": 1 });

// Notification cron
orderSchema.index({ businessId: 1, deliveryDate: 1, "reminders.deliveryReminderSent": 1 });

// Analytics — delivered orders by date
orderSchema.index({ businessId: 1, status: 1, deliveryDate: 1 });

export default mongoose.model("Order", orderSchema);