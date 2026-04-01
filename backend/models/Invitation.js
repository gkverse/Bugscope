const mongoose = require("mongoose");
const crypto = require("crypto");

const invitationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);