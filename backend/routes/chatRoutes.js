// routes/chatRoutes.js
const express = require("express");
const { sendMessage, getChatHistory } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const { chatLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
router.use(protect);

router.post("/message",              chatLimiter, sendMessage);
router.get("/:sessionId/history",                getChatHistory);

module.exports = router;
