const express = require("express");
const router = express.Router();
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const logger = require("../config/logger");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const { sendInviteEmail } = require("../utils/emailSender");

// POST /api/invitations/send (admin only)
router.post("/send", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, projectId } = req.body;

    if (!email || !projectId) {
      return res.status(400).json({
        success: false,
        error: "email and projectId are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already registered",
      });
    }

    // Check if invitation already sent
    const existingInvite = await Invitation.findOne({
      email,
      projectId,
      status: "pending",
    });

    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: "Invitation already sent to this email",
      });
    }

    const invitation = new Invitation({
      email,
      projectId,
      invitedBy: req.user.userId,
    });

    await invitation.save();

    // Send email
    const emailSent = await sendInviteEmail(email, invitation.code);

    if (!emailSent) {
      logger.warn("Email failed but invitation created", {
        invitationId: invitation._id,
        email,
      });
    }

    logger.info("Invitation sent", {
      invitationId: invitation._id,
      email,
      projectId,
      invitedBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      invitationId: invitation._id,
      code: invitation.code,
    });
  } catch (error) {
    logger.error("Send invitation failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to send invitation",
    });
  }
});

// GET /api/invitations/:code (get invite details)
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const invitation = await Invitation.findOne({ code }).populate(
      "invitedBy",
      "name email"
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found",
      });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        error: "Invitation has expired",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Invitation already ${invitation.status}`,
      });
    }

    res.json({
      success: true,
      invitation: {
        code: invitation.code,
        email: invitation.email,
        projectId: invitation.projectId,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    logger.error("Get invitation failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to get invitation",
    });
  }
});

// POST /api/invitations/:code/accept (accept invite)
router.post("/:code/accept", async (req, res) => {
  try {
    const { code } = req.params;
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "email, password, and name are required",
      });
    }

    const invitation = await Invitation.findOne({ code });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found",
      });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();

      return res.status(400).json({
        success: false,
        error: "Invitation has expired",
      });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Invitation already ${invitation.status}`,
      });
    }

    // Check if email matches
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: "Email does not match invitation",
      });
    }

    // Create user
    const newUser = new User({
      email,
      password,
      name,
      projectId: invitation.projectId,
      role: "contributor",
    });

    await newUser.save();

    // Update invitation
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = newUser._id;
    await invitation.save();

    logger.info("Invitation accepted", {
      invitationId: invitation._id,
      userId: newUser._id,
      email,
    });

    res.json({
      success: true,
      message: "Invitation accepted! Account created successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    logger.error("Accept invitation failed", { error: error.message });
    res.status(500).json({
      success: false,
      error: "Failed to accept invitation",
    });
  }
});

module.exports = router;