const express = require("express");
const router = express.Router();
const User = require("../models/User");
const logger = require("../config/logger");
const { authMiddleware } = require("../middleware/auth");
const { isAdmin } = require("../middleware/rbac");
const { logActivity } = require("../middleware/activityLogger");

// GET /api/users (admin only - list all users)
router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "projectId is required",
      });
    }

    const users = await User.find({ projectId }).select("-password");

    logger.info("Users listed", {
      admin: req.user.userId,
      projectId,
      count: users.length,
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error("List users failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to list users",
    });
  }
});

// GET /api/users/:id (admin only - get single user)
router.get("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error("Get user failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
});

// PATCH /api/users/:id/role (admin only - change user role)
router.patch("/:id/role", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["admin", "contributor"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be: admin or contributor",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log the activity
    await logActivity(
      req.user.userId,
      "user_role_changed",
      user.projectId,
      null,
      { from: oldRole, to: role },
      `Changed ${user.email} role from ${oldRole} to ${role}`
    );

    logger.info("User role changed", {
      userId: user._id,
      oldRole,
      newRole: role,
      changedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: "User role updated",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Change role failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to change role",
    });
  }
});

// DELETE /api/users/:id (admin only - delete user)
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Log the activity
    await logActivity(
      req.user.userId,
      "user_deleted",
      user.projectId,
      null,
      null,
      `Deleted user ${user.email}`
    );

    logger.info("User deleted", {
      userId: user._id,
      email: user.email,
      deletedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
});

module.exports = router;