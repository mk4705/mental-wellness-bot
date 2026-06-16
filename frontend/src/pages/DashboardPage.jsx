// pages/DashboardPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  MessageSquare,
  AlertTriangle,
  Zap,
  ArrowLeft,
  ThumbsUp,
} from "lucide-react";

import { getOverview, getEmotionTimeline } from "../api/analyticsApi";
import { getFeedbackSummary } from "../api/feedbackApi";

import { StatsCard } from "../components/dashboard/StatsCard";
import {
  EmotionDonut,
  EmotionTimeline,
} from "../components/dashboard/EmotionChart";

import { Spinner } from "../components/common/Spinner";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

const PERIOD_OPTIONS = [7, 14, 30];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [period, setPeriod] = useState(30);
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      getOverview(period),
      getEmotionTimeline(period),
      getFeedbackSummary(),
    ])
      .then(([ov, tl, fb]) => {
        setOverview(ov.data.overview);
        setTimeline(tl.data.timeline);
        setFeedback(fb.data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const topEmotion = overview?.emotionDistribution
    ? Object.entries(overview.emotionDistribution).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0]
    : null;

  const satisfactionPct = feedback?.totalFeedback
    ? Math.round(
        (feedback.positiveCount / feedback.totalFeedback) * 100
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-4 sm:px-6 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Your Wellness Dashboard
          </h1>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            {user?.username} · Emotional insights and usage stats
          </p>
        </div>

        {/* Period Selector */}
        <div className="w-full sm:w-auto sm:ml-auto flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          {PERIOD_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`flex-1 sm:flex-none px-3 py-2 sm:py-1 rounded-md text-xs font-medium transition
                ${
                  period === d
                    ? "bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
                }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6 sm:space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatsCard
                icon={<MessageSquare size={18} />}
                label="Sessions"
                value={overview?.sessionCount ?? 0}
                sub={`Last ${period} days`}
                color="brand"
              />

              <StatsCard
                icon={<BarChart2 size={18} />}
                label="Messages"
                value={overview?.messageCount ?? 0}
                sub="Total exchanged"
                color="slate"
              />

              <StatsCard
                icon={<AlertTriangle size={18} />}
                label="Crisis Events"
                value={overview?.crisisEventCount ?? 0}
                sub="Escalation triggers"
                color="red"
              />

              <StatsCard
                icon={<ThumbsUp size={18} />}
                label="Satisfaction"
                value={satisfactionPct != null ? `${satisfactionPct}%` : "—"}
                sub={`${feedback?.totalFeedback ?? 0} ratings`}
                color="green"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-6 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-semibold text-slate-700 dark:text-slate-100">
                      Emotion Distribution
                    </h2>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      How you've been feeling
                    </p>
                  </div>

                  {topEmotion && (
                    <span className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-600 border border-brand-100 dark:border-brand-700 px-2 py-1 rounded-full font-medium capitalize">
                      Most: {topEmotion}
                    </span>
                  )}
                </div>

                <EmotionDonut
                  distribution={overview?.emotionDistribution}
                />
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-6 min-w-0">
                <div className="mb-4">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-100">
                    Emotion Timeline
                  </h2>

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Daily emotional pattern
                  </p>
                </div>

                <EmotionTimeline timeline={timeline} />
              </div>
            </div>

            {/* Response Time */}
            {overview?.avgResponseTimeMs && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Zap size={18} className="text-amber-500" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-100">
                    Average AI response time:{" "}
                    <span className="text-brand-600">
                      {(overview.avgResponseTimeMs / 1000).toFixed(1)}s
                    </span>
                  </p>

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Includes emotion detection, RAG retrieval and LLM
                    generation
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
