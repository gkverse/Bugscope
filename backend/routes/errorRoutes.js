const express = require('express');
const router = express.Router();
const Error = require('../models/Error');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const { logActivity } = require('../middleware/activityLogger');
const errorGrouper = require('../utils/errorGrouping');
const { explainError } = require('../utils/aiExplainer');
const logger = require('../config/logger');

// POST /api/errors/log - Log a new error
router.post('/log', authMiddleware, async (req, res) => {
  try {
    const { message, stack, projectId, severity, environment } = req.body;

    // Validate input
    if (!message || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Message and projectId are required',
      });
    }

    // Use the errorGrouper instance
    const normalized = errorGrouper.normalize(message);
    const groupingKey = errorGrouper.generateGroupingKey(message, stack);

    // Check if similar error exists
    let error = await Error.findOne({ groupingKey });

    if (error) {
      // Increment count for existing error
      error.count += 1;
      error.lastOccurrence = new Date();
      await error.save();

      logger.info('Error count incremented', { groupingKey, count: error.count });

      return res.status(200).json({
        success: true,
        message: 'Error logged (grouped)',
        error: {
          _id: error._id,
          message: error.message,
          count: error.count,
          groupingKey: error.groupingKey,
        },
      });
    }

    // Create new error
    error = new Error({
      message,
      normalizedMessage: normalized,
      groupingKey,
      stack: stack || 'No stack trace provided',
      projectId,
      severity: severity || 'medium',
      environment: environment || 'production',
      status: 'new',
      priority: 'medium',
      count: 1,
    });

    await error.save();

    logger.info('Error logged', { errorId: error._id, groupingKey });

    res.status(201).json({
      success: true,
      message: 'Error logged successfully',
      error: {
        _id: error._id,
        message: error.message,
        severity: error.severity,
        environment: error.environment,
        count: error.count,
        groupingKey: error.groupingKey,
      },
    });
  } catch (error) {
    logger.error('Error logging failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/errors - Get all errors with advanced filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      projectId,
      severity,
      priority,
      status,
      environment,
      limit = 50,
      page = 1,
    } = req.query;

    // Build filter object
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (environment) filter.environment = environment;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get errors with filter
    const errors = await Error.find(filter)
      .sort({ lastOccurrence: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-stack -aiExplanation')
      .lean();

    // Get total count
    const total = await Error.countDocuments(filter);

    logger.info('Errors fetched with filters', { filter, count: errors.length });

    res.status(200).json({
      success: true,
      count: errors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      errors,
    });
  } catch (error) {
    logger.error('Error fetching errors', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/errors/:id - Get single error details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const error = await Error.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .lean();

    if (!error) {
      return res.status(404).json({
        success: false,
        message: 'Error not found',
      });
    }

    logger.info('Error fetched', { errorId: req.params.id });

    res.status(200).json({
      success: true,
      error,
    });
  } catch (error) {
    logger.error('Error fetching single error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/errors/:id/details - Get error with complete timeline (error + comments + activity)
router.get('/:id/details', authMiddleware, async (req, res) => {
  try {
    const errorId = req.params.id;

    // Get error
    const error = await Error.findById(errorId)
      .populate('assignedTo', 'name email role')
      .lean();

    if (!error) {
      return res.status(404).json({ success: false, message: 'Error not found' });
    }

    // Get comments
    const comments = await Comment.find({ errorId: errorId })
      .sort({ createdAt: -1 })
      .select('content author authorName authorEmail errorId createdAt updatedAt')
      .lean();

    // Get activity logs related to this error
    const activities = await ActivityLog.find({
      'metadata.errorId': errorId,
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Combine into timeline
    const timeline = [];

    // Add error creation event
    timeline.push({
      type: 'error_created',
      timestamp: error.createdAt,
      title: 'Error Created',
      description: `${error.message} in ${error.environment}`,
      user: null,
      data: {
        severity: error.severity,
        environment: error.environment,
        count: error.count,
      },
    });

    // Add activity logs to timeline
    activities.forEach((activity) => {
      timeline.push({
        type: 'activity',
        timestamp: activity.createdAt,
        title: activity.action,
        description: activity.description,
        user: activity.userId ? activity.userId.name : 'System',
        userEmail: activity.userId ? activity.userId.email : null,
        data: activity.metadata,
      });
    });

    // Add comments to timeline
    comments.forEach((comment) => {
      timeline.push({
        type: 'comment',
        timestamp: comment.createdAt,
        title: 'Comment Added',
        description: comment.content,
        user: comment.authorName,
        userEmail: comment.authorEmail,
        data: {
          commentId: comment._id,
        },
      });
    });

    // Sort timeline by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    logger.info('Error details fetched', { errorId });

    res.status(200).json({
      success: true,
      data: {
        error: {
          _id: error._id,
          message: error.message,
          severity: error.severity,
          priority: error.priority,
          status: error.status,
          environment: error.environment,
          count: error.count,
          assignedTo: error.assignedTo,
          stack: error.stack,
          aiExplanation: error.aiExplanation,
          suggestedFixes: error.suggestedFixes,
          createdAt: error.createdAt,
          updatedAt: error.updatedAt,
        },
        comments: {
          count: comments.length,
          data: comments,
        },
        timeline: {
          count: timeline.length,
          events: timeline,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching error details', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/errors/:id/explain - Get AI explanation and fixes
router.post('/:id/explain', authMiddleware, async (req, res) => {
  try {
    const errorId = req.params.id;

    const error = await Error.findById(errorId);
    if (!error) {
      return res.status(404).json({
        success: false,
        message: 'Error not found',
      });
    }

    // Check if already explained
    if (error.aiExplanation) {
      return res.status(200).json({
        success: true,
        message: 'Explanation already available',
        explanation: error.aiExplanation,
        suggestedFixes: error.suggestedFixes,
      });
    }

    // Get explanation from AI
    const { explanation, fixes } = await explainError(error.message, error.stack);

    // Save to database
    error.aiExplanation = explanation;
    error.suggestedFixes = fixes;
    await error.save();

    logger.info('Error explained', { errorId });

    res.status(200).json({
      success: true,
      message: 'Explanation generated',
      explanation,
      suggestedFixes: fixes,
    });
  } catch (error) {
    logger.error('Error explanation failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/errors/stats/:projectId - Get error statistics
router.get('/stats/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = await Error.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          totalErrors: { $sum: 1 },
          totalOccurrences: { $sum: '$count' },
          bySeverity: {
            $push: {
              severity: '$severity',
              count: '$count',
            },
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: '$count',
            },
          },
          byStatus: {
            $push: {
              status: '$status',
              count: '$count',
            },
          },
          byEnvironment: {
            $push: {
              environment: '$environment',
              count: '$count',
            },
          },
        },
      },
    ]);

    logger.info('Stats fetched', { projectId });

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalErrors: 0,
        totalOccurrences: 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;