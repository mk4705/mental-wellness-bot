// middleware/rateLimiter.js
// Security: rate limiting prevents brute-force attacks on authentication endpoints
// and API abuse on chat endpoints. In a multi-instance production environment,
// a distributed store like Redis should be configured.

const rateLimit = require("express-rate-limit");

// Auth limiter: strict — prevents brute-forcing passwords
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 login attempts per IP per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,  // sends RateLimit-* headers (useful for clients)
  legacyHeaders: false,
});

// Chat limiter: relaxed — normal users send many messages
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.CHAT_RATE_LIMIT) || 50,
  message: {
    success: false,
    message: "You're sending messages too quickly. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, chatLimiter };
