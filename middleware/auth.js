const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // FIX: Map userId from token to _id and id
    req.user = {
      _id: decoded.userId,  // ← Convert userId to _id
      id: decoded.userId,   // ← Also set id
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    logger.error("Auth verification failed", { error: error.message });
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };