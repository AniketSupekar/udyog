import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "_id nurseryId"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.nurseryId) {
      return res.status(403).json({
        message: "User is not assigned to any nursery"
      });
    }

    req.user = {
      userId: user._id,
      nurseryId: user.nurseryId
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};