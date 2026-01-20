import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Nursery from "../models/Nursery.js";

dotenv.config();

const createNursery = async () => {
  try {
    await connectDB();

    const nursery = await Nursery.create({
      name: "Example Nursery",
      phone: "9999999999",
      address: "Pune, India",
      subscriptionPlan: "FREE",
      isActive: true
    });

    console.log("✅ Nursery created successfully");
    console.log("Nursery ID:", nursery._id.toString());

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating nursery:", error);
    process.exit(1);
  }
};

createNursery();
