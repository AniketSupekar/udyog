// src/config/email.js
// Email sending via Resend — transactional emails only
// Resend free tier: 3000 emails/month — enough to start

import { Resend } from "resend";
import { env } from "./env.js";

const resend = new Resend(env.RESEND_API_KEY);

const FROM = "onboarding@resend.dev";

/**
 * Send email verification OTP
 */
export const sendVerificationEmail = async ({ to, name, otp }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your email address",
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0F1117; margin-bottom: 8px;">
            Welcome, ${name}! 👋
          </h1>
          <p style="color: #6B7280; font-size: 15px; margin-bottom: 32px;">
            Your verification code is:
          </p>
          <div style="background: #F0FDF4; border: 2px solid #86EFAC; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 700; color: #15803D; letter-spacing: 12px; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #9CA3AF; font-size: 13px;">
            This code expires in <strong>10 minutes</strong>. If you didn't create an account, ignore this email.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { success: false };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0F1117; margin-bottom: 8px;">
            Reset your password
          </h1>
          <p style="color: #6B7280; font-size: 15px; margin-bottom: 32px;">
            Hi ${name}, click the button below to reset your password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #16A34A; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 32px;">
            Reset Password
          </a>
          <p style="color: #9CA3AF; font-size: 13px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { success: false };
  }
};