// src/modules/auth/auth.controller.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { env } from "../../config/env.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

/**
 * Sign JWT — contains userId + businessId
 * Middleware reads this — zero DB calls on every request
 */
const signToken = (user) =>
  jwt.sign(
    { userId: user._id, businessId: user.businessId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

const cookieOptions = {
  httpOnly: true,                          // JS cannot read — XSS protection
  secure: env.isProd,                      // HTTPS only in production
  sameSite: env.isProd ? "none" : "lax",  // Cross-site in prod (different domains)
  maxAge: 30 * 24 * 60 * 60 * 1000,      // 30 days
};

/* ─── POST /api/auth/login ─────────────────────────────────────────────────── */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required", "MISSING_CREDENTIALS");
  }

  // Select only fields we need — lean for speed
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("_id name email passwordHash businessId role isActive")
    .lean();

  // Same error for wrong email or wrong password — prevents user enumeration
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is deactivated. Contact support.");
  }

  // Update lastLoginAt without blocking the response
  User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

  const token = signToken(user);
  res.cookie("token", token, cookieOptions);

  sendSuccess(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    businessId: user.businessId,
    role: user.role,
  }, "Login successful");
});

/* ─── POST /api/auth/logout ────────────────────────────────────────────────── */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
  });
  sendSuccess(res, null, "Logged out successfully");
});

/* ─── GET /api/auth/me ─────────────────────────────────────────────────────── */
// Zero DB call — reads from verified JWT via protect middleware
export const getMe = asyncHandler(async (req, res) => {
  // Fetch fresh user data so frontend always has latest name/role
  const user = await User.findById(req.user.userId)
    .select("_id name email businessId role")
    .lean();

  if (!user) throw ApiError.unauthorized("User not found");

  sendSuccess(res, {
    userId: user._id,
    businessId: user.businessId,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});