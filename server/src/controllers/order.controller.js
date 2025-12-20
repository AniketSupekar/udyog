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

    // Basic validation
    if (!customer || !orderDate || !deliveryDate || !quantity || !rate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Core business logic
    const totalAmount = quantity * rate;
    const remainingAmount = totalAmount - advancePaid;

    if (remainingAmount < 0) {
      return res.status(400).json({ message: "Advance cannot exceed total" });
    }

    const order = await Order.create({
      customer,
      orderDate,
      deliveryDate,
      quantity,
      rate,
      totalAmount,
      advancePaid,
      remainingAmount
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ deliveryDate: 1 });
    res.json(orders);
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

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Invalid order ID" });
  }
};