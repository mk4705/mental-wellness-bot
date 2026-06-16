// utils/jwtUtils.js
// Wraps jsonwebtoken so the rest of the app doesn't import it directly.
// Centralizes token configuration so changing the signing algorithm or adding
// claims requires editing one file.

const jwt = require("jsonwebtoken");

/**
 * Generate a signed JWT for a given userId.
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },                          // payload — keep it minimal
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws if invalid or expired.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
