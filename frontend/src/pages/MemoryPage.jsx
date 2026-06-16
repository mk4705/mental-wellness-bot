// pages/MemoryPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Trash2, ArrowLeft, Lightbulb, Heart, Shield, Star, Tag } from "lucide-react";
import { getMemory, deleteMemory } from "../api/memoryApi";
import { Spinner } from "../components/common/Spinner";
import { Button } from "../components/common/Button";
import { formatRelative } from "../utils/formatters";

const MEMORY_TYPE_CONFIG = {
  emotional_pattern: { icon: <Heart size={14} />,    color: "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800",   label: "Emotional Pattern" },
  recurring_concern: { icon: <Shield size={14} />,   color: "text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800",       label: "Recurring Concern" },
  coping_strategy:   { icon: <Lightbulb size={14} />,color: "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800", label: "Coping Strategy" },
  preference:        { icon: <Star size={14} />,     color: "text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800",label: "Preference" },
  fact:              { icon: <Tag size={14} />,      color: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600", label: "Fact" },
};

export const MemoryPage = () => {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    getMemory()
      .then((r) => setMemories(r.data.memories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this memory? The bot will no longer use it.")) return;
    setDeleting(id);
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m._id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  // Group by memoryType
  const grouped = memories.reduce((acc, m) => {
    acc[m.memoryType] = acc[m.memoryType] || [];
    acc[m.memoryType].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">My Memory</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Things the bot remembers about you across sessions
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : memories.length === 0 ? (
          <div className="text-center py-20">
            <Brain size={40} className="text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No memories yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              After a few conversations, the bot will remember important things about you here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interview: memory is grouped by type so users can understand
                what category of information the bot has about them */}
            {Object.entries(MEMORY_TYPE_CONFIG).map(([type, config]) => {
              const items = grouped[type];
              if (!items?.length) return null;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold
                      px-2.5 py-1 rounded-full border ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="space-y-2">
                    {items.map((m) => (
                      <div key={m._id}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm
                          px-3 py-2.5 sm:px-4 sm:py-3 flex items-start justify-between gap-3 group">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 dark:text-slate-200 break-words [overflow-wrap:anywhere]">{m.content}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            Added {formatRelative(m.createdAt)} ·{" "}
                            Confidence {Math.round(m.confidence * 100)}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(m._id)}
                          disabled={deleting === m._id}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 rounded-lg
                            hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400
                            transition-all flex-shrink-0 w-9 h-9 md:w-7 md:h-7 flex items-center justify-center"
                          title="Remove this memory"
                        >
                          {deleting === m._id
                            ? <div className="w-4 h-4 md:w-3.5 md:h-3.5 border border-slate-300 dark:border-slate-600 border-t-red-400 rounded-full animate-spin" />
                            : <Trash2 size={16} className="md:w-3.5 md:h-3.5" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
