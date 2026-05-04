// src/utils/token.js
// Secure token generation utilities
import crypto from "crypto";

/**
 * Generate a 6-digit OTP for email verification
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure random token for password reset
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token before storing in DB (security)
 */
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};