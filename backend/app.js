// app.js — Express application configuration
// Separated from server.js so the app is importable in tests

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const chatRoutes = require("./routes/chatRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
// Middleware

// CORS: allow requests from the React dev server and production frontend
app.use(
  cors({
    origin: [
      "http://localhost:3000", // React dev
      process.env.FRONTEND_URL, // production URL
    ].filter(Boolean),
    credentials: true,
  })
);

// Parse incoming JSON bodies
app.use(express.json());

// HTTP request logging (skip in test env to keep output clean)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check
// Simple ping endpoint — useful for uptime monitors and deployment checks
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/memory", memoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
// Must have 4 params for Express to recognize it as an error handler
app.use(errorHandler);

module.exports = app;
