const mongoose = require("mongoose");

const errorSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    stack: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
      index: true,
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: "development",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["critical", "urgent", "high", "medium", "low"],
      default: "medium",
      index: true,
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    groupingKey: {
      type: String,
      required: true,
      index: true,
    },
    errorPattern: {
      type: String,
    },
    mergedWith: [
      {
        messageHash: String,
        originalMessage: String,
        mergedAt: Date,
      },
    ],
    aiExplanation: {
      type: String,
    },
    aiSuggestedFixes: [String],
    status: {
      type: String,
      enum: ["new", "investigating", "resolved", "ignored"],
      default: "new",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

errorSchema.index({
  projectId: 1,
  message: 1,
  stack: 1,
  severity: 1,
  environment: 1,
});

errorSchema.index({
  projectId: 1,
  severity: 1,
  environment: 1,
  lastSeen: -1,
});

errorSchema.index({
  projectId: 1,
  groupingKey: 1,
});

errorSchema.index({
  projectId: 1,
  priority: 1,
  lastSeen: -1,
});

module.exports = mongoose.model("Error", errorSchema);