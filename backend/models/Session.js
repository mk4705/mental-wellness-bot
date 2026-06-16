// models/Session.js


const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // index because we query sessions by userId very frequently
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
      maxlength: [100, "Session title cannot exceed 100 characters"],
    },
    // Tracks the most common emotion across this session's messages.
    // Computed after each message and stored here for fast dashboard queries
    // (avoids aggregating all messages every time the dashboard loads).
    dominantEmotion: {
      type: String,
      enum: ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral", "unknown"],
      default: "unknown",
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // LLM-generated summary of the session, used for long-term memory extraction
    sessionSummary: {
      type: String,
      default: "",
    },
    // Whether long-term memory has been extracted from this session already
    memoryExtracted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for the most common query: "all sessions for user X, newest first"
sessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Session", sessionSchema);
