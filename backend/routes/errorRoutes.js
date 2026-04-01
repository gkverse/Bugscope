const express = require("express");
const router = express.Router();
const Error = require("../models/Error");
const logger = require("../config/logger");
const crypto = require("crypto");
const errorGrouper = require("../utils/errorGrouping");
const aiExplainer = require("../utils/aiExplainer");
const { authMiddleware } = require("../middleware/auth");
const { logActivity } = require("../middleware/activityLogger");

const VALID_SEVERITIES = ["low", "medium", "high"];
const VALID_ENVIRONMENTS = ["development", "staging", "production"];

function validateSeverity(severity) {
  if (!severity) return "medium";
  return VALID_SEVERITIES.includes(severity.toLowerCase())
    ? severity.toLowerCase()
    : "medium";
}

function validateEnvironment(environment) {
  if (!environment) return "development";
  return VALID_ENVIRONMENTS.includes(environment.toLowerCase())
    ? environment.toLowerCase()
    : "development";
}

function validateErrorInput(req) {
  const { message, stack, projectId } = req.body;
  const errors = [];

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    errors.push("message is required");
  }
  if (!stack || typeof stack !== "string" || stack.trim().length === 0) {
    errors.push("stack is required");
  }
  if (!projectId || typeof projectId !== "string" || projectId.trim().length === 0) {
    errors.push("projectId is required");
  }

  return errors;
}

