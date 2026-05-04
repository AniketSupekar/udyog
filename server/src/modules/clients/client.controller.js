// src/modules/clients/client.controller.js
import Client from "../../models/Client.js";
import Order from "../../models/Order.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../utils/ApiResponse.js";
import { getCache, setCache, delCache } from "../../config/redis.js";

const CACHE_KEY = (businessId) => `clients:list:${businessId}`;

/* ─── GET /api/clients ───────────────────────────────────────────────── */
export const getClients = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { search = "", page = 1, limit = 20 } = req.query;

  const query = { businessId, isActive: true };
  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { phone: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [clients, total] = await Promise.all([
    Client.find(query).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
    Client.countDocuments(query),
  ]);

  sendPaginated(res, clients, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

/* ─── GET /api/clients/search — for autocomplete ─────────────────────── */
export const searchClients = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { q = "" } = req.query;

  if (q.trim().length < 1) return sendSuccess(res, []);

  // Try cache first for instant autocomplete
  const cacheKey = CACHE_KEY(businessId);
  const cached = await getCache(cacheKey);

  if (cached) {
    const filtered = cached.filter(
      (c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.phone.includes(q)
    );
    return sendSuccess(res, filtered.slice(0, 8));
  }

  const clients = await Client.find(
    {
      businessId,
      isActive: true,
      $or: [
        { name: { $regex: q.trim(), $options: "i" } },
        { phone: { $regex: q.trim(), $options: "i" } },
      ],
    },
    { name: 1, phone: 1, address: 1, email: 1 }
  )
    .limit(8)
    .lean();

  sendSuccess(res, clients);
});

/* ─── POST /api/clients ──────────────────────────────────────────────── */
export const createClient = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { name, phone, email, address, type, notes } = req.body;

  if (!name?.trim()) throw ApiError.badRequest("Client name is required");
  if (!phone?.trim()) throw ApiError.badRequest("Phone number is required");

  // Check duplicate phone within business
  const existing = await Client.findOne({ businessId, phone: phone.trim() });
  if (existing) throw ApiError.conflict("A client with this phone number already exists");

  const client = await Client.create({
    businessId,
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim().toLowerCase() || null,
    address: address?.trim() || null,
    type: type || "INDIVIDUAL",
    notes: notes?.trim() || null,
  });

  await delCache(CACHE_KEY(businessId));
  sendCreated(res, client, "Client created successfully");
});

/* ─── GET /api/clients/:id ───────────────────────────────────────────── */
export const getClientById = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { id } = req.params;

  const [client, orders] = await Promise.all([
    Client.findOne({ _id: id, businessId }).lean(),
    Order.find({ businessId, "clientSnapshot.phone": { $exists: true }, clientId: id, isDeleted: false })
      .select("clientSnapshot financial payment status deliveryDate orderDate")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  if (!client) throw ApiError.notFound("Client not found");

  sendSuccess(res, { ...client, recentOrders: orders });
});

/* ─── PATCH /api/clients/:id ─────────────────────────────────────────── */
export const updateClient = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { id } = req.params;
  const { name, phone, email, address, type, notes } = req.body;

  const client = await Client.findOne({ _id: id, businessId });
  if (!client) throw ApiError.notFound("Client not found");

  if (name) client.name = name.trim();
  if (phone) client.phone = phone.trim();
  if (email !== undefined) client.email = email?.trim().toLowerCase() || null;
  if (address !== undefined) client.address = address?.trim() || null;
  if (type) client.type = type;
  if (notes !== undefined) client.notes = notes?.trim() || null;

  await client.save();
  await delCache(CACHE_KEY(businessId));

  sendSuccess(res, client, "Client updated");
});

/* ─── DELETE /api/clients/:id ────────────────────────────────────────── */
export const deleteClient = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const { id } = req.params;

  const client = await Client.findOneAndUpdate(
    { _id: id, businessId },
    { isActive: false },
    { new: true }
  );
  if (!client) throw ApiError.notFound("Client not found");

  await delCache(CACHE_KEY(businessId));
  sendSuccess(res, null, "Client deleted");
});