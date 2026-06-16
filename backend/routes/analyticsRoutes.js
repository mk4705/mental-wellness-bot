// routes/analyticsRoutes.js
const express = require("express");
const { getOverview, getEmotionTimeline } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/overview", getOverview);
router.get("/emotions", getEmotionTimeline);

module.exports = router;
