// src/modules/auth/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../../models/User.js";
import Business from "../../models/Business.js";
import Order from "../../models/Order.js";
import Client from "../../models/Client.js";
import Product from "../../models/Product.js";
import Notification from "../../models/Notification.js";
import { env } from "../../config/env.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import { generateOTP, generateResetToken, hashToken } from "../../utils/token.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../config/email.js";

const MAX_FAILED_ATTEMPTS = 10;
const LOCK_DURATION_MS = 30 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

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

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [business] = await Business.create([{ name: businessName.trim() }], { session });

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const [user] = await User.create(
      [{
        businessId: business._id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "ADMIN",
        emailOTP: otp,
        emailOTPExpiry: otpExpiry,
        resendOTPAt: new Date(), // record initial send time
      }],
      { session }
    );

    await session.commitTransaction();

    sendVerificationEmail({ to: email, name: name.trim(), otp }).catch(console.error);

    sendSuccess(res, {
      userId: user._id,
      email: user.email,
      requiresVerification: true,
    }, "Account created! Check your email for a verification code.", 201);
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
    .select("+emailOTP +emailOTPExpiry +otpFailedAttempts +passwordHash");

  if (!user) throw ApiError.notFound("Account not found");
  if (user.isEmailVerified) throw ApiError.badRequest("Email is already verified");

  // OTP was invalidated due to too many failed attempts
  if (!user.emailOTP) {
    throw ApiError.badRequest("Verification code has been invalidated. Please request a new one.");
  }

  // Check expiry before checking correctness — don't leak attempt info on expired codes
  if (new Date() > user.emailOTPExpiry) {
    throw ApiError.badRequest("Code expired. Please request a new one.");
  }

  // Wrong OTP — increment failed attempts
  if (user.emailOTP !== otp) {
    user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;

    // After MAX_OTP_ATTEMPTS wrong attempts, kill the OTP and force resend
    if (user.otpFailedAttempts >= MAX_OTP_ATTEMPTS) {
      user.emailOTP = undefined;
      user.emailOTPExpiry = undefined;
      user.otpFailedAttempts = 0;
      await user.save();
      throw ApiError.badRequest("Too many incorrect attempts. Please request a new verification code.");
    }

    await user.save();
    const attemptsLeft = MAX_OTP_ATTEMPTS - user.otpFailedAttempts;
    throw ApiError.badRequest(
      `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
    );
  }

  // Correct OTP — verify and clean up all OTP state
  user.isEmailVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpiry = undefined;
  user.otpFailedAttempts = 0;
  user.resendOTPAt = undefined;
  await user.save();

  const token = signToken(user);
  res.cookie("token", token, cookieOptions);

  sendSuccess(res, {
    token,
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
    .select("+emailOTP +emailOTPExpiry +resendOTPAt +otpFailedAttempts");

  if (!user) throw ApiError.notFound("Account not found");
  if (user.isEmailVerified) throw ApiError.badRequest("Email already verified");

  // 60s cooldown between resends
  if (user.resendOTPAt) {
    const secondsElapsed = (Date.now() - new Date(user.resendOTPAt).getTime()) / 1000;
    if (secondsElapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsElapsed);
      throw ApiError.badRequest(
        `Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting a new code.`
      );
    }
  }

  const otp = generateOTP();
  user.emailOTP = otp;
  user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.resendOTPAt = new Date();
  user.otpFailedAttempts = 0; // Reset failed attempts on new OTP
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

  const invalidErr = ApiError.unauthorized("Invalid email or password");
  if (!user) throw invalidErr;

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw ApiError.forbidden(`Account locked. Try again in ${minutesLeft} minutes.`);
  }

  if (!user.isActive) throw ApiError.forbidden("Account deactivated. Contact support.");

  if (!user.isEmailVerified) {
    throw ApiError.forbidden("Please verify your email before logging in. Check your inbox for the verification code.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalidErr;
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.cookie("token", token, cookieOptions);

  sendSuccess(res, {
    token,
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

  if (!user) {
    return sendSuccess(res, null, "If an account exists, a reset link has been sent.");
  }

  const token = generateResetToken();
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
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
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
  });
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

/* ─── DELETE /api/auth/account ───────────────────────────────────────── */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) throw ApiError.badRequest("Password is required to delete your account");

  const user = await User.findById(req.user.userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw ApiError.unauthorized("Incorrect password");

  const businessId = req.user.businessId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Promise.all([
      Order.deleteMany({ businessId }, { session }),
      Client.deleteMany({ businessId }, { session }),
      Product.deleteMany({ businessId }, { session }),
      Notification.deleteMany({ businessId }, { session }),
    ]);

    await Business.findByIdAndDelete(businessId, { session });
    await User.findByIdAndDelete(req.user.userId, { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
  });

  sendSuccess(res, null, "Your account and all associated data have been permanently deleted.");
});