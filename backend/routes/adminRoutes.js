const express = require("express");
const router = express.Router();
const Error = require("../models/Error");
const ActivityLog = require("../models/ActivityLog");
const logger = require("../config/logger");
const { authMiddleware } = require("../middleware/auth");
const { isAdmin } = require("../middleware/rbac");

// GET /api/admin/activity-logs (admin only)
router.get("/activity-logs", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { projectId, limit = 50, skip = 0 } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "projectId is required",
      });
    }

    const logs = await ActivityLog.find({ projectId })
      .populate("userId", "name email")
      .populate("errorId", "message")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ActivityLog.countDocuments({ projectId });

    logger.info("Activity logs fetched", {
      projectId,
      admin: req.user.userId,
      count: logs.length,
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + parseInt(limit) < total,
      },
    });
  } catch (error) {
    logger.error("Fetch activity logs failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity logs",
    });
  }
});

// GET /api/admin/stats/:projectId (admin only - detailed stats)
router.get("/stats/:projectId", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { projectId } = req.params;

    const severityStats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: "$severity",
          count: { $sum: "$count" },
        },
      },
    ]);

    const priorityStats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: "$count" },
        },
      },
    ]);

    const statusStats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: "$count" },
        },
      },
    ]);

    const environmentStats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: "$environment",
          count: { $sum: "$count" },
        },
      },
    ]);

    const formatStats = (stats) => {
      const result = {};
      stats.forEach((stat) => {
        result[stat._id] = stat.count;
      });
      return result;
    };

    logger.info("Stats fetched", {
      projectId,
      admin: req.user.userId,
    });

    res.json({
      success: true,
      projectId,
      stats: {
        bySeverity: formatStats(severityStats),
        byPriority: formatStats(priorityStats),
        byStatus: formatStats(statusStats),
        byEnvironment: formatStats(environmentStats),
      },
    });
  } catch (error) {
    logger.error("Fetch stats failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
    });
  }
});

module.exports = router;