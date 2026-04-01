const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "error_created",
        "error_updated",
        "priority_changed",
        "status_changed",
        "assigned",
        "user_invited",
        "user_registered",
        "user_deleted",
        "user_role_changed"
      ],
    },
    errorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Error",
    },
    projectId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    changes: {
      from: mongoose.Schema.Types.Mixed,
      to: mongoose.Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Index for fast queries
activityLogSchema.index({ projectId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);