// src/modules/store/store.controller.js
import mongoose from "mongoose";
import Business from "../../models/Business.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import Client from "../../models/Client.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { generateSlug, makeUniqueSlug } from "../../utils/slug.js";

/* ─── GET /api/store/:slug ─────────────────────────────────────────────────────
   Public — returns storefront info + public products
─────────────────────────────────────────────────────────────────────────────── */
export const getStorefront = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const business = await Business.findOne({
    "store.slug": slug,
    "store.isActive": true,
    isActive: true,
  }).lean();

  if (!business) throw ApiError.notFound("Store not found or unavailable");

  const products = await Product.find({
    businessId: business._id,
    isPublic: true,
    isAvailable: true,
    isActive: true,
  })
    .select("name description basePrice unit images category stock trackStock minOrderQty")
    .sort({ category: 1, name: 1 })
    .lean();

  sendSuccess(res, {
    store: {
      name: business.name,
      tagline: business.store.tagline,
      whatsappNumber: business.store.whatsappNumber,
      deliveryNote: business.store.deliveryNote,
      acceptingOrders: business.store.acceptingOrders,
      upiId: business.upiId,
    },
    products,
  });
});

/* ─── POST /api/store/:slug/order ──────────────────────────────────────────────
   Public — customer places an order
─────────────────────────────────────────────────────────────────────────────── */
export const placeStorefrontOrder = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { name, phone, address, items, notes } = req.body;

  if (!name?.trim()) throw ApiError.badRequest("Name is required");
  if (!phone?.trim()) throw ApiError.badRequest("Phone number is required");
  if (!items?.length) throw ApiError.badRequest("At least one item is required");

  const business = await Business.findOne({
    "store.slug": slug,
    "store.isActive": true,
    isActive: true,
  }).lean();

  if (!business) throw ApiError.notFound("Store not found or unavailable");
  if (!business.store.acceptingOrders) throw ApiError.badRequest("This store is not accepting orders right now");

  const productIds = items.map(i => i.productId).filter(Boolean);
  const products = await Product.find({
    _id: { $in: productIds },
    businessId: business._id,
    isPublic: true,
    isAvailable: true,
    isActive: true,
  }).lean();

  const productMap = {};
  products.forEach(p => { productMap[p._id.toString()] = p; });

  const lineItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) throw ApiError.badRequest(`Product not available`);

    const qty = Number(item.quantity);
    if (!qty || qty < (product.minOrderQty || 1)) {
      throw ApiError.badRequest(`Minimum order quantity for ${product.name} is ${product.minOrderQty || 1}`);
    }

    if (product.trackStock && product.stock !== null && product.stock < qty) {
      throw ApiError.badRequest(`Only ${product.stock} ${product.unit}(s) of ${product.name} available`);
    }

    const amount = Math.round(qty * product.basePrice * 100) / 100;
    subtotal += amount;

    lineItems.push({
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.basePrice,
      amount,
    });
  }

  const total = Math.round(subtotal * 100) / 100;

  const digits = phone.replace(/\D/g, "");
  let client = await Client.findOne({ businessId: business._id, phone: { $regex: digits.slice(-10) } });

  if (!client) {
    client = await Client.create({
      businessId: business._id,
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim() || "",
    });
  }

  for (const item of items) {
    const product = productMap[item.productId];
    if (product.trackStock && product.stock !== null) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -Number(item.quantity) },
      });
    }
  }

  const order = await Order.create({
    businessId: business._id,
    clientId: client._id,
    clientSnapshot: {
      name: name.trim(),
      phone: phone.trim(),
      address: address?.trim() || "",
    },
    orderDate: new Date(),
    deliveryDate: null,
    items: lineItems,
    financial: {
      subtotal,
      discountType: "NONE",
      discountAmount: 0,
      taxType: "NONE",
      taxAmount: 0,
      total,
    },
    payment: {
      advancePaid: 0,
      totalPaid: 0,
      remainingAmount: total,
      status: "UNPAID",
    },
    notes: notes?.trim() || null,
    source: "STOREFRONT",
  });

  sendSuccess(res, {
    orderId: order._id,
    orderRef: order._id.toString().slice(-8).toUpperCase(),
    total,
    items: lineItems,
    customerName: name.trim(),
    businessName: business.name,
    whatsappNumber: business.store.whatsappNumber || business.phone,
  }, "Order placed successfully!", 201);
});

