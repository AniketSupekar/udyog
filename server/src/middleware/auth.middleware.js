import jwt from "jsonwebtoken";

/**
 * OPTIMIZATION NOTES:
 * - Removed DB call (User.findById)
 * - JWT already contains userId + nurseryId
 * - This middleware now does ZERO database work
 * - Massive latency reduction on every protected route
 */

export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId || !decoded?.nurseryId) {
      return res.status(403).json({
        message: "User is not assigned to any nursery"
      });
    }

    req.user = {
      userId: decoded.userId,
      nurseryId: decoded.nurseryId
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};