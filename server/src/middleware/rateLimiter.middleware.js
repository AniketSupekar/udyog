// src/middleware/rateLimiter.middleware.js
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const rateLimitResponse = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please slow down and try again later.",
    code: "RATE_LIMITED",
  });
};

/**
 * Auth routes — login, register, verify-email, forgot/reset password
 * 50 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDev ? 100 : 50,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * OTP resend — strict to prevent email bombing
 * 5 resends per hour per IP
 */
export const resendOTPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.isDev ? 50 : 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many code requests. Please try again in an hour.",
      code: "RATE_LIMITED",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API limiter
 * 200 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isDev ? 1000 : 200,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Cron / webhook endpoints
 */
export const cronLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Storefront browse — public, generous but bounded
 * 60 requests per minute per IP
 */
export const storefrontLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isDev ? 500 : 60,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Storefront order placement — prevent spam orders
 * 10 orders per 10 minutes per IP
 */
export const storeOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.isDev ? 100 : 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many orders placed. Please wait a few minutes and try again.",
      code: "RATE_LIMITED",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Storefront order phone lookup — prevent enumeration
 * 20 lookups per 10 minutes per IP
 */
export const storeTrackLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.isDev ? 200 : 20,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});