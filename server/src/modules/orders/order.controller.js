// src/modules/orders/order.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";
import { delCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/ApiResponse.js";
import { calculateOrderTotals, getPaymentStatus } from "../../utils/calculations.js";

const invalidateOrderCache = async (businessId) => {
  await Promise.all([
    delCache(`dashboard:*:${businessId}`),
    delCache(`orders:*:${businessId}*`),
  ]);
};

const STATUS_TRANSITIONS = {
  CREATED: ["PENDING", "CANCELLED"],
  PENDING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/* ─── POST /api/orders ─────────────────────────────────────────────────────── */
export const createOrder = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const {
    clientSnapshot,
    clientId,
    orderDate,
    deliveryDate,
    items,
    financial,
    advancePaid = 0,
    notes,
  } = req.body;

  if (!clientSnapshot?.name || !clientSnapshot?.phone) {
    throw ApiError.badRequest("Customer name and phone are required", "MISSING_CLIENT");
  }
  if (!orderDate || !deliveryDate) {
    throw ApiError.badRequest("Order date and delivery date are required", "MISSING_DATES");
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest("Order must have at least one item", "MISSING_ITEMS");
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productName?.trim()) throw ApiError.badRequest(`Item ${i + 1}: product name is required`, "INVALID_ITEM");
    if (!item.quantity || item.quantity <= 0) throw ApiError.badRequest(`Item ${i + 1}: quantity must be greater than 0`, "INVALID_ITEM");
    if (item.unitPrice == null || item.unitPrice < 0) throw ApiError.badRequest(`Item ${i + 1}: unit price must be 0 or greater`, "INVALID_ITEM");
  }

  const oDate = new Date(orderDate);
  const dDate = new Date(deliveryDate);
  if (isNaN(oDate.getTime()) || isNaN(dDate.getTime())) {
    throw ApiError.badRequest("Invalid date format", "INVALID_DATE");
  }

  const computedItems = items.map((item) => ({
    ...item,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));

  const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
    computedItems,
    { type: financial?.discountType || "NONE", value: financial?.discountValue || 0 },
    { type: financial?.taxType || "NONE", rate: financial?.taxRate || 0 }
  );

  const advance = Number(advancePaid) || 0;
  if (advance < 0) throw ApiError.badRequest("Advance paid cannot be negative", "INVALID_PAYMENT");
  if (advance > total) throw ApiError.badRequest("Advance paid cannot exceed total amount", "INVALID_PAYMENT");

  const remainingAmount = Math.round((total - advance) * 100) / 100;

  const order = await Order.create({
    businessId,
    clientId: clientId || null,
    clientSnapshot,
    orderDate: oDate,
    deliveryDate: dDate,
    items: computedItems,
    financial: {
      subtotal,
      discountType: financial?.discountType || "NONE",
      discountValue: financial?.discountValue || 0,
      discountAmount,
      taxType: financial?.taxType || "NONE",
      taxRate: financial?.taxRate || 0,
      taxAmount,
      total,
    },
    payment: {
      advancePaid: advance,
      totalPaid: advance,
      remainingAmount,
      status: getPaymentStatus(total, advance),
      transactions: advance > 0
        ? [{ amount: advance, method: "CASH", note: "Advance payment" }]
        : [],
    },
    notes: notes || null,
    status: "CREATED",
  });

  await invalidateOrderCache(businessId);
  sendCreated(res, order, "Order created successfully");
});

/* ─── GET /api/orders ──────────────────────────────────────────────────────── */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    paymentStatus,
    filter,
    source,           // NEW — "STOREFRONT" | "ADMIN"
    showDeleted = "false",
  } = req.query;

  const query = { businessId };
  if (showDeleted !== "true") query.isDeleted = false;
  if (status) query.status = status;
  if (paymentStatus) query["payment.status"] = paymentStatus;
  if (source) query.source = source;  // NEW — filter by source

  if (search.trim()) {
    query["clientSnapshot.name"] = { $regex: search.trim(), $options: "i" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  if (filter === "due-today") {
    query.deliveryDate = { $gte: today, $lte: endOfToday };
  } else if (filter === "upcoming") {
    query.deliveryDate = { $gt: endOfToday };
  } else if (filter === "overdue") {
    query.deliveryDate = { $lt: today };
    query.status = { $nin: ["DELIVERED", "CANCELLED"] };
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(query),
  ]);

  sendPaginated(res, orders, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/* ─── GET /api/orders/:id ──────────────────────────────────────────────────── */
export const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw ApiError.badRequest("Invalid order ID", "INVALID_ID");
  }

  const order = await Order.findOne({
    _id: req.params.id,
    businessId: req.user.businessId,
    isDeleted: false,
  }).lean();

  if (!order) throw ApiError.notFound("Order not found");

  sendSuccess(res, order);
});

