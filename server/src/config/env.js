// src/config/env.js
import dotenv from "dotenv";
dotenv.config(); // MUST be before any process.env read

const required = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_ORIGIN",
  "REDIS_LOCAL_URL",
  "REDIS_PROD_URL",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("❌ Missing required environment variables:");
  missing.forEach((key) => console.error(`   - ${key}`));
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  REDIS_LOCAL_URL: process.env.REDIS_LOCAL_URL,
  REDIS_PROD_URL: process.env.REDIS_PROD_URL,
  isProd: process.env.NODE_ENV === "production",
  isDev: process.env.NODE_ENV !== "production",
};
