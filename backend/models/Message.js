// models/Message.js
// Stores message data including role, content, emotion predictions,
// retrieved chunks (for RAG auditability), crisis flags, and response times.

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // allows user-level message queries without joining through sessions
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Emotion detected on the USER's message (null for assistant messages)
    emotion: {
      label: {
        type: String,
        enum: ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"],
        default: null,
      },
      score: {
        type: Number, // confidence 0.0 – 1.0
        default: null,
      },
      // Full probability distribution from HuggingFace — stored for analytics
      rawScores: {
        type: Map,
        of: Number,
        default: null,
      },
    },
    // The knowledge base chunks that were retrieved and injected into the prompt.
    // Storing retrieved chunks enables RAG auditability and explainability,
    // keeping track of the context shown to the LLM for each response.
    retrievedChunks: [
      {
        source: String,      // original .txt filename for auditability
        sourceName: String,  // user-friendly display label
        content: String,     // the actual text chunk
        score: Number,       // retrieval relevance score
      },
    ],
    // True if crisis keywords or LLM crisis check triggered on this message
    crisisFlag: {
      type: Boolean,
      default: false,
    },
    // How long the AI pipeline took (ms) — useful for performance monitoring
    responseTimeMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching all messages in a session, in order
messageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
