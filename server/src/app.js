import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./models/Order.js";
import orderRoutes from "./routes/order.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import cron from "node-cron"; 
import { createTomorrowDeliveryNotifications } from "./services/notification.service.js"; 
import "./models/User.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

// ================= CRON JOB ================= //
// Runs every day at 08:00 AM server time
cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("🔔 Running daily notification job...");

    try {
      const result = await createTomorrowDeliveryNotifications();
      console.log(`Notifications created: ${result.created}`);
    } catch (err) {
      console.error("Error running notification job:", err);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);

// ================= RUN IMMEDIATELY ON SERVER START ================= //
// This ensures notifications for tomorrow's orders exist even if deployed after 08:00 AM
createTomorrowDeliveryNotifications()
  .then((res) => console.log("Initial Test Result:", res))
  .catch((err) => console.error("Initial Notification Error:", err));

export default app;