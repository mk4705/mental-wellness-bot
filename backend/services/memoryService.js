// services/memoryService.js
// Handles two distinct types of memory:
//   1. Session memory   — last N messages in the current session (sliding window)
//   2. Long-term memory — structured facts extracted across sessions (MongoDB)
//
// Memory is stored per-user and persisted in MongoDB.

const Message = require("../models/Message");
const LongTermMemory = require("../models/LongTermMemory");
const { SESSION_MEMORY_WINDOW } = require("../config/constants");

const MEMORY_TYPES = new Set([
  "fact",
  "preference",
  "coping_strategy",
  "recurring_concern",
  "emotional_pattern",
]);

// Session Memory

/**
 * Fetch the last N messages from a session, formatted for the LLM.
 * Returns an array of { role, content } objects — the format Groq expects.
 *
 * @param {string} sessionId
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
const getSessionContext = async (sessionId) => {
  const messages = await Message.find({ sessionId })
    .sort({ createdAt: -1 })     // newest first so limit selects the latest N
    .limit(SESSION_MEMORY_WINDOW)
    .select("role content -_id") // only need role and content for LLM context
    .lean();                     // .lean() returns plain JS objects, faster than Mongoose docs

  // Restore chronological order before sending the conversation to the LLM.
  return messages.reverse().map((msg) => ({
    role: msg.role,    // "user" or "assistant"
    content: msg.content,
  }));
};

// Long-Term Memory

/**
 * Fetch all active long-term memory entries for a user.
 * Returns a formatted string ready to inject into the system prompt.
 *
 * @param {string} userId
 * @returns {Promise<string>} — formatted memory context string
 */
const getLongTermMemoryContext = async (userId) => {
  const memories = await LongTermMemory.find({
    userId,
    isActive: true,
  })
    .sort({ updatedAt: -1 }) // most recently updated memories first
    .limit(15)               // cap at 15 facts to avoid bloating the prompt
    .lean();

  if (memories.length === 0) return "";

  // Format as a readable list for the system prompt
  // Inject this as system context, not as a user message, so the LLM treats
  // it as background knowledge, not as conversation history.
  const lines = memories.map((m) => `- [${m.memoryType}] ${m.content}`);
  return `Known facts about this user from previous sessions:\n${lines.join("\n")}`;
};

/**
 * Save extracted memory facts to MongoDB.
 * Called by the AI service response after session analysis.
 *
 * @param {string} userId
 * @param {string} sessionId
 * @param {Array<{memoryType: string, content: string, confidence: number}>} facts
 */
const saveMemoryFacts = async (userId, sessionId, facts) => {
  if (!facts || facts.length === 0) return;

  const docs = facts
    .filter(
      (fact) =>
        MEMORY_TYPES.has(fact.memoryType) &&
        typeof fact.content === "string" &&
        fact.content.trim()
    )
    .map((fact) => ({
      userId,
      content: fact.content.trim().slice(0, 100),
      memoryType: fact.memoryType,
      confidence: Number.isFinite(fact.confidence) ? fact.confidence : 0.8,
      sourceSessionIds: [sessionId],
      isActive: true,
    }));

  if (docs.length === 0) return;

  // insertMany is more efficient than multiple .save() calls
  await LongTermMemory.insertMany(docs, { ordered: false });
};

/**
 * Soft-delete a memory entry (user-controlled privacy).
 * We soft-delete (isActive: false) instead of hard-delete so we can audit.
 *
 * @param {string} memoryId
 * @param {string} userId — ensures users can only delete their own memories
 */
const deleteMemoryEntry = async (memoryId, userId) => {
  return LongTermMemory.findOneAndUpdate(
    { _id: memoryId, userId },
    { isActive: false },
    { new: true }
  );
};

module.exports = {
  getSessionContext,
  getLongTermMemoryContext,
  saveMemoryFacts,
  deleteMemoryEntry,
};
