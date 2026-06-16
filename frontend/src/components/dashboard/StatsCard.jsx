// components/dashboard/StatsCard.jsx
export const StatsCard = ({ icon, label, value, sub, color = "brand" }) => {
  const colors = {
    brand:  "bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300",
    amber:  "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300",
    red:    "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300",
    green:  "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300",
    slate:  "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value ?? "—"}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};