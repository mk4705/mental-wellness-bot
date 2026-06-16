// controllers/feedbackController.js
const { validationResult } = require("express-validator");
const Feedback = require("../models/Feedback");

/**
 * POST /api/v1/feedback
 * Submit a rating for a bot message.
 */
const submitFeedback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { messageId, sessionId, rating, category, comment } = req.body;

    // upsert: update if feedback already exists for this message, else create
    const feedback = await Feedback.findOneAndUpdate(
      { userId: req.user._id, messageId },
      { userId: req.user._id, messageId, sessionId, rating, category, comment },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/feedback/summary
 * Returns aggregated feedback stats for the dashboard.
 */
const getFeedbackSummary = async (req, res, next) => {
  try {
    const summary = await Feedback.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          positiveCount: {
            $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] },
          },
          negativeCount: {
            $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      summary: summary[0] || {
        totalFeedback: 0,
        avgRating: null,
        positiveCount: 0,
        negativeCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitFeedback, getFeedbackSummary };
