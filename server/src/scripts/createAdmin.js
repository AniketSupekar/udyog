import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const NURSERY_ID = "696f698c2aa2a682bee108a7";

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "admin2@nursery.com" });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    const user = await User.create({
      name: "Second Admin",
      email: "admin2@nursery.com",
      passwordHash,
      nurseryId: NURSERY_ID
    });

    console.log("✅ Admin created successfully");
    console.log("User ID:", user._id.toString());

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
};

createAdmin();
