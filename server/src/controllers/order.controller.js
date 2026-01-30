// src/controllers/order.controller.js
import Order from "../models/Order.js";

/* ======================
   CREATE ORDER
====================== */
export const createOrder = async (req, res) => {
  try {
    const nurseryId = req.user.nurseryId;
    const {
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      advancePaid = 0
    } = req.body;

    if (!customer || !orderDate || !deliveryDate || quantity == null || rate == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (quantity <= 0 || rate <= 0) {
      return res.status(400).json({ message: "Quantity and rate must be greater than zero" });
    }

    const totalAmount = quantity * rate;
    const remainingAmount = totalAmount - advancePaid;

    if (remainingAmount < 0) {
      return res.status(400).json({ message: "Advance cannot exceed total amount" });
    }

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
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      filter,
      showDeleted = false
    } = req.query;

    const nurseryId = req.user.nurseryId;
    const query = { nurseryId };

    if (showDeleted !== "true") query.isDeleted = false;
    if (status) query.status = status;

    if (search) {
      query["customer.name"] = { $regex: search, $options: "i" };
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

    if (filter === "due-today") {
      query.deliveryDate = { $gte: today, $lte: endOfToday };
    } else if (filter === "upcoming") {
      query.deliveryDate = { $gt: endOfToday };
    } else if (filter === "overdue") {
      query.deliveryDate = { $lt: today };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ deliveryDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({
      data: orders,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ======================
   GET ORDER BY ID
====================== */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      nurseryId: req.user.nurseryId
    }).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

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

    const order = await Order.findOne({
      _id: id,
      nurseryId: req.user.nurseryId
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "DELIVERED") {
      return res.status(400).json({ message: "Delivered orders cannot be modified" });
    }

    const allowedTransitions = {
      CREATED: ["PENDING"],
      PENDING: ["DELIVERED"]
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    order.status = status;
    await order.save();

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

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

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

    const order = await Order.findOne({
      _id: id,
      nurseryId: req.user.nurseryId,
      status: { $ne: "DELIVERED" },
      isDeleted: false
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found or locked" });
    }

    const {
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      advancePaid
    } = req.body;

    if (customer) order.customer = customer;
    if (orderDate) order.orderDate = orderDate;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (quantity != null) order.quantity = quantity;
    if (rate != null) order.rate = rate;
    if (advancePaid != null) order.advancePaid = advancePaid;

    order.totalAmount = order.quantity * order.rate;
    order.remainingAmount = order.totalAmount - order.advancePaid;

    if (order.remainingAmount < 0) {
      return res.status(400).json({ message: "Advance cannot exceed total amount" });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};