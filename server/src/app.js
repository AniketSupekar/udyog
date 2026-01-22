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
import dashboardRoutes from "./routes/dashboard.routes.js";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",")
  : [];

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173"); // add dev frontend
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // server-to-server, Postman, cron
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn("Blocked CORS for origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);


app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

if (process.env.NODE_ENV !== "production") {
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log("🔔 Running daily notification job (DEV)...");
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
}

createTomorrowDeliveryNotifications()
  .then((res) => console.log("Initial Test Result:", res))
  .catch((err) => console.error("Initial Notification Error:", err));

// In production, your scheduler can hit this endpoint at 08:00
app.post("/api/notifications/run", async (req, res) => {
  try {
    const result = await createTomorrowDeliveryNotifications();
    console.log("🔔 Platform-scheduler triggered notifications:", result);
    res.json({ success: true, created: result.created });
  } catch (err) {
    console.error("Error triggering notifications:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;