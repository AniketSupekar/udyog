import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./models/Order.js";
import orderRoutes from "./routes/order.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import cron from "node-cron"; 
import { createTomorrowDeliveryNotifications } from "./services/notification.service.js"; 

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

// ================= CRON JOB ================= //
// Runs every day at 08:00 AM server time
// cron.schedule("0 8 * * *", async () => {
//   console.log("🔔 Running daily notification job...");

//   try {
//     const result = await createTomorrowDeliveryNotifications();
//     console.log(`Notifications created: ${result.created}`);
//   } catch (err) {
//     console.error("Error running notification job:", err);
//   }
// });

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


createTomorrowDeliveryNotifications().then(res => console.log("Test Result:", res));

export default app;