/* ─── GET /api/store/:slug/order/:orderId ──────────────────────────────────────
   Public — customer checks single order status
─────────────────────────────────────────────────────────────────────────────── */
export const getOrderStatus = asyncHandler(async (req, res) => {
  const { slug, orderId } = req.params;

  const business = await Business.findOne({ "store.slug": slug }).lean();
  if (!business) throw ApiError.notFound("Store not found");

  const order = await Order.findOne({
    _id: orderId,
    businessId: business._id,
    source: "STOREFRONT",
  })
    .select("status payment.status payment.remainingAmount financial.total clientSnapshot items orderDate deliveryDate")
    .lean();

  if (!order) throw ApiError.notFound("Order not found");

  sendSuccess(res, {
    orderRef: order._id.toString().slice(-8).toUpperCase(),
    status: order.status,
    paymentStatus: order.payment.status,
    total: order.financial.total,
    remaining: order.payment.remainingAmount,
    customerName: order.clientSnapshot.name,
    items: order.items,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
  });
});

/* ─── GET /api/store/:slug/orders?phone=XXXXXXXXXX ─────────────────────────────
   Public — customer looks up all their orders by phone number
─────────────────────────────────────────────────────────────────────────────── */
export const getOrdersByPhone = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { phone } = req.query;

  if (!phone?.trim()) throw ApiError.badRequest("Phone number is required");

  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 10) throw ApiError.badRequest("Enter a valid 10-digit phone number");

  const business = await Business.findOne({
    "store.slug": slug,
    "store.isActive": true,
    isActive: true,
  }).lean();

  if (!business) throw ApiError.notFound("Store not found");

  const orders = await Order.find({
    businessId: business._id,
    source: "STOREFRONT",
    "clientSnapshot.phone": { $regex: digits },
    isDeleted: false,
  })
    .select("status payment.status payment.remainingAmount financial.total items orderDate deliveryDate createdAt")
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  sendSuccess(res, {
    orders: orders.map(o => ({
      orderId: o._id,
      orderRef: o._id.toString().slice(-8).toUpperCase(),
      status: o.status,
      paymentStatus: o.payment.status,
      total: o.financial.total,
      remaining: o.payment.remainingAmount,
      items: o.items,
      orderDate: o.orderDate,
      deliveryDate: o.deliveryDate,
    })),
  });
});

/* ─── PATCH /api/business/store ────────────────────────────────────────────────
   Protected — admin updates store settings
─────────────────────────────────────────────────────────────────────────────── */
export const updateStoreSettings = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { tagline, whatsappNumber, deliveryNote, isActive, acceptingOrders, slug } = req.body;

  const business = await Business.findById(businessId);
  if (!business) throw ApiError.notFound("Business not found");

  if (slug !== undefined) {
    const newSlug = generateSlug(slug || business.name);
    const taken = await Business.findOne({
      "store.slug": newSlug,
      _id: { $ne: businessId },
    });
    if (taken) throw ApiError.conflict("This store URL is already taken. Try a different one.");
    business.store.slug = newSlug;
  }

  if (isActive && !business.store.slug) {
    const baseSlug = generateSlug(business.name);
    business.store.slug = await makeUniqueSlug(baseSlug, async (s) => {
      return await Business.findOne({ "store.slug": s, _id: { $ne: businessId } });
    });
  }

  if (tagline !== undefined) business.store.tagline = tagline;
  if (whatsappNumber !== undefined) business.store.whatsappNumber = whatsappNumber;
  if (deliveryNote !== undefined) business.store.deliveryNote = deliveryNote;
  if (isActive !== undefined) business.store.isActive = isActive;
  if (acceptingOrders !== undefined) business.store.acceptingOrders = acceptingOrders;

  await business.save();

  sendSuccess(res, { store: business.store }, "Store settings updated");
});