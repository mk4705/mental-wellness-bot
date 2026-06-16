// utils/emotionUtils.js
// Maps emotion labels to colors and emoji for UI display.
// Centralizes the visual configuration for emotions to allow updating
// styles in a single location.

export const EMOTION_CONFIG = {
  joy:      { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-400",   emoji: "😊", label: "Joy" },
  sadness:  { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",     dot: "bg-blue-400",    emoji: "😢", label: "Sadness" },
  anger:    { color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",      dot: "bg-red-400",     emoji: "😠", label: "Anger" },
  fear:     { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",   dot: "bg-purple-400",  emoji: "😨", label: "Fear" },
  surprise: { color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200",     dot: "bg-teal-400",    emoji: "😲", label: "Surprise" },
  disgust:  { color: "text-green-700",   bg: "bg-green-50",   border: "border-green-200",    dot: "bg-green-500",   emoji: "🤢", label: "Disgust" },
  neutral:  { color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-200",    dot: "bg-slate-400",   emoji: "😐", label: "Neutral" },
  unknown:  { color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-100",    dot: "bg-slate-300",   emoji: "❓", label: "Unknown" },
};

export const getEmotionConfig = (label) =>
  EMOTION_CONFIG[label?.toLowerCase()] || EMOTION_CONFIG.unknown;

// Chart colors for recharts — consistent across dashboard
export const EMOTION_CHART_COLORS = {
  joy:      "#f59e0b",
  sadness:  "#3b82f6",
  anger:    "#ef4444",
  fear:     "#a855f7",
  surprise: "#14b8a6",
  disgust:  "#22c55e",
  neutral:  "#94a3b8",
};
