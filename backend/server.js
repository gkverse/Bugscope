const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const connectDB = require("./config/db");
const errorRoutes = require("./routes/errorRoutes");
const authRoutes = require("./routes/authRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const commentRoutes = require('./routes/commentRoutes');
const priorityRoutes = require("./routes/priorityRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const logger = require("./config/logger");

const app = express();

connectDB();

app.use(express.json());

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://bugscope-theta.vercel.app", 
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// RATE LIMITING
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const errorLogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: "Too many error logs from this IP, please try again after 1 minute",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api/errors/log", errorLogLimiter);

// ROUTES
app.use("/api/errors", errorRoutes);
app.use("/api/errors", priorityRoutes);
app.use("/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
  logger.info("Health check requested");
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});