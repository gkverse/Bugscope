const ActivityLog = require("../models/ActivityLog");

async function logActivity(userId, action, projectId, errorId, changes, description) {
  try {
    const log = new ActivityLog({
      userId,
      action,
      projectId,
      errorId,
      changes,
      description,
    });

    await log.save();
  } catch (error) {
    console.error("Activity logging failed:", error);
  }
}

module.exports = { logActivity };