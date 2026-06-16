// components/dashboard/EmotionChart.jsx
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { EMOTION_CHART_COLORS, EMOTION_CONFIG } from "../../utils/emotionUtils";
import { useTheme } from "../../context/ThemeContext";

// ── Donut chart for emotion distribution ────────────────────────────────────
export const EmotionDonut = ({ distribution }) => {
  const { theme } = useTheme();
  const data = Object.entries(distribution || {})
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ name: label, value }));

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        No emotion data yet
      </div>
    );
  }

  const tooltipStyle = {
    borderRadius: 10,
    border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
    fontSize: 12,
    background: theme === "dark" ? "#1e293b" : "#ffffff",
    color: theme === "dark" ? "#e2e8f0" : "#1e293b",
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={EMOTION_CHART_COLORS[entry.name] || "#94a3b8"}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(v, name) => [
            v,
            `${EMOTION_CONFIG[name]?.emoji || ""} ${EMOTION_CONFIG[name]?.label || name}`,
          ]}
          contentStyle={tooltipStyle}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) =>
            `${EMOTION_CONFIG[value]?.emoji || ""} ${EMOTION_CONFIG[value]?.label || value}`
          }
          wrapperStyle={{ fontSize: 11, color: theme === "dark" ? "#cbd5e1" : "#334155" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ── Line chart for emotion timeline ─────────────────────────────────────────
export const EmotionTimeline = ({ timeline }) => {
  const { theme } = useTheme();

  if (!timeline || timeline.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
        No timeline data yet
      </div>
    );
  }

  // Pivot: [{date, joy: N, sadness: M, ...}]
  const byDate = {};
  timeline.forEach(({ _id: { date, emotion }, count }) => {
    if (!byDate[date]) byDate[date] = { date };
    byDate[date][emotion] = count;
  });

  const chartData = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const emotions = [...new Set(timeline.map((t) => t._id.emotion))];

  const gridColor = theme === "dark" ? "#334155" : "#f1f5f9";
  const tickColor = theme === "dark" ? "#94a3b8" : "#94a3b8";
  const tooltipStyle = {
    borderRadius: 10,
    border: theme === "dark" ? "1px solid #334155" : "1px solid #e2e8f0",
    fontSize: 12,
    background: theme === "dark" ? "#1e293b" : "#ffffff",
    color: theme === "dark" ? "#e2e8f0" : "#1e293b",
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: tickColor }}
          tickFormatter={(d) => d.slice(5)} // show MM-DD only
        />
        <YAxis tick={{ fontSize: 10, fill: tickColor }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {emotions.map((emotion) => (
          <Line
            key={emotion}
            type="monotone"
            dataKey={emotion}
            stroke={EMOTION_CHART_COLORS[emotion] || "#94a3b8"}
            strokeWidth={2}
            dot={false}
            name={`${EMOTION_CONFIG[emotion]?.emoji || ""} ${emotion}`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};