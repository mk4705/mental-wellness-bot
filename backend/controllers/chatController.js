// controllers/chatController.js
//
// Orchestrates the full chat pipeline:
//   1. Validate input
//   2. Verify session ownership
//   3. Crisis keyword check  (fast, zero cost)
//   4. Save user message to MongoDB
//   5. Build context (session window + long-term memory)
//   6. Call Python AI microservice
//   7. Save bot reply to MongoDB
//   8. Update session metadata
//   9. Background memory extraction (fire-and-forget)
//
// This controller orchestrates the request pipeline and communicates with the
// service layer where the primary business logic is defined.

const Session      = require("../models/Session");
const Message      = require("../models/Message");
const LongTermMemory = require("../models/LongTermMemory");

const { checkForCrisis }                                 = require("../services/crisisService");
const { getSessionContext, getLongTermMemoryContext,
        saveMemoryFacts }                                 = require("../services/memoryService");
const { getAIResponse, extractMemoryFacts }              = require("../services/aiService");
const { MEMORY_EXTRACTION_THRESHOLD }                    = require("../config/constants");

/**
 * POST /api/v1/chat/message
 * Body: { sessionId: string, message: string }
 */
const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required." });
    }

    const userMessage = message.trim();

    // Verify session ownership
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    // Crisis detection scan runs synchronously before DB writes or AI call
    const crisisResult = checkForCrisis(userMessage);

    if (crisisResult.isCrisis) {
      const [savedUser, savedBot] = await Promise.all([
        Message.create({ sessionId, userId, role: "user",      content: userMessage,            crisisFlag: true }),
        Message.create({ sessionId, userId, role: "assistant", content: crisisResult.response,  crisisFlag: true }),
      ]);
      await Session.findByIdAndUpdate(sessionId, {
        $inc: { messageCount: 2 },
        updatedAt: new Date(),
      });
      return res.json({ success: true, isCrisis: true, userMessage: savedUser, botMessage: savedBot });
    }

    // Save user message to database
    const savedUserMessage = await Message.create({ sessionId, userId, role: "user", content: userMessage });

    // Retrieve conversation history and long-term memory in parallel
    const [sessionHistory, longTermContext] = await Promise.all([
      getSessionContext(sessionId),
      getLongTermMemoryContext(userId),
    ]);

    // Call Python AI microservice
    const startTime = Date.now();
    let aiResult;

    try {
      aiResult = await getAIResponse({ userMessage, sessionHistory, longTermContext });
    } catch (aiError) {
      // Gracefully degrade if the AI microservice is unavailable
      console.error("[chatController] AI service unavailable:", aiError.message);
      aiResult = {
        reply: "I'm here with you. I'm experiencing a brief interruption — please keep talking, I'm listening.",
        emotion:           { label: "neutral", score: 0.5, raw_scores: {} },
        retrieved_chunks:  [],
        crisis_flag:       false,
        response_time_ms:  Date.now() - startTime,
      };
    }

    const responseTimeMs = Date.now() - startTime;

    // FastAPI returns snake_case which we backfill / map to our camelCase models
    const emotionLabel = aiResult.emotion?.label || "neutral";
    const emotionScore = aiResult.emotion?.score ?? null;
    const emotionRaw   = aiResult.emotion?.raw_scores ?? null;

    await Message.findByIdAndUpdate(savedUserMessage._id, {
      emotion: { label: emotionLabel, score: emotionScore, rawScores: emotionRaw },
    });

    // Save AI response
    const retrievedChunks = (aiResult.retrieved_chunks || []).map((chunk) => ({
      source:     chunk.source,
      sourceName: chunk.source_name,
      content:    chunk.content,
      score:      chunk.score,
    }));

    const savedBotMessage = await Message.create({
      sessionId,
      userId,
      role:            "assistant",
      content:         aiResult.reply,
      retrievedChunks,
      crisisFlag:      aiResult.crisis_flag || false,
      responseTimeMs,
    });

    // Update session stats and dominant emotion
    const newMessageCount = session.messageCount + 2;
    const sessionUpdates  = {
      $inc:           { messageCount: 2 },
      updatedAt:      new Date(),
      dominantEmotion: emotionLabel,
    };

    if (session.title === "New Chat") {
      sessionUpdates.title = userMessage.slice(0, 60);
    }
    await Session.findByIdAndUpdate(sessionId, sessionUpdates);

    // Trigger asynchronous memory extraction if threshold is reached
    if (newMessageCount >= MEMORY_EXTRACTION_THRESHOLD && !session.memoryExtracted) {
      setImmediate(async () => {
        try {
          const allMessages = await Message.find({ sessionId })
            .sort({ createdAt: 1 })
            .select("role content")
            .lean();

          const facts = await extractMemoryFacts(sessionId, allMessages);
          await saveMemoryFacts(userId, sessionId, facts);
          await Session.findByIdAndUpdate(sessionId, { memoryExtracted: true });
          console.log(`[memory] Extracted ${facts.length} facts for session ${sessionId}`);
        } catch (memErr) {
          console.error("[memory] Background extraction failed:", memErr.message);
        }
      });
    }

    // Send HTTP response
    res.json({
      success:    true,
      isCrisis:   false,
      userMessage: {
        ...savedUserMessage.toObject(),
        emotion: { label: emotionLabel, score: emotionScore },
      },
      botMessage: savedBotMessage,
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chat/:sessionId/history
 */
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getChatHistory };
