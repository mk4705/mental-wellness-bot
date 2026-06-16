// controllers/authController.js
// Handles user registration, login, and profile retrieval.
// Controllers validate input, orchestrate models and services, and format
// HTTP responses.

const { validationResult } = require("express-validator");
const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");

/**
 * POST /api/v1/auth/register
 * Creates a new user account.
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { username, email, password } = req.body;

    const user = new User({
      username,
      email,
      passwordHash: password,
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticates a user and returns a JWT.
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Explicitly select passwordHash since it is excluded by default in the schema
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    user.lastActiveAt = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Returns the current user's profile. Requires auth middleware.
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};

/**
 * PATCH /api/v1/auth/preferences
 * Update user theme or crisis contact email.
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { theme, crisisContactEmail } = req.body;
    const updates = {};

    if (theme) updates["preferences.theme"] = theme;
    if (crisisContactEmail !== undefined)
      updates["preferences.crisisContactEmail"] = crisisContactEmail;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updatePreferences };
