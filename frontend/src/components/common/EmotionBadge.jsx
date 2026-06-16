// components/common/EmotionBadge.jsx
import { getEmotionConfig } from "../../utils/emotionUtils";

export const EmotionBadge = ({ label, score, size = "sm" }) => {
  const config = getEmotionConfig(label);
  if (!label || label === "unknown") return null;

  const pct = score ? Math.round(score * 100) : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5
        text-xs font-medium dark:bg-opacity-20 dark:border-opacity-30 ${config.color} ${config.bg} ${config.border}`}
      title={pct ? `${config.label} — ${pct}% confidence` : config.label}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
      {pct && <span className="opacity-60">{pct}%</span>}
    </span>
  );
};