// src/modules/search/search.controller.js
import Order from "../../models/Order.js";
import Client from "../../models/Client.js";
import Product from "../../models/Product.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

/* ─── GET /api/v1/search?q=query ────────────────────────────────────── */
export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { businessId } = req.user;

  if (!q?.trim() || q.trim().length < 2) {
    throw ApiError.badRequest("Search query must be at least 2 characters");
  }

  const query = q.trim();
  const regex = { $regex: query, $options: "i" };

  // Run all 3 searches in parallel
  const [orders, clients, products] = await Promise.all([
    Order.find({
      businessId,
      isDeleted: false,
      $or: [
        { "clientSnapshot.name": regex },
        { "clientSnapshot.phone": regex },
      ],
    })
      .select("clientSnapshot financial payment status deliveryDate orderDate source createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    Client.find({
      businessId,
      isActive: true,
      $or: [
        { name: regex },
        { phone: regex },
      ],
    })
      .select("name phone address totalOrders totalRevenue")
      .limit(5)
      .lean(),

    Product.find({
      businessId,
      isActive: true,
      $or: [
        { name: regex },
        { category: regex },
      ],
    })
      .select("name basePrice unit category images isPublic")
      .limit(5)
      .lean(),
  ]);

  sendSuccess(res, {
    query,
    orders,
    clients,
    products,
    total: orders.length + clients.length + products.length,
  });
});