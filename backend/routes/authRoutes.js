// routes/authRoutes.js
const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe, updatePreferences } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Validation rules — express-validator checks these before the controller runs
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", authLimiter, registerValidation, register);
router.post("/login",    authLimiter, loginValidation,    login);
router.get("/me",        protect,                         getMe);
router.patch("/preferences", protect,                     updatePreferences);

module.exports = router;
