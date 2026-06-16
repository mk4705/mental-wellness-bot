// models/LongTermMemory.js
// Stores extracted memory facts in MongoDB to provide persistent, per-user, and
// queryable context. Storing structured facts instead of raw transcripts improves
// storage efficiency and provides cleaner context for the LLM.

const mongoose = require("mongoose");

const longTermMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Category helps us inject only relevant memory for each new session
    memoryType: {
      type: String,
      enum: [
        "fact",
        "preference",
        "coping_strategy",
        "recurring_concern",
        "emotional_pattern",
      ],
      required: true,
    },
    // The actual memory content — a concise, human-readable sentence
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Confidence score — higher means the LLM was more certain about this fact
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
    // Which sessions this memory was extracted from (for audit / deletion cascade)
    sourceSessionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    // Users can delete their own memory entries (privacy control)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fetch all active memories for a user — the most common query
longTermMemorySchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("LongTermMemory", longTermMemorySchema);
