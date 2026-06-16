// controllers/sessionController.js
// Handles creating, listing, and deleting chat sessions.
// Session management handles CRUD operations on chat sessions, keeping data
// management separate from message handling and AI processing.

const Session = require("../models/Session");
const Message = require("../models/Message");

/**
 * GET /api/v1/sessions
 * Returns all sessions for the logged-in user, newest first.
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title dominantEmotion messageCount createdAt updatedAt isActive")
      .lean();

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/sessions
 * Creates a new chat session.
 */
const createSession = async (req, res, next) => {
  try {
    const session = await Session.create({
      userId: req.user._id,
      title: "New Chat",
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/sessions/:id
 * Returns a single session with its messages.
 */
const getSession = async (req, res, next) => {
  try {
    // Verify the session belongs to this user
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    // Fetch messages separately — keeps session doc lightweight
    const messages = await Message.find({ sessionId: session._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ success: true, session, messages });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/sessions/:id
 * Deletes a session and all its messages.
 */
const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    // Cascade delete messages — MongoDB doesn't do this automatically.
    // For large scale production environments, consider using a background job queue.
    await Message.deleteMany({ sessionId: req.params.id });

    res.json({ success: true, message: "Session deleted." });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/sessions/:id/title
 * Rename a session.
 */
const updateSessionTitle = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty.",
      });
    }

    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title: title.trim().slice(0, 100) },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  createSession,
  getSession,
  deleteSession,
  updateSessionTitle,
};
