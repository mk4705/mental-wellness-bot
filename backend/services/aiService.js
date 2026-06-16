// services/aiService.js
//
// HTTP client that calls the Python FastAPI AI microservice.
//
// The Node backend coordinates user management, sessions, and persistence,
// while the Python service processes machine learning tasks. This allows the
// services to scale independently.

const axios = require("axios");
const { AI_SERVICE_TIMEOUT_MS } = require("../config/constants");

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const MEMORY_TYPES = new Set([
  "fact",
  "preference",
  "coping_strategy",
  "recurring_concern",
  "emotional_pattern",
]);

// Single reusable Axios instance — shares connection pool and config
const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: AI_SERVICE_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Log every AI service error with the response body (critical for debugging)
aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const body    = JSON.stringify(error.response?.data ?? {});
    const message = error.message;
    console.error(`[aiService] HTTP ${status ?? "network"} error: ${message} — body: ${body}`);
    return Promise.reject(error);
  }
);

/**
 * POST /chat on the AI service.
 * Returns the full pipeline result: reply, emotion, retrieved_chunks, etc.
 *
 * @param {{ userMessage: string, sessionHistory: Array, longTermContext: string }} payload
 */
const getAIResponse = async ({ userMessage, sessionHistory, longTermContext }) => {
  const response = await aiClient.post("/chat", {
    user_message:      userMessage,
    session_history:   sessionHistory,
    long_term_context: longTermContext,
  });
  return response.data;
};

/**
 * POST /extract-memory on the AI service.
 * Fire-and-forget from chatController — called in a setImmediate block.
 *
 * @param {string} sessionId
 * @param {Array<{role: string, content: string}>} messages
 */
const extractMemoryFacts = async (sessionId, messages) => {
  const response = await aiClient.post("/extract-memory", {
    session_id: sessionId,
    messages,
  });

  const facts = Array.isArray(response.data.facts) ? response.data.facts : [];
  return facts
    .filter((fact) => MEMORY_TYPES.has(fact.memory_type))
    .map((fact) => ({
      memoryType: fact.memory_type,
      content: typeof fact.content === "string" ? fact.content.trim().slice(0, 100) : "",
      confidence: Number(fact.confidence),
    }))
    .filter(
      (fact) =>
        fact.content &&
        Number.isFinite(fact.confidence) &&
        fact.confidence >= 0 &&
        fact.confidence <= 1
    );
};

/**
 * GET /health — verify the AI service is reachable before serving requests.
 * @returns {Promise<boolean>}
 */
const checkAIServiceHealth = async () => {
  try {
    await aiClient.get("/health", { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

module.exports = { getAIResponse, extractMemoryFacts, checkAIServiceHealth };
