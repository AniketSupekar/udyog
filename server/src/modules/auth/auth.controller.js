// src/modules/auth/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Business from "../../models/Business.js";
import { env } from "../../config/env.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { generateOTP, generateResetToken, hashToken } from "../../utils/token.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../config/email.js";

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, businessId: user.businessId, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

/* ─── POST /api/auth/register ────────────────────────────────────────── */
export const register = asyncHandler(async (req, res) => {
  const { businessName, name, email, password } = req.body;

  if (!businessName?.trim()) throw ApiError.badRequest("Business name is required");
  if (!name?.trim()) throw ApiError.badRequest("Your name is required");
  if (!email?.trim()) throw ApiError.badRequest("Email is required");
  if (!password || password.length < 8)
    throw ApiError.badRequest("Password must be at least 8 characters");

  // Check email taken
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  // Use a transaction — both Business + User must be created together
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [business] = await Business.create([{ name: businessName.trim() }], { session });

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const [user] = await User.create(
      [
        {
          businessId: business._id,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: "ADMIN",
          emailOTP: otp,
          emailOTPExpiry: otpExpiry,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Send verification email (non-blocking — don't fail register if email fails)
    sendVerificationEmail({ to: email, name: name.trim(), otp }).catch(console.error);

    sendSuccess(
      res,
      {
        userId: user._id,
        email: user.email,
        requiresVerification: true,
      },
      "Account created! Check your email for a verification code.",
      201
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

/* ─── POST /api/auth/verify-email ────────────────────────────────────── */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) throw ApiError.badRequest("Email and OTP are required");

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+emailOTP +emailOTPExpiry +passwordHash");

  if (!user) throw ApiError.notFound("Account not found");
  if (user.isEmailVerified) throw ApiError.badRequest("Email is already verified");
  if (!user.emailOTP || user.emailOTP !== otp) throw ApiError.badRequest("Invalid verification code");
  if (new Date() > user.emailOTPExpiry) throw ApiError.badRequest("Code expired. Please request a new one.");

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpiry = undefined;
  await user.save();

  // Auto-login after verification
  const token = signToken(user);
  res.cookie("token", token, cookieOptions);

  sendSuccess(res, {
    userId: user._id,
    businessId: user.businessId,
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
  }, "Email verified! Welcome aboard.");
});

/* ─── POST /api/auth/resend-otp ──────────────────────────────────────── */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest("Email is required");

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+emailOTP +emailOTPExpiry");

  if (!user) throw ApiError.notFound("Account not found");
  if (user.isEmailVerified) throw ApiError.badRequest("Email already verified");

  const otp = generateOTP();
  user.emailOTP = otp;
  user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  sendVerificationEmail({ to: email, name: user.name, otp }).catch(console.error);

  sendSuccess(res, null, "Verification code sent. Check your email.");
});

/* ─── POST /api/auth/login ───────────────────────────────────────────── */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw ApiError.badRequest("Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash +failedLoginAttempts +lockedUntil");

  // Generic error — don't reveal if email exists
  const invalidErr = ApiError.unauthorized("Invalid email or password");
  if (!user) throw invalidErr;

  // Check account lock
  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw ApiError.forbidden(`Account locked. Try again in ${minutesLeft} minutes.`);
  }

  // Check account active
  if (!user.isActive) throw ApiError.forbidden("Account deactivated. Contact support.");

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    // Track failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalidErr;
  }

  // Successful login — reset counters
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.cookie("token", token, cookieOptions);

  sendSuccess(res, {
    userId: user._id,
    businessId: user.businessId,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    onboardingCompleted: user.onboardingCompleted,
  }, "Login successful");
});

/* ─── POST /api/auth/forgot-password ────────────────────────────────── */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest("Email is required");

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+passwordResetToken +passwordResetExpiry");

  // Always respond OK — don't reveal if account exists (security)
  if (!user) {
    return sendSuccess(res, null, "If an account exists, a reset link has been sent.");
  }

  const token = generateResetToken();
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  sendPasswordResetEmail({ to: email, name: user.name, resetUrl }).catch(console.error);

  sendSuccess(res, null, "If an account exists, a reset link has been sent.");
});

/* ─── POST /api/auth/reset-password ─────────────────────────────────── */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) throw ApiError.badRequest("Token and password are required");
  if (password.length < 8) throw ApiError.badRequest("Password must be at least 8 characters");

  const hashed = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordHash +passwordResetToken +passwordResetExpiry");

  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  sendSuccess(res, null, "Password reset successful. You can now log in.");
});

/* ─── PATCH /api/auth/complete-onboarding ────────────────────────────── */
export const completeOnboarding = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.userId, { onboardingCompleted: true });
  await Business.findByIdAndUpdate(req.user.businessId, {
    "onboarding.profileCompleted": true,
  });
  sendSuccess(res, null, "Onboarding complete");
});

/* ─── POST /api/auth/logout ──────────────────────────────────────────── */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: env.isProd, sameSite: env.isProd ? "none" : "lax" });
  sendSuccess(res, null, "Logged out successfully");
});

/* ─── GET /api/auth/me ───────────────────────────────────────────────── */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .select("_id name email businessId role isEmailVerified onboardingCompleted lastLoginAt")
    .lean();
  if (!user) throw ApiError.unauthorized("User not found");
  sendSuccess(res, user);
});