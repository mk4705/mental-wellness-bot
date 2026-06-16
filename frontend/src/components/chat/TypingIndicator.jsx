// components/chat/TypingIndicator.jsx
export const TypingIndicator = () => (
  <div className="flex items-center gap-2 animate-fade-in">
    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center
      text-brand-600 dark:text-brand-300 text-xs font-bold flex-shrink-0">
      W
    </div>
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm
      px-4 py-3 shadow-sm flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);