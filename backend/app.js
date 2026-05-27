const express = require("express");
const cors = require("cors");
const app = express();

// Explicit CORS configuration
app.use(cors({
  origin: [
    "https://bugscope-theta.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.use("/api/errors", require("./routes/errorRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/invitations", require("./routes/invitationRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/auth", require("./routes/authRoutes"));

module.exports = app;