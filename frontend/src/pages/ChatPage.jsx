// pages/ChatPage.jsx
// The main chat interface page. Updates messages in local state optimistically
// on send before confirming with the server response to ensure a responsive UI.

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../api/sessionApi";
import { createSession } from "../api/sessionApi";
import { getSessions } from "../api/sessionApi";
import { sendMessage as sendMessageApi } from "../api/chatApi";
import { MessageBubble } from "../components/chat/MessageBubble";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { ChatInput } from "../components/chat/ChatInput";
import { CrisisAlert } from "../components/crisis/CrisisAlert";
import { Sidebar } from "../components/layout/Sidebar";
import { Spinner } from "../components/common/Spinner";
import { Brain, Menu } from "lucide-react";

export const ChatPage = () => {
  const { sessionId }   = useParams();
  const navigate        = useNavigate();
  const bottomRef       = useRef(null);

  const [sessions, setSessions]   = useState([]);
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);   // initial load
  const [sending, setSending]     = useState(false);   // message in flight
  const [crisis, setCrisis]       = useState(false);   // show crisis banner
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load sessions list
  useEffect(() => {
    getSessions().then((r) => setSessions(r.data.sessions)).catch(() => {});
  }, []);

  // Load messages when sessionId changes
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setCrisis(false);
    getSession(sessionId)
      .then((r) => setMessages(r.data.messages))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Create new session
  const handleNewSession = useCallback(async () => {
    try {
      const res = await createSession();
      const newSession = res.data.session;
      setSessions((prev) => [newSession, ...prev]);
      navigate(`/chat/${newSession._id}`);
    } catch { /* ignore */ }
  }, [navigate]);

  // Send message
  const handleSend = useCallback(async (text) => {
    if (!sessionId || sending) return;
    setSending(true);
    setCrisis(false);

    // Optimistic: show user message immediately
    const tempUserMsg = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      emotion: {},
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendMessageApi({ sessionId, message: text });
      const { userMessage, botMessage, isCrisis } = res.data;

      // Replace temp message with real one (has emotion data), add bot reply
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempUserMsg._id),
        userMessage,
        botMessage,
      ]);

      if (isCrisis) setCrisis(true);

      // Update session title in sidebar if it was "New Chat"
      setSessions((prev) =>
        prev.map((s) =>
          s._id === sessionId
            ? { ...s, title: text.slice(0, 60), updatedAt: new Date().toISOString() }
            : s
        )
      );
    } catch {
      // On error, remove the temp message and show inline error
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempUserMsg._id),
        {
          _id: `err-${Date.now()}`,
          role: "assistant",
          content: "I'm having a brief interruption. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [sessionId, sending]);

  const handleSessionDeleted = useCallback((id) => {
    setSessions((prev) => prev.filter((s) => s._id !== id));
    if (id === sessionId) {
      const remaining = sessions.filter((s) => s._id !== id);
      if (remaining.length > 0) navigate(`/chat/${remaining[0]._id}`);
      else navigate("/");
    }
  }, [sessionId, sessions, navigate]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        sessions={sessions}
        onNewSession={handleNewSession}
        onSessionDeleted={handleSessionDeleted}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-5 flex items-center
          justify-between shadow-sm flex-shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <Brain size={18} className="text-brand-500" />
            <span className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200 text-sm">
              {sessions.find((s) => s._id === sessionId)?.title || "Wellness Bot"}
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {sending && (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Spinner size="sm" /> Thinking…
              </span>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 sm:px-4 sm:py-4">

          {/* Crisis banner */}
          {crisis && <CrisisAlert />}

          {loading && (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <EmptyState onPromptClick={handleSend} />
          )}

          {/* Messages */}
          {!loading && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} sessionId={sessionId} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={sending || loading || !sessionId} />
      </div>
    </div>
  );
};

// Empty state with starter prompts
const STARTER_PROMPTS = [
  "I've been feeling really anxious lately",
  "I can't sleep because of stress",
  "Help me practice mindful breathing",
  "I'm feeling overwhelmed with work",
];

const EmptyState = ({ onPromptClick }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center mb-4">
      <Brain size={28} className="text-brand-500" />
    </div>
    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">
      How are you feeling today?
    </h2>
    <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 max-w-xs">
      This is a safe space. Share what's on your mind.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onPromptClick(prompt)}
          className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
            text-sm text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20
            hover:text-brand-700 dark:hover:text-brand-300 transition-all duration-150"
        >
          {prompt}
        </button>
      ))}
    </div>
  </div>
);
