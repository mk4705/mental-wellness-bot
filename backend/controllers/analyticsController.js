// controllers/analyticsController.js
// Computes emotion trends and usage stats from stored messages.
// MongoDB's aggregation pipeline is used here to group, count, and average
// data on the database side, minimizing memory usage in the application process.

const Message = require("../models/Message");
const Session = require("../models/Session");

/**
 * GET /api/v1/analytics/overview?days=30
 * Returns a summary: total sessions, messages, emotion distribution, crisis events.
 */
const getOverview = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const userId = req.user._id;

    // Run all aggregations in parallel for performance
    const [sessionStats, emotionDist, crisisCount, avgResponseTime] = await Promise.all([
      // Session count
      Session.countDocuments({ userId, createdAt: { $gte: since } }),

      // Emotion distribution: count occurrences of each emotion label
      Message.aggregate([
        {
          $match: {
            userId,
            role: "user",
            "emotion.label": { $ne: null },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: "$emotion.label",
            count: { $sum: 1 },
          },
        },
      ]),

      // Crisis events
      Message.countDocuments({
        userId,
        crisisFlag: true,
        createdAt: { $gte: since },
      }),

      // Average AI response time
      Message.aggregate([
        {
          $match: {
            userId,
            role: "assistant",
            responseTimeMs: { $ne: null },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$responseTimeMs" },
          },
        },
      ]),
    ]);

    // Total message count
    const messageCount = await Message.countDocuments({
      userId,
      createdAt: { $gte: since },
    });

    // Format emotion distribution as { joy: 12, sadness: 5, ... }
    const emotionMap = {};
    emotionDist.forEach((e) => {
      emotionMap[e._id] = e.count;
    });

    res.json({
      success: true,
      period: `${days} days`,
      overview: {
        sessionCount: sessionStats,
        messageCount,
        crisisEventCount: crisisCount,
        avgResponseTimeMs: avgResponseTime[0]?.avgTime
          ? Math.round(avgResponseTime[0].avgTime)
          : null,
        emotionDistribution: emotionMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/analytics/emotions?days=14
 * Returns day-by-day emotion data for a line chart.
 */
const getEmotionTimeline = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Group messages by day and emotion label
    const timeline = await Message.aggregate([
      {
        $match: {
          userId: req.user._id,
          role: "user",
          "emotion.label": { $ne: null },
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            emotion: "$emotion.label",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ success: true, timeline });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getEmotionTimeline };
