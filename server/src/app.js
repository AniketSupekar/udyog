import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cron from "node-cron";

import "./models/Order.js";
import "./models/User.js";

import orderRoutes from "./routes/order.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { createTomorrowDeliveryNotifications } from "./services/notification.service.js";
import Nursery from "./models/Nursery.js";

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

/* =======================
   CORS
======================= */
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : [];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn("❌ Blocked CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

/* =======================
   ROUTES
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

/* =======================
   DEV CRON (local only)
======================= */
if (process.env.NODE_ENV !== "production") {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("🔔 DEV: Running daily notification job");
      try {
        const nurseries = await Nursery.find({}, "_id");

        for (const nursery of nurseries) {
          await createTomorrowDeliveryNotifications(nursery._id);
        }

        console.log("✅ DEV notification job completed");
      } catch (err) {
        console.error("❌ DEV cron error:", err);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
}

/* =======================
   PROD SCHEDULER ENDPOINT
======================= */
app.post("/api/notifications/run", async (req, res) => {
  try {
    const nurseries = await Nursery.find({}, "_id");
    let totalCreated = 0;

    for (const nursery of nurseries) {
      const result = await createTomorrowDeliveryNotifications(nursery._id);
      totalCreated += result.created;
    }

    console.log("🔔 PROD scheduler ran:", totalCreated);

    res.json({
      success: true,
      created: totalCreated
    });
  } catch (err) {
    console.error("❌ PROD scheduler error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default app;