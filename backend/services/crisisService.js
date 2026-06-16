// services/crisisService.js
// Extracted into its own service to support multiple detection methods.
// Fast keyword check runs first (zero latency, zero cost).

const { CRISIS_KEYWORDS, CRISIS_RESPONSE } = require("../config/constants");

/**
 * Layer 1: Fast keyword scan.
 * Checks the message text against the crisis keyword list.
 * Returns true immediately on first match (no need to scan all keywords).
 *
 * @param {string} text - user's message
 * @returns {boolean}
 */
const containsCrisisKeyword = (text) => {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
};

/**
 * Main crisis check entry point.
 * Returns a result object so the controller can decide what to do.
 *
 * @param {string} userMessage
 * @returns {{ isCrisis: boolean, response: string | null, method: string }}
 */
const checkForCrisis = (userMessage) => {
  const keywordTriggered = containsCrisisKeyword(userMessage);

  if (keywordTriggered) {
    return {
      isCrisis: true,
      response: CRISIS_RESPONSE,
      method: "keyword", // for logging / analytics
    };
  }

  return {
    isCrisis: false,
    response: null,
    method: null,
  };
};

module.exports = { checkForCrisis, containsCrisisKeyword };
