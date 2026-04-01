const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Error = require('../models/Error');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const logger = require('../config/logger');

// POST /api/errors/:id/comments - Add a comment to an error
router.post('/errors/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const errorId = req.params.id;

    // Validate input
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    // Check if error exists
    const error = await Error.findById(errorId);
    if (!error) {
      return res.status(404).json({ success: false, message: 'Error not found' });
    }

    // Get user from database to get complete user info
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Create comment
    const comment = new Comment({
      content: content.trim(),
      author: userId,
      authorName: user.name,
      authorEmail: user.email,
      errorId: errorId,
    });

    await comment.save();

    // Log activity with correct signature
    try {
      await logActivity(
        userId,
        'comment_added',
        error.projectId,
        errorId,
        {
          commentId: comment._id,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        },
        `Added comment on error`
      );
    } catch (logError) {
      logger.error('Activity logging failed (non-blocking)', { error: logError.message });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: {
        _id: comment._id,
        content: comment.content,
        author: comment.authorName,
        authorEmail: comment.authorEmail,
        errorId: comment.errorId,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error adding comment', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// GET /api/errors/:id/comments - Get all comments for an error
router.get('/errors/:id/comments', authMiddleware, async (req, res) => {
  try {
    const errorId = req.params.id;

    // Check if error exists
    const error = await Error.findById(errorId);
    if (!error) {
      return res.status(404).json({ success: false, message: 'Error not found' });
    }

    // Get comments sorted by newest first
    const comments = await Comment.find({ errorId: errorId })
      .sort({ createdAt: -1 })
      .select('content author authorName authorEmail errorId createdAt updatedAt')
      .lean();

    logger.info('Comments fetched', { errorId, count: comments.length });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments: comments,
    });
  } catch (error) {
    logger.error('Error fetching comments', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// DELETE /api/comments/:id - Delete own comment
router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id || req.user.id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the author or admin
    if (comment.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    // Get error details for logging
    const error = await Error.findById(comment.errorId);

    // Delete comment
    await Comment.findByIdAndDelete(commentId);

    // Log activity with correct signature
    try {
      await logActivity(
        userId,
        'comment_deleted',
        error ? error.projectId : 'unknown',
        comment.errorId,
        {
          commentId: commentId,
        },
        `Deleted comment from error`
      );
    } catch (logError) {
      logger.error('Activity logging failed (non-blocking)', { error: logError.message });
    }

    logger.info('Comment deleted', { commentId, errorId: comment.errorId });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting comment', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router;