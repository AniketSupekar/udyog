// src/modules/products/product.controller.js
import Product from "../../models/Product.js";
import {
  getCache, setCache,
  CACHE_KEYS, CACHE_TTL,
  invalidateProductCache,
} from "../../utils/cacheManager.js";
import { uploadImage, deleteImage } from "../../config/cloudinary.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess, sendCreated } from "../../utils/ApiResponse.js";

/* ─── Helper: upload any base64 images, return final URL array ───────── */
const resolveImages = async (images = []) => {
  const resolved = await Promise.all(
    images.map(async (img) => {
      if (img.startsWith("data:")) {
        return await uploadImage(img);
      }
      return img;
    })
  );
  return resolved.slice(0, 3);
};

/* ─── GET /api/v1/products ───────────────────────────────────────────── */
export const getProducts = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const cacheKey = CACHE_KEYS.products(businessId);

  const cached = await getCache(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const products = await Product.find({ businessId, isActive: true })
    .sort({ name: 1 })
    .lean();

  await setCache(cacheKey, products, CACHE_TTL.products);
  sendSuccess(res, products);
});

/* ─── POST /api/v1/products ──────────────────────────────────────────── */
export const createProduct = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const {
    name, unit, basePrice, costPrice, description, category,
    isPublic, trackStock, stock, minOrderQty, images,
  } = req.body;

  if (!name?.trim()) throw ApiError.badRequest("Product name is required");
  if (basePrice == null || basePrice < 0) throw ApiError.badRequest("Valid price is required");

  const uploadedImages = await resolveImages(images || []);

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
    images: uploadedImages,
  });

  await invalidateProductCache(businessId);
  sendCreated(res, product, "Product created");
});

/* ─── PATCH /api/v1/products/:id ─────────────────────────────────────── */
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
    const removedUrls = product.images.filter(
      (existing) => existing.startsWith("http") && !images.includes(existing)
    );
    await Promise.all(removedUrls.map(deleteImage));
    product.images = await resolveImages(images);
  }

  await product.save();
  await invalidateProductCache(businessId);
  sendSuccess(res, product, "Product updated");
});

/* ─── DELETE /api/v1/products/:id (soft) ────────────────────────────── */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { businessId } = req.user;

  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    { isActive: false },
    { new: true }
  );
  if (!product) throw ApiError.notFound("Product not found");

  await invalidateProductCache(businessId);
  sendSuccess(res, null, "Product deleted");
});