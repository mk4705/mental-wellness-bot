// components/chat/MessageBubble.jsx
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { EmotionBadge } from "../common/EmotionBadge";
import { submitFeedback } from "../../api/feedbackApi";
import { formatTime } from "../../utils/formatters";

const formatSourceName = (source = "") => {
  const filename = source.split(/[\\/]/).pop() || "";
  const stem = filename.replace(/\.[^.]+$/, "");
  const words = stem.replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);

  return words
    .map((word) => word.toLowerCase() === "cbt"
      ? "CBT"
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ") || "Unknown Source";
};

export const MessageBubble = ({ message, sessionId }) => {
  const isUser = message.role === "user";
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const sourceNames = [...new Set(
    (message.retrievedChunks || []).map(
      (chunk) => chunk.sourceName || formatSourceName(chunk.source)
    )
  )];

  const handleFeedback = async (rating) => {
    if (feedbackGiven || submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        messageId: message._id,
        sessionId,
        rating,
        category: rating >= 4 ? "helpful" : "unhelpful",
      });
      setFeedbackGiven(true);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  // Render the Markdown produced by the assistant without injecting raw HTML.
  const renderContent = (text) => {
    const lines = (text || "").split("\n");
    const blocks = [];

    const renderInline = (value) => value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });

    for (let i = 0; i < lines.length;) {
      const line = lines[i];
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      const bullet = line.match(/^[-*]\s+(.+)$/);

      if (heading) {
        blocks.push(<p key={`heading-${i}`} className="font-semibold text-base mt-2 first:mt-0">{renderInline(heading[1])}</p>);
        i += 1;
      } else if (ordered || bullet) {
        const isOrdered = Boolean(ordered);
        const items = [];
        const listPattern = isOrdered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;

        while (i < lines.length) {
          const item = lines[i].match(listPattern);
          if (item) {
            items.push(item[1]);
            i += 1;
          } else if (lines[i].trim() === "" && lines[i + 1]?.match(listPattern)) {
            i += 1;
          } else {
            break;
          }
        }

        const List = isOrdered ? "ol" : "ul";
        blocks.push(
          <List key={`list-${i}`} className={`${isOrdered ? "list-decimal" : "list-disc"} my-1.5 space-y-1 pl-5 marker:text-brand-500`}>
            {items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
          </List>
        );
      } else if (line.trim() === "") {
        blocks.push(<div key={`space-${i}`} className="h-2" aria-hidden="true" />);
        i += 1;
      } else {
        blocks.push(<p key={`paragraph-${i}`} className="leading-relaxed">{renderInline(line)}</p>);
        i += 1;
      }
    }

    return blocks;
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center
          text-brand-600 dark:text-brand-300 text-xs font-bold flex-shrink-0 mr-2 mt-1">
          W
        </div>
      )}

      <div className={`max-w-[88%] sm:max-w-[75%] min-w-0 ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed shadow-sm break-words
            ${isUser
              ? "bg-brand-600 text-white rounded-tr-sm"
              : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"
            }`}
        >
          <div className="[overflow-wrap:anywhere]">{renderContent(message.content)}</div>
        </div>

        {/* Metadata row */}
        <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatTime(message.createdAt)}</span>

          {/* Emotion badge — only on user messages */}
          {isUser && message.emotion?.label && message.emotion.label !== "unknown" && (
            <EmotionBadge label={message.emotion.label} score={message.emotion.score} />
          )}

          {/* Feedback buttons — only on bot messages */}
          {!isUser && (
            <div className="flex items-center gap-1">
              {feedbackGiven ? (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Thanks!</span>
              ) : (
                <>
                  <button
                    onClick={() => handleFeedback(5)}
                    disabled={submitting}
                    className="p-1.5 sm:p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500 text-slate-300 dark:text-slate-600
                      transition disabled:opacity-50"
                    title="Helpful"
                  >
                    <ThumbsUp size={11} />
                  </button>
                  <button
                    onClick={() => handleFeedback(1)}
                    disabled={submitting}
                    className="p-1.5 sm:p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-400 text-slate-300 dark:text-slate-600
                      transition disabled:opacity-50"
                    title="Not helpful"
                  >
                    <ThumbsDown size={11} />
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Deduplicated knowledge sources used for this assistant response */}
        {!isUser && sourceNames.length > 0 && (
          <div className="mt-1 w-full max-w-full sm:max-w-sm px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800
            text-xs text-slate-600 dark:text-slate-300 animate-fade-in">
            <p className="font-medium text-brand-700 dark:text-brand-300 text-[11px] mb-1">
              Sources Used:
            </p>
            <ul className="space-y-0.5">
              {sourceNames.map((sourceName) => (
                <li key={sourceName} className="flex gap-1.5 min-w-0">
                  <span aria-hidden="true">•</span>
                  <span className="min-w-0 break-words">{sourceName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center
          text-white text-xs font-bold flex-shrink-0 ml-2 mt-1">
          U
        </div>
      )}
    </div>
  );
};
