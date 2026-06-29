import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [0.01, "Quantity must be greater than 0"] },
    unit: { type: String, trim: true, default: "piece" },
    unitPrice: { type: Number, required: true, min: [0, "Unit price cannot be negative"] },
    costPrice: { type: Number, default: null, min: 0 },
    amount: { type: Number, required: true },
    notes: { type: String, trim: true, default: null },
  },
  { _id: true }
);

const transactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: [0.01, "Payment amount must be greater than 0"] },
    method: { type: String, enum: ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"], default: "CASH" },
    reference: { type: String, trim: true, default: null },
    note: { type: String, trim: true, default: null },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
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
    orderDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: false, default: null },
    items: {
      type: [lineItemSchema],
      validate: { validator: (v) => v.length > 0, message: "Order must have at least one item" },
    },
    financial: {
      subtotal: { type: Number, required: true, min: 0 },
      discountType: { type: String, enum: ["NONE", "FIXED", "PERCENTAGE"], default: "NONE" },
      discountValue: { type: Number, default: 0, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      taxType: { type: String, enum: ["NONE", "GST", "VAT", "OTHER"], default: "NONE" },
      taxRate: { type: Number, default: 0, min: 0, max: 100 },
      taxAmount: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },
    payment: {
      advancePaid: { type: Number, default: 0, min: 0 },
      totalPaid: { type: Number, default: 0, min: 0 },
      remainingAmount: { type: Number, required: true, min: 0 },
      status: { type: String, enum: ["UNPAID", "PARTIAL", "PAID"], default: "UNPAID" },
      transactions: [transactionSchema],
    },
    status: {
      type: String,
      enum: ["QUOTE", "CREATED", "PENDING", "DELIVERED", "CANCELLED"],
      default: "CREATED",
    },
    source: {
      type: String,
      enum: ["ADMIN", "STOREFRONT"],
      default: "ADMIN",
    },
    notes: { type: String, trim: true, default: null },
    reminders: {
      deliveryReminderSent: { type: Boolean, default: false },
      paymentReminderSent: { type: Boolean, default: false },
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "orders" }
);

orderSchema.index({ businessId: 1, isDeleted: 1, deliveryDate: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, isDeleted: 1, status: 1, deliveryDate: 1 });
orderSchema.index({ businessId: 1, "payment.status": 1, isDeleted: 1 });
orderSchema.index({ businessId: 1, clientId: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, "clientSnapshot.name": 1 });
orderSchema.index({ businessId: 1, deliveryDate: 1, "reminders.deliveryReminderSent": 1 });
orderSchema.index({ businessId: 1, status: 1, deliveryDate: 1 });
orderSchema.index({ businessId: 1, source: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);