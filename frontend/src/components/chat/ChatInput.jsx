// components/chat/ChatInput.jsx
import { useState, useRef } from "react";
import { Send } from "lucide-react";

export const ChatInput = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    // Auto-expand textarea up to ~5 lines
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-800 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 min-w-0
          focus-within:ring-brand-400/20 transition">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind…"
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none leading-relaxed
              disabled:opacity-50 max-h-[120px]"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-brand-600 hover:bg-brand-700
            disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500
            flex items-center justify-center text-white transition-all
            focus:outline-none focus:ring-2 focus:ring-brand-500/40 flex-shrink-0"
          title="Send (Enter)"
        >
          <Send size={16} />
        </button>
      </div>

      <p className="hidden sm:block text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};
