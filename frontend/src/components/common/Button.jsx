// components/common/Button.jsx
import { Spinner } from "./Spinner";

const variants = {
  primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-sm",
  secondary: "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm",
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
};

const sizes = {
  sm:  "px-3 py-1.5 text-sm",
  md:  "px-4 py-2 text-sm",
  lg:  "px-5 py-2.5 text-base",
  icon: "p-2",
};

export const Button = ({
  children, variant = "primary", size = "md",
  loading = false, disabled = false, className = "", ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
      transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {loading && <Spinner size="sm" />}
    {children}
  </button>
);