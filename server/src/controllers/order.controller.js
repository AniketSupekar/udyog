// src/controllers/order.controller.js
import Order from "../models/Order.js";
import redis from "../utils/redis.js";

/* ======================
   CREATE ORDER
====================== */
export const createOrder = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const { customer, orderDate, deliveryDate, quantity, rate, advancePaid = 0 } = req.body;

    if (!customer || !orderDate || !deliveryDate || quantity == null || rate == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (quantity <= 0 || rate <= 0) {
      return res.status(400).json({ message: "Quantity and rate must be greater than zero" });
    }

    const totalAmount = quantity * rate;
    const remainingAmount = totalAmount - advancePaid;
    if (remainingAmount < 0) return res.status(400).json({ message: "Advance cannot exceed total amount" });

    const order = await Order.create({
      nurseryId,
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      totalAmount,
      advancePaid,
      remainingAmount,
      status: "CREATED"
    });

    // Invalidate all related order & dashboard caches
    await redis.del(`orders:${nurseryId}:*`);
    await redis.del(`dashboard:${nurseryId}:*`);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   GET ALL ORDERS (FAST)
====================== */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status, filter, showDeleted = false } = req.query;
    const nurseryId = req.user.nurseryId;

    // Create a cache key that includes all filters & pagination
    const cacheKey = `orders:${nurseryId}:${page}:${limit}:${search}:${status || "all"}:${filter || "all"}:${showDeleted}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const query = { nurseryId };
    if (showDeleted !== "true") query.isDeleted = false;
    if (status) query.status = status;
    if (search) query["customer.name"] = { $regex: search, $options: "i" };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    if (filter === "due-today") query.deliveryDate = { $gte: today, $lte: endOfToday };
    else if (filter === "upcoming") query.deliveryDate = { $gt: endOfToday };
    else if (filter === "overdue") query.deliveryDate = { $lt: today };

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ deliveryDate: 1 }).skip(skip).limit(Number(limit)).lean(),
      Order.countDocuments(query)
    ]);

    const response = {
      data: orders,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total
    };

    // Cache for 60 seconds
    await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ======================
   GET ORDER BY ID
====================== */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, nurseryId: req.user.nurseryId }).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch {
    res.status(400).json({ message: "Invalid order ID" });
  }
};

/* ======================
   UPDATE ORDER STATUS
====================== */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ _id: id, nurseryId: req.user.nurseryId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "DELIVERED") return res.status(400).json({ message: "Delivered orders cannot be modified" });

    const allowedTransitions = { CREATED: ["PENDING"], PENDING: ["DELIVERED"] };
    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();

    // Invalidate all related order & dashboard caches
    await redis.del(`orders:${req.user.nurseryId}:*`);
    await redis.del(`dashboard:${req.user.nurseryId}:*`);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   SOFT DELETE ORDER
====================== */
export const softDeleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, nurseryId: req.user.nurseryId },
      { isDeleted: true },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Invalidate caches
    await redis.del(`orders:${req.user.nurseryId}:*`);
    await redis.del(`dashboard:${req.user.nurseryId}:*`);

    res.json({ message: "Order deleted", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================
   UPDATE ORDER DETAILS
====================== */
export const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, orderDate, deliveryDate, quantity, rate, advancePaid } = req.body;

    const order = await Order.findOne({
      _id: id,
      nurseryId: req.user.nurseryId,
      status: { $ne: "DELIVERED" },
      isDeleted: false
    });

    if (!order) return res.status(404).json({ message: "Order not found or locked" });

    if (customer) order.customer = customer;
    if (orderDate) order.orderDate = orderDate;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (quantity != null) order.quantity = quantity;
    if (rate != null) order.rate = rate;
    if (advancePaid != null) order.advancePaid = advancePaid;

    order.totalAmount = order.quantity * order.rate;
    order.remainingAmount = order.totalAmount - order.advancePaid;
    if (order.remainingAmount < 0) return res.status(400).json({ message: "Advance cannot exceed total amount" });

    await order.save();

    // Invalidate all related order & dashboard caches
    await redis.del(`orders:${req.user.nurseryId}:*`);
    await redis.del(`dashboard:${req.user.nurseryId}:*`);

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};