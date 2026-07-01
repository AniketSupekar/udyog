import "./config/env.js";
import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import authRoutes          from "./modules/auth/auth.routes.js";
import orderRoutes         from "./modules/orders/order.routes.js";
import dashboardRoutes     from "./modules/dashboard/dashboard.routes.js";
import notificationRoutes  from "./modules/notifications/notification.routes.js";
import businessRoutes      from "./modules/business/business.routes.js";
import paymentRoutes       from "./modules/payments/payment.routes.js";
import productRoutes       from "./modules/products/product.routes.js";
import analyticsRoutes     from "./modules/analytics/analytics.routes.js";
import clientRoutes        from "./modules/clients/client.routes.js";
import payRoutes           from "./modules/pay/pay.routes.js";
import storeRoutes         from "./modules/store/store.routes.js";
import expenseRoutes       from "./modules/expenses/expense.routes.js";

import { globalErrorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { sanitizeInput } from "./middleware/sanitize.middleware.js";
import { apiLimiter, authLimiter, cronLimiter } from "./middleware/rateLimiter.middleware.js";
import { createTomorrowDeliveryNotifications, createOverdueOrderNotifications } from "./modules/notifications/notification.service.js";
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
app.options("*", cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.use(mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key "${key}" from ${req.method} ${req.path}`);
  },
}));
app.use(sanitizeInput);

app.use("/api", apiLimiter);

app.get("/health", (req, res) =>
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() })
);

app.use("/api/v1/auth",          authLimiter, authRoutes);
app.use("/api/v1/orders",        orderRoutes);
app.use("/api/v1/dashboard",     dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/business",      businessRoutes);
app.use("/api/v1/payments",      paymentRoutes);
app.use("/api/v1/products",      productRoutes);
app.use("/api/v1/analytics",     analyticsRoutes);
app.use("/api/v1/clients",       clientRoutes);
app.use("/api/v1/pay",           payRoutes);
app.use("/api/v1/store",         storeRoutes);
app.use("/api/v1/expenses",      expenseRoutes);

app.post("/api/cron/notifications", cronLimiter, async (req, res, next) => {
  try {
    const businesses = await Business.find({ isActive: true }, "_id");
    let deliveryCreated = 0;
    let overdueCreated = 0;
 
    for (const b of businesses) {
      const [d, o] = await Promise.all([
        createTomorrowDeliveryNotifications(b._id),
        createOverdueOrderNotifications(b._id),
      ]);
      deliveryCreated += d.created;
      overdueCreated += o.created;
    }
 
    res.json({ success: true, deliveryCreated, overdueCreated });
  } catch (err) { next(err); }
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;