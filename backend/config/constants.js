// config/constants.js — Application-wide constants

// Crisis Detection
// Keywords are stored in a configuration file rather than hardcoded in the logic
// to allow updates to crisis detection terms independently of the core service logic.

const CRISIS_KEYWORDS = [
  // Direct self-harm
  "suicide",
  "suicidal",
  "kill myself",
  "killing myself",
  "end my life",
  "end it all",
  "take my life",
  "self harm",
  "self-harm",
  "hurt myself",
  "cut myself",
  "cutting myself",
  // Ideation phrases
  "no reason to live",
  "want to die",
  "don't want to live",
  "don't want to be here",
  "better off dead",
  "better off without me",
  "can't go on",
  "can't do this anymore",
  "not worth living",
  "life is not worth",
  // Hopelessness
  "no hope",
  "nobody cares",
  "everyone hates me",
  "i am worthless",
  "i am nothing",
];

// The crisis response message — shown instead of the LLM reply
const CRISIS_RESPONSE = `I'm really sorry you're feeling this way right now. What you're going through sounds incredibly painful, and I want you to know that you are not alone.

Please reach out to a crisis support line — trained counselors are available to help, right now:

🇮🇳 **iCall (India):** 9152987821 — Mon–Sat, 8am–10pm
🇮🇳 **AASRA:** 91-9820466627 — Available 24/7
🌍 **International Association for Suicide Prevention:** https://www.iasp.info/resources/Crisis_Centres/

If you are in immediate danger, please call your local emergency number (112 in India) or go to your nearest hospital.

If you'd like, you can also talk to someone you trust — a family member, friend, or teacher. You deserve support from real people who care about you.

I'm here if you want to keep talking.`;

// Session Config
// How many recent messages to include in the LLM context window
const SESSION_MEMORY_WINDOW = 10;

// How many messages trigger a long-term memory extraction
const MEMORY_EXTRACTION_THRESHOLD = 8;

// AI Service
const AI_SERVICE_TIMEOUT_MS = 120000; // 2 minutes before giving up on AI call

module.exports = {
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE,
  SESSION_MEMORY_WINDOW,
  MEMORY_EXTRACTION_THRESHOLD,
  AI_SERVICE_TIMEOUT_MS,
};
