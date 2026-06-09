// src/modules/products/product.controller.js
import Product from "../../models/Product.js";
import { getCache, setCache, delCache } from "../../config/redis.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendCreated } from "../../utils/ApiResponse.js";

const CACHE_KEY = (businessId) => `products:${businessId}`;
const CACHE_TTL = 300;

/* ─── GET /api/products ──────────────────────────────────────────────── */
export const getProducts = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cached = await getCache(CACHE_KEY(businessId));
  if (cached) return sendSuccess(res, cached);

  const products = await Product.find({ businessId, isActive: true })
    .sort({ name: 1 })
    .lean();

  await setCache(CACHE_KEY(businessId), products, CACHE_TTL);
  sendSuccess(res, products);
});

/* ─── POST /api/products ─────────────────────────────────────────────── */
export const createProduct = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const {
    name, unit, basePrice, costPrice, description, category,
    isPublic, trackStock, stock, minOrderQty, images,
  } = req.body;

  if (!name?.trim()) throw ApiError.badRequest("Product name is required");
  if (basePrice == null || basePrice < 0) throw ApiError.badRequest("Valid price is required");

  const product = await Product.create({
    businessId,
    name: name.trim(),
    unit: unit || "piece",
    basePrice: Number(basePrice),
    costPrice: costPrice !== undefined && costPrice !== "" ? Number(costPrice) : null,
    description: description?.trim() || null,
    category: category?.trim() || null,
    isPublic: Boolean(isPublic),
    trackStock: Boolean(trackStock),
    stock: trackStock && stock !== "" && stock != null ? Number(stock) : null,
    minOrderQty: Number(minOrderQty) || 1,
    images: (images || []).slice(0, 3),
  });

  await delCache(CACHE_KEY(businessId));
  sendCreated(res, product, "Product created");
});

/* ─── PATCH /api/products/:id ────────────────────────────────────────── */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { businessId } = req.user;
  const {
    name, unit, basePrice, costPrice, description, category,
    isPublic, isAvailable, trackStock, stock, minOrderQty, images,
  } = req.body;

  const product = await Product.findOne({ _id: id, businessId });
  if (!product) throw ApiError.notFound("Product not found");

  if (name !== undefined) product.name = name.trim();
  if (unit !== undefined) product.unit = unit;
  if (basePrice !== undefined) product.basePrice = Number(basePrice);
  if (costPrice !== undefined) product.costPrice = costPrice !== "" && costPrice !== null ? Number(costPrice) : null;
  if (description !== undefined) product.description = description?.trim() || null;
  if (category !== undefined) product.category = category?.trim() || null;
  if (isPublic !== undefined) product.isPublic = Boolean(isPublic);
  if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
  if (trackStock !== undefined) product.trackStock = Boolean(trackStock);
  if (stock !== undefined) product.stock = stock !== null && stock !== "" ? Number(stock) : null;
  if (minOrderQty !== undefined) product.minOrderQty = Number(minOrderQty) || 1;

  if (images !== undefined) {
    const existingUrls = (images || []).filter(img => img.startsWith("http"));
    const newBase64 = (images || []).filter(img => img.startsWith("data:"));
    product.images = [...existingUrls, ...newBase64].slice(0, 3);
  }

  await product.save();
  await delCache(CACHE_KEY(businessId));
  sendSuccess(res, product, "Product updated");
});

/* ─── DELETE /api/products/:id (soft) ───────────────────────────────── */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { businessId } = req.user;

  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    { isActive: false },
    { new: true }
  );
  if (!product) throw ApiError.notFound("Product not found");

  await delCache(CACHE_KEY(businessId));
  sendSuccess(res, null, "Product deleted");
});