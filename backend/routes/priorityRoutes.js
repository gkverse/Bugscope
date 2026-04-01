const express = require("express");
const router = express.Router();
const Error = require("../models/Error");
const logger = require("../config/logger");
const { authMiddleware } = require("../middleware/auth");
const { isAdmin } = require("../middleware/rbac");
const { logActivity } = require("../middleware/activityLogger");

// PATCH /api/errors/:id/priority (admin only) - WITH ACTIVITY LOGGING
router.patch("/:id/priority", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { priority } = req.body;
    const validPriorities = ["critical", "urgent", "high", "medium", "low"];

    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: "Invalid priority. Must be: critical, urgent, high, medium, low",
      });
    }

    const error = await Error.findById(req.params.id);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: "Error not found",
      });
    }

    const oldPriority = error.priority;
    error.priority = priority;
    await error.save();

    // Log the activity
    await logActivity(
      req.user.userId,
      "priority_changed",
      error.projectId,
      error._id,
      { from: oldPriority, to: priority },
      `Changed error priority from ${oldPriority} to ${priority}`
    );

    logger.info("Error priority updated", {
      errorId: error._id,
      oldPriority,
      newPriority: priority,
      updatedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: "Priority updated",
      error: {
        id: error._id,
        priority: error.priority,
      },
    });
  } catch (error) {
    logger.error("Update priority failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to update priority",
    });
  }
});

// PATCH /api/errors/:id/status - WITH ACTIVITY LOGGING
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "investigating", "resolved", "ignored"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: new, investigating, resolved, ignored",
      });
    }

    const error = await Error.findById(req.params.id);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: "Error not found",
      });
    }

    const oldStatus = error.status;
    error.status = status;
    await error.save();

    // Log the activity
    await logActivity(
      req.user.userId,
      "status_changed",
      error.projectId,
      error._id,
      { from: oldStatus, to: status },
      `Changed error status from ${oldStatus} to ${status}`
    );

    logger.info("Error status updated", {
      errorId: error._id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: "Status updated",
      error: {
        id: error._id,
        status: error.status,
      },
    });
  } catch (error) {
    logger.error("Update status failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to update status",
    });
  }
});

// PATCH /api/errors/:id/assign (admin only) - WITH ACTIVITY LOGGING
router.patch("/:id/assign", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const error = await Error.findById(req.params.id);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: "Error not found",
      });
    }

    const oldAssignee = error.assignedTo;
    error.assignedTo = userId;
    await error.save();

    // Log the activity
    await logActivity(
      req.user.userId,
      "assigned",
      error.projectId,
      error._id,
      { from: oldAssignee, to: userId },
      `Assigned error to user ${userId}`
    );

    logger.info("Error assigned", {
      errorId: error._id,
      assignedTo: userId,
      assignedBy: req.user.userId,
    });

    res.json({
      success: true,
      message: "Error assigned",
      error: {
        id: error._id,
        assignedTo: userId,
      },
    });
  } catch (error) {
    logger.error("Assign error failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to assign error",
    });
  }
});

module.exports = router;