import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["ADMIN", "STAFF"],
      default: "ADMIN",
    },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailOTP: { type: String, select: false },
    emailOTPExpiry: { type: Date, select: false },

    // OTP brute force protection — resets on each new OTP issued
    otpFailedAttempts: { type: Number, default: 0, select: false },

    // Resend cooldown — timestamp of last OTP send
    resendOTPAt: { type: Date, default: null, select: false },

    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // Login brute force protection
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    onboardingCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.index({ businessId: 1, role: 1 });
userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);