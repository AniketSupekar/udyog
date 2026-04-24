// src/middleware/auth.middleware.js
// Zero DB calls — JWT contains everything we need (userId + businessId)
// Uses ApiError so all auth failures flow through globalErrorHandler

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw ApiError.unauthorized("Not authenticated");
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (!decoded?.userId || !decoded?.businessId) {
    throw ApiError.forbidden("User is not assigned to any business");
  }

  req.user = {
    userId: decoded.userId,
    businessId: decoded.businessId,
  };

  next();
});