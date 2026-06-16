// routes/feedbackRoutes.js
const express = require("express");
const { body } = require("express-validator");
const { submitFeedback, getFeedbackSummary } = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

const feedbackValidation = [
  body("messageId").notEmpty().withMessage("messageId is required"),
  body("sessionId").notEmpty().withMessage("sessionId is required"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1–5"),
];

router.post("/",        feedbackValidation, submitFeedback);
router.get("/summary",                      getFeedbackSummary);

module.exports = router;
