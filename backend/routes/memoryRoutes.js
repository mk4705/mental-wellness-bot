// routes/memoryRoutes.js
const express = require("express");
const { getMemory, deleteMemory } = require("../controllers/memoryController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/",       getMemory);
router.delete("/:id", deleteMemory);

module.exports = router;
