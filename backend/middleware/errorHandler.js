// middleware/errorHandler.js
//
// Central error handler for all unhandled Express errors.
// Centralized error handling formatting and logging.
//
// Rules:
//   - Always log the full stack trace server-side
//   - Never expose internal error details to clients in production
//   - Map known Mongoose errors to useful HTTP responses

const errorHandler = (err, req, res, next) => {
  // Always log the full error server-side for debugging
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.path}\n`, err);
  } else {
    // In production: log message only (no stack trace in server output)
    console.error(`[ERROR] ${req.method} ${req.path}: ${err.message}`);
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors: messages });
  }

  // Unique constraint violations
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`,
    });
  }

  // Cast errors (invalid ObjectIds)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: "${err.value}"`,
    });
  }

  // Default internal server error fallback
  res.status(err.statusCode || 500).json({
    success: false,
    message: isDev
      ? (err.message || "Internal server error")
      : "Something went wrong. Please try again.",
  });
};

module.exports = errorHandler;
