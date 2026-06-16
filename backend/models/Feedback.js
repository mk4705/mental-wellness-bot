// models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    // 1 = thumbs down, 5 = thumbs up (we keep 1-5 scale for future granularity)
    rating: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    // Category of feedback (e.g., helpfulness, accuracy) to identify systematic issues.
    category: {
      type: String,
      enum: ["helpful", "inaccurate", "unhelpful", "harmful", "other"],
      default: "other",
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from submitting feedback on the same message twice
feedbackSchema.index({ userId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
