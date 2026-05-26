import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: env.BREVO_USER,
    pass: env.BREVO_PASSWORD,
  },
});

const FROM = `"Udyog Support" <${env.BREVO_SENDER || env.BREVO_USER}>`;

export const sendVerificationEmail = async ({ to, name, otp }) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0F1117; margin-bottom: 8px;">
            Welcome, ${name}! 👋
          </h1>
          <p style="color: #6B7280; font-size: 15px; margin-bottom: 32px;">
            Your verification code is:
          </p>
          <div style="background: #EEF2FF; border: 2px solid #C7D2FE; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-size: 36px; font-weight: 700; color: #4F46E5; letter-spacing: 12px; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #9CA3AF; font-size: 13px;">
            This code expires in <strong>10 minutes</strong>. If you didn't create an account, ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${to} — messageId: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Verification email failed to ${to}:`, err.message);
    return { success: false };
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: "Reset your password",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
          <h1 style="font-size: 24px; font-weight: 700; color: #0F1117; margin-bottom: 8px;">
            Reset your password
          </h1>
          <p style="color: #6B7280; font-size: 15px; margin-bottom: 32px;">
            Hi ${name}, click the button below to reset your password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 32px;">
            Reset Password
          </a>
          <p style="color: #9CA3AF; font-size: 13px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        </div>
      `,
    });
    console.log(`✅ Reset email sent to ${to} — messageId: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Reset email failed to ${to}:`, err.message);
    return { success: false };
  }
};