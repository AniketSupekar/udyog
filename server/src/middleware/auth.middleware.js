// src/middleware/auth.middleware.js
// Reads JWT from httpOnly cookie OR Authorization header (Bearer token)
// Header fallback ensures auth works on browsers that block cross-origin cookies

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  // Try cookie first, then Authorization header
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

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
    role: decoded.role,
  };

  next();
});