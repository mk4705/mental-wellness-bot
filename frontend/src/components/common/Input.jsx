// components/common/Input.jsx
export const Input = ({ label, error, className = "", ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    )}
    <input
      className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100
        placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition
        focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
        ${error ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}
        ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
  </div>
);