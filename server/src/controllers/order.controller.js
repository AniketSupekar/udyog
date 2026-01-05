import Order from "../models/Order.js";


export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      advancePaid = 0
    } = req.body;

    // Validation
    if (
      !customer ||
      !orderDate ||
      !deliveryDate ||
      quantity == null ||
      rate == null
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (quantity <= 0 || rate <= 0) {
      return res.status(400).json({
        message: "Quantity and rate must be greater than zero"
      });
    }

    const totalAmount = quantity * rate;
    const remainingAmount = totalAmount - advancePaid;

    if (remainingAmount < 0) {
      return res.status(400).json({
        message: "Advance cannot exceed total amount"
      });
    }

    const order = await Order.create({
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      totalAmount,
      advancePaid,
      remainingAmount,
      status: "CREATED" // ✅ FIXED
    });

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      showDeleted = "false"
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const filter = {};

    // 🔹 Soft delete filter
    if (showDeleted !== "true") {
      filter.isDeleted = false;
    }

    // 🔹 Status filter
    if (status) {
      filter.status = status;
    }

    // 🔹 Search (customer name or phone)
    if (search) {
      filter.$or = [
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } }
      ];
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ deliveryDate: 1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      data: orders,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: "Invalid order ID" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Block changes if delivered
    if (order.status === "DELIVERED") {
      return res.status(400).json({
        message: "Delivered orders cannot be modified"
      });
    }

    // Validate transitions
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

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const softDeleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ❌ Block editing if delivered or deleted
    if (order.status === "DELIVERED" || order.isDeleted) {
      return res.status(400).json({
        message: "This order cannot be edited"
      });
    }

    const {
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      advancePaid
    } = req.body;

    // ✅ Update only fields that are sent
    if (customer) order.customer = customer;
    if (orderDate) order.orderDate = orderDate;
    if (deliveryDate) order.deliveryDate = deliveryDate;
    if (quantity != null) order.quantity = quantity;
    if (rate != null) order.rate = rate;
    if (advancePaid != null) order.advancePaid = advancePaid;

    // ✅ Recalculate amounts
    order.totalAmount = order.quantity * order.rate;
    order.remainingAmount = order.totalAmount - order.advancePaid;

    if (order.remainingAmount < 0) {
      return res.status(400).json({
        message: "Advance cannot exceed total amount"
      });
    }

    await order.save();
    res.status(200).json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