// POST /api/errors/log
router.post("/log", async (req, res) => {
  try {
    const validationErrors = validateErrorInput(req);
    if (validationErrors.length > 0) {
      logger.warn("Error validation failed", { errors: validationErrors });
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    const { message, stack, projectId, severity, environment } = req.body;
    const validatedSeverity = validateSeverity(severity);
    const validatedEnvironment = validateEnvironment(environment);

    const cleanMessage = message.trim();
    const cleanStack = stack.trim();
    const cleanProjectId = projectId.trim();

    const groupingKey = errorGrouper.generateGroupingKey(cleanMessage, cleanStack);
    const errorPattern = errorGrouper.getErrorPattern(cleanMessage);

    const existingError = await Error.findOne({
      projectId: cleanProjectId,
      groupingKey,
      severity: validatedSeverity,
      environment: validatedEnvironment,
    });

    if (existingError) {
      existingError.count += 1;
      existingError.lastSeen = new Date();

      if (cleanMessage !== existingError.message) {
        const messageHash = crypto
          .createHash("md5")
          .update(cleanMessage)
          .digest("hex");

        const alreadyTracked = existingError.mergedWith.some(
          (m) => m.originalMessage === cleanMessage
        );

        if (!alreadyTracked) {
          existingError.mergedWith.push({
            messageHash,
            originalMessage: cleanMessage,
            mergedAt: new Date(),
          });
        }
      }

      await existingError.save();

      logger.info("Error logged (incremented)", {
        errorId: existingError._id,
        projectId: cleanProjectId,
        severity: validatedSeverity,
        environment: validatedEnvironment,
        count: existingError.count,
        groupingKey,
      });

      return res.status(200).json({
        success: true,
        message: "Error logged",
        errorId: existingError._id,
        count: existingError.count,
        severity: existingError.severity,
        environment: existingError.environment,
        groupingKey,
        errorPattern,
      });
    }

    const newError = new Error({
      message: cleanMessage,
      stack: cleanStack,
      projectId: cleanProjectId,
      severity: validatedSeverity,
      environment: validatedEnvironment,
      groupingKey,
      errorPattern,
      mergedWith: [],
    });

    await newError.save();

    logger.info("Error logged (new)", {
      errorId: newError._id,
      projectId: cleanProjectId,
      severity: validatedSeverity,
      environment: validatedEnvironment,
      groupingKey,
    });

    res.status(201).json({
      success: true,
      message: "Error logged successfully",
      errorId: newError._id,
      severity: newError.severity,
      environment: newError.environment,
      count: newError.count,
      groupingKey,
      errorPattern,
    });
  } catch (error) {
    logger.error("Error logging failed", {
      message: error.message,
      stack: error.stack,
    });

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
      });
    }

    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/errors (with ADVANCED FILTERING)
router.get("/", async (req, res) => {
  try {
    const {
      projectId,
      severity,
      environment,
      priority,
      status,
      limit = 50,
      skip = 0,
    } = req.query;

    if (!projectId) {
      logger.warn("Errors fetch missing projectId");
      return res.status(400).json({
        success: false,
        error: "projectId is required",
      });
    }

    // Build filter with ALL criteria
    const query = { projectId: projectId.trim() };

    if (severity) {
      query.severity = validateSeverity(severity);
    }

    if (environment) {
      query.environment = validateEnvironment(environment);
    }

    if (priority) {
      const validPriorities = ["critical", "urgent", "high", "medium", "low"];
      if (validPriorities.includes(priority.toLowerCase())) {
        query.priority = priority.toLowerCase();
      }
    }

    if (status) {
      const validStatuses = ["new", "investigating", "resolved", "ignored"];
      if (validStatuses.includes(status.toLowerCase())) {
        query.status = status.toLowerCase();
      }
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skipNum = Math.max(parseInt(skip) || 0, 0);

    const errors = await Error.find(query)
      .sort({ lastSeen: -1 })
      .limit(limitNum)
      .skip(skipNum)
      .lean();

    const total = await Error.countDocuments(query);

    const errorsWithGrouping = errors.map((err) => ({
      _id: err._id,
      message: err.message,
      errorPattern: err.errorPattern,
      groupingKey: err.groupingKey,
      count: err.count,
      severity: err.severity,
      environment: err.environment,
      priority: err.priority,
      status: err.status,
      firstSeen: err.firstSeen,
      lastSeen: err.lastSeen,
      mergedCount: err.mergedWith?.length || 0,
      mergedExamples: err.mergedWith?.slice(0, 3).map((m) => m.originalMessage),
    }));

    logger.info("Errors fetched with filters", {
      projectId,
      severity: query.severity || "all",
      environment: query.environment || "all",
      priority: query.priority || "all",
      status: query.status || "all",
      returned: errors.length,
      total,
    });

    res.json({
      success: true,
      data: errorsWithGrouping,
      pagination: {
        total,
        limit: limitNum,
        skip: skipNum,
        hasMore: skipNum + limitNum < total,
      },
    });
  } catch (error) {
    logger.error("Error fetching failed", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/errors/:id
router.get("/:id", async (req, res) => {
  try {
    const error = await Error.findById(req.params.id);

    if (!error) {
      logger.warn("Error not found", { errorId: req.params.id });
      return res.status(404).json({
        success: false,
        error: "Error not found",
      });
    }

    logger.info("Error fetched", { errorId: req.params.id });

    res.json({
      success: true,
      data: error,
    });
  } catch (error) {
    logger.error("Error fetch by ID failed", {
      errorId: req.params.id,
      message: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET /api/errors/stats/:projectId
router.get("/stats/:projectId", async (req, res) => {
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

    const environmentStats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: "$environment",
          count: { $sum: "$count" },
        },
      },
    ]);

    const formattedSeverity = { high: 0, medium: 0, low: 0, total: 0 };
    severityStats.forEach((stat) => {
      formattedSeverity[stat._id] = stat.count;
      formattedSeverity.total += stat.count;
    });

    const formattedEnvironment = { development: 0, staging: 0, production: 0, total: 0 };
    environmentStats.forEach((stat) => {
      formattedEnvironment[stat._id] = stat.count;
      formattedEnvironment.total += stat.count;
    });

    logger.info("Stats fetched", {
      projectId,
      totalErrors: formattedSeverity.total,
    });

    res.json({
      success: true,
      projectId,
      stats: {
        bySeverity: formattedSeverity,
        byEnvironment: formattedEnvironment,
      },
    });
  } catch (error) {
    logger.error("Stats fetch failed", {
      projectId: req.params.projectId,
      message: error.message,
    });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/errors/:id/explain
router.post("/:id/explain", async (req, res) => {
  try {
    const error = await Error.findById(req.params.id);

    if (!error) {
      return res.status(404).json({
        success: false,
        error: "Error not found",
      });
    }

    const aiResult = await aiExplainer.explainError(error.message, error.stack);

    if (aiResult) {
      error.aiExplanation = aiResult.explanation;
      error.aiSuggestedFixes = aiResult.suggestedFixes;
      await error.save();

      logger.info("AI explanation generated", {
        errorId: error._id,
        hasExplanation: !!aiResult.explanation,
        fixCount: aiResult.suggestedFixes.length,
      });

      return res.json({
        success: true,
        explanation: aiResult.explanation,
        suggestedFixes: aiResult.suggestedFixes,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to generate AI explanation",
    });
  } catch (error) {
    logger.error("AI explanation failed", {
      errorId: req.params.id,
      message: error.message,
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

module.exports = router;