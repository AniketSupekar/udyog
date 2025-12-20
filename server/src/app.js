import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./models/Order.js";
import orderRoutes from "./routes/order.routes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

export default app;
