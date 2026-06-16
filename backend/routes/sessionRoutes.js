// routes/sessionRoutes.js
const express = require("express");
const {
  getSessions, createSession, getSession,
  deleteSession, updateSessionTitle,
} = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All session routes require authentication
router.use(protect);

router.get("/",           getSessions);
router.post("/",          createSession);
router.get("/:id",        getSession);
router.delete("/:id",     deleteSession);
router.patch("/:id/title", updateSessionTitle);

module.exports = router;
