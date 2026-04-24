// src/middleware/error.middleware.js
// Single place where ALL errors in the app are handled
// ApiError instances get their status code + message
// Unexpected errors get a clean 500 — stack trace NEVER sent to client
// Mongoose and JWT errors are handled specifically

import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const globalErrorHandler = (err, req, res, next) => {
  // Already formatted ApiError — use it directly
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors.length > 0 && { errors: err.errors }),
    });
  }

  // Mongoose: duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: "DUPLICATE_KEY",
    });
  }

  // Mongoose: invalid ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      code: "INVALID_ID",
    });
  }

  // Mongoose: validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Unknown/unexpected error — log it, never expose internals
  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    code: "INTERNAL_ERROR",
    // Only show stack in dev — NEVER in production
    ...(env.isDev && { stack: err.stack }),
  });
};

// Catch-all for 404 routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
};