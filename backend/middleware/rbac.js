const { adminOnly } = require("./auth");

// Check if user is admin
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
  next();
}

// Check if user is contributor or admin
function isContributor(req, res, next) {
  if (req.user.role !== "contributor" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Contributor access required",
    });
  }
  next();
}

module.exports = { isAdmin, isContributor };