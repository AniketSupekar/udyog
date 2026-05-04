// src/app.js
import "./config/env.js";
import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import authRoutes        from "./modules/auth/auth.routes.js";
import orderRoutes       from "./modules/orders/order.routes.js";
import dashboardRoutes   from "./modules/dashboard/dashboard.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import businessRoutes    from "./modules/business/business.routes.js";
import paymentRoutes     from "./modules/payments/payment.routes.js";
import productRoutes     from "./modules/products/product.routes.js";
import analyticsRoutes   from "./modules/analytics/analytics.routes.js";
import clientRoutes      from "./modules/clients/client.routes.js";

import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiLimiter, authLimiter, cronLimiter } from "./middleware/rateLimiter.middleware.js";
import { createTomorrowDeliveryNotifications } from "./modules/notifications/notification.service.js";
import Business from "./models/Business.js";

connectDB();

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN?.split(",") || []),
  ...(env.isDev ? ["http://localhost:5173", "http://localhost:5174"] : []),
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.warn("Blocked CORS from:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/health", (req, res) =>
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() })
);

// ─── Routes ───────────────────────────────────────────────────────────
app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/business",      businessRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/clients",       clientRoutes);

// ─── Cron ─────────────────────────────────────────────────────────────
app.post("/api/cron/notifications", cronLimiter, async (req, res, next) => {
  try {
    const businesses = await Business.find({ isActive: true }, "_id");
    let totalCreated = 0;
    for (const b of businesses) {
      const r = await createTomorrowDeliveryNotifications(b._id);
      totalCreated += r.created;
    }
    res.json({ success: true, created: totalCreated });
  } catch (err) { next(err); }
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;