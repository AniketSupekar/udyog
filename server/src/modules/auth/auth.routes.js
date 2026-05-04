// src/modules/auth/auth.routes.js
import express from "express";
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  completeOnboarding,
} from "./auth.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-otp", authLimiter, resendOTP);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.patch("/complete-onboarding", protect, completeOnboarding);

export default router;