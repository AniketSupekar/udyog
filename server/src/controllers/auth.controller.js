import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

/**
 * JWT already contains all runtime-required data
 * This allows middleware to avoid DB hits later
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      nurseryId: user.nurseryId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  /**
   * OPTIMIZATION:
   * - select only required fields
   * - lean() removes mongoose overhead
   */
  const user = await User.findOne({ email })
    .select("_id name email passwordHash nurseryId")
    .lean();

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      nurseryId: user.nurseryId
    }
  });
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });

  res.json({ message: "Logged out successfully" });
};

/**
 * OPTIMIZATION:
 * - No DB call
 * - Uses already-verified JWT data
 * - Zero latency endpoint
 */
export const getMe = (req, res) => {
  res.json({
    userId: req.user.userId,
    nurseryId: req.user.nurseryId
  });
};