/* ─── PATCH /api/orders/:id/status ────────────────────────────────────────── */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw ApiError.badRequest("Status is required", "MISSING_STATUS");

  const order = await Order.findOne({
    _id: req.params.id,
    businessId: req.user.businessId,
    isDeleted: false,
  });

  if (!order) throw ApiError.notFound("Order not found");

  const allowed = STATUS_TRANSITIONS[order.status];
  if (!allowed?.includes(status)) {
    throw ApiError.badRequest(`Cannot transition from ${order.status} to ${status}`, "INVALID_STATUS_TRANSITION");
  }

  order.status = status;
  await order.save();

  await invalidateOrderCache(req.user.businessId);
  sendSuccess(res, order, `Order marked as ${status}`);
});

/* ─── PATCH /api/orders/:id ────────────────────────────────────────────────── */
export const updateOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    businessId: req.user.businessId,
    status: { $nin: ["DELIVERED", "CANCELLED"] },
    isDeleted: false,
  });

  if (!order) throw ApiError.notFound("Order not found or cannot be edited");

  const { clientSnapshot, orderDate, deliveryDate, items, financial, notes } = req.body;

  if (clientSnapshot) order.clientSnapshot = { ...order.clientSnapshot, ...clientSnapshot };
  if (orderDate) order.orderDate = new Date(orderDate);
  if (deliveryDate) order.deliveryDate = new Date(deliveryDate);
  if (notes !== undefined) order.notes = notes;

  if (items && Array.isArray(items) && items.length > 0) {
    const computedItems = items.map((item) => ({
      ...item,
      amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
    }));

    const { subtotal, discountAmount, taxAmount, total } = calculateOrderTotals(
      computedItems,
      { type: financial?.discountType || order.financial.discountType, value: financial?.discountValue ?? order.financial.discountValue },
      { type: financial?.taxType || order.financial.taxType, rate: financial?.taxRate ?? order.financial.taxRate }
    );

    order.items = computedItems;
    order.financial = {
      subtotal,
      discountType: financial?.discountType || order.financial.discountType,
      discountValue: financial?.discountValue ?? order.financial.discountValue,
      discountAmount,
      taxType: financial?.taxType || order.financial.taxType,
      taxRate: financial?.taxRate ?? order.financial.taxRate,
      taxAmount,
      total,
    };

    const remaining = Math.round((total - order.payment.totalPaid) * 100) / 100;
    if (remaining < 0) throw ApiError.badRequest("Total paid exceeds new order total", "INVALID_PAYMENT");

    order.payment.remainingAmount = remaining;
    order.payment.status = getPaymentStatus(total, order.payment.totalPaid);
  }

  await order.save();
  await invalidateOrderCache(req.user.businessId);
  sendSuccess(res, order, "Order updated successfully");
});

/* ─── POST /api/orders/:id/payments ───────────────────────────────────────── */
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method = "CASH", reference, note } = req.body;

  if (!amount || amount <= 0) {
    throw ApiError.badRequest("Payment amount must be greater than 0", "INVALID_AMOUNT");
  }

  const order = await Order.findOne({
    _id: req.params.id,
    businessId: req.user.businessId,
    isDeleted: false,
  });

  if (!order) throw ApiError.notFound("Order not found");
  if (order.status === "CANCELLED") throw ApiError.badRequest("Cannot record payment for cancelled order", "ORDER_CANCELLED");

  const roundedAmount = Math.round(amount * 100) / 100;

  if (roundedAmount > order.payment.remainingAmount) {
    throw ApiError.badRequest(
      `Payment of ₹${roundedAmount} exceeds remaining balance of ₹${order.payment.remainingAmount}`,
      "OVERPAYMENT"
    );
  }

  order.payment.transactions.push({
    amount: roundedAmount,
    method,
    reference: reference || null,
    note: note || null,
    recordedAt: new Date(),
  });

  order.payment.totalPaid = Math.round((order.payment.totalPaid + roundedAmount) * 100) / 100;
  order.payment.remainingAmount = Math.round((order.payment.remainingAmount - roundedAmount) * 100) / 100;
  order.payment.status = getPaymentStatus(order.financial.total, order.payment.totalPaid);

  await order.save();
  await invalidateOrderCache(req.user.businessId);

  sendSuccess(res, order, "Payment recorded successfully");
});

/* ─── PATCH /api/orders/:id/delete ────────────────────────────────────────── */
export const softDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, businessId: req.user.businessId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  ).lean();

  if (!order) throw ApiError.notFound("Order not found");

  await invalidateOrderCache(req.user.businessId);
  sendSuccess(res, null, "Order deleted successfully");
});