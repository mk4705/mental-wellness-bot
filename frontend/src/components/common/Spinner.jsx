// components/common/Spinner.jsx
export const Spinner = ({ size = "md", className = "" }) => {
  const sz = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" }[size];
  return (
    <div className={`animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-brand-500 ${sz} ${className}`} />
  );
};