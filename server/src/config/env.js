// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_ORIGIN",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  REDIS_LOCAL_URL: process.env.REDIS_LOCAL_URL || "",
  REDIS_PROD_URL: process.env.REDIS_PROD_URL || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM: process.env.RESEND_FROM || "",
  BREVO_USER: process.env.BREVO_USER || "",
  BREVO_PASSWORD: process.env.BREVO_PASSWORD || "",
  BREVO_SENDER: process.env.BREVO_SENDER || "",
  APP_URL: process.env.APP_URL || "http://localhost:5173",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  isProd,
  isDev: !isProd,
};