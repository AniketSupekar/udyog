// src/modules/business/business.controller.js
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import Business from "../../models/Business.js";

/**
 * GET /api/business/profile
 */
export const getBusinessProfile = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.businessId).lean();
  if (!business) throw ApiError.notFound("Business not found");
  sendSuccess(res, business, "Business profile fetched");
});

/**
 * PATCH /api/business/profile
 * Updates: name, phone, email, address, upiId, gstNumber, defaultTaxRate, invoicePrefix
 */
export const updateBusinessProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "email", "address", "upiId", "gstNumber", "defaultTaxRate", "invoicePrefix"];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const business = await Business.findByIdAndUpdate(
    req.user.businessId,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();

  if (!business) throw ApiError.notFound("Business not found");

  sendSuccess(res, business, "Business profile updated");
});