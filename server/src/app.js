// src/app.js
// Clean entry point — only middleware registration and route mounting
// Zero business logic here
// Order of middleware matters — do not reorder

import "./config/env.js"; // Loads .env AND validates required vars — must be first
import { env } from "./config/env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import businessRoutes from "./modules/business/business.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import productRoutes from "./modules/products/product.routes.js";

// Middleware
import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiLimiter, authLimiter, cronLimiter } from "./middleware/rateLimiter.middleware.js";

// Services
import { createTomorrowDeliveryNotifications } from "./modules/notifications/notification.service.js";
import Business from "./models/Business.js";

// Connect DB
connectDB();

const app = express();

// ─── Trust proxy (needed for Railway / Render / Heroku) ───────────────────────
app.set("trust proxy", 1);

// ─── Security headers (helmet handles XSS, clickjacking, etc.) ────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN?.split(",") || []),
  // Always allow localhost in dev
  ...(env.isDev ? ["http://localhost:5173", "http://localhost:5174"] : []),
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server (no origin) or known origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("Blocked CORS from:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health check (no auth, no rate limit) ────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);

// ─── Cron endpoint (secured with cronLimiter) ─────────────────────────────────
// Called by external scheduler (Vercel cron / uptime robot)
app.post("/api/cron/notifications", cronLimiter, async (req, res, next) => {
  try {
    const businesses = await Business.find({ isActive: true }, "_id");
    let totalCreated = 0;

    for (const business of businesses) {
      const result = await createTomorrowDeliveryNotifications(business._id);
      totalCreated += result.created;
    }

    console.log(`[CRON] Notifications created: ${totalCreated}`);
    res.json({ success: true, created: totalCreated });
  } catch (err) {
    next(err);
  }
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

export default app;