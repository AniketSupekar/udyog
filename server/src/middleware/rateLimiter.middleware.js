// src/middleware/rateLimiter.middleware.js
// Protects the API from brute force, credential stuffing, and abuse
// Different limits for different route sensitivity levels

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
 * Auth routes — login, register
 * Strict: 50 attempts per 15 minutes per IP
 * Prevents brute force password attacks
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
 * General API limiter
 * Generous: 200 requests per minute per IP
 * Prevents scrapers and accidental loops
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isDev ? 1000 : 200, // relaxed in dev
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Cron / webhook endpoints
 * Very strict — only allow a few hits
 */
export const cronLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: rateLimitResponse,
  standardHeaders: true,
  legacyHeaders: false,
});