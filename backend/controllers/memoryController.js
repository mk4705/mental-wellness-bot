// controllers/memoryController.js
const LongTermMemory = require("../models/LongTermMemory");
const { deleteMemoryEntry } = require("../services/memoryService");

/**
 * GET /api/v1/memory
 * Returns all active long-term memory entries for the current user.
 */
const getMemory = async (req, res, next) => {
  try {
    const memories = await LongTermMemory.find({
      userId: req.user._id,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, memories });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/memory/:id
 * Soft-deletes a memory entry (user privacy control).
 */
const deleteMemory = async (req, res, next) => {
  try {
    const memory = await deleteMemoryEntry(req.params.id, req.user._id);

    if (!memory) {
      return res.status(404).json({ success: false, message: "Memory not found." });
    }

    res.json({ success: true, message: "Memory entry removed." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMemory, deleteMemory };
