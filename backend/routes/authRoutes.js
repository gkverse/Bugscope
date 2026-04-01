const express = require("express");
const router = express.Router();
const User = require("../models/User");
const logger = require("../config/logger");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware/auth");

// Generate JWT token
function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, projectId, role } = req.body;

    if (!email || !password || !name || !projectId) {
      return res.status(400).json({
        success: false,
        error: "email, password, name, and projectId are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const newUser = new User({
      email,
      password,
      name,
      projectId,
      role: role || "contributor",
    });

    await newUser.save();

    const token = generateToken(newUser._id, newUser.email, newUser.role);

    logger.info("User registered", {
      userId: newUser._id,
      email: newUser.email,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);
    logger.error("Registration failed", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = generateToken(user._id, user.email, user.role);

    logger.info("User logged in", {
      userId: user._id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    logger.error("Login failed", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /auth/logout 
router.post("/logout", authMiddleware, (req, res) => {
  logger.info("User logged out", {
    userId: req.user.userId,
    email: req.user.email,
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;