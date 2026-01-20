import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js"; // adjust path if needed

dotenv.config();

const NURSERY_ID = "696f060ad711972a0ee22f13";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await User.updateMany(
      { nurseryId: { $exists: false } },
      { $set: { nurseryId: new mongoose.Types.ObjectId(NURSERY_ID) } }
    );

    console.log("Migration success:");
    console.log(result);

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
