// components/layout/Sidebar.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Trash2, BarChart2,
  Brain, LogOut, ChevronLeft, ChevronRight, X, Sun, Moon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deleteSession } from "../../api/sessionApi";
import { truncate, formatRelative } from "../../utils/formatters";
import { getEmotionConfig } from "../../utils/emotionUtils";
import { Button } from "../common/Button";

export const Sidebar = ({ sessions, onNewSession, onSessionDeleted, mobileOpen = false, onMobileClose }) => {
  const { user, logout }  = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate          = useNavigate();
  const { sessionId }     = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const displayCollapsed = collapsed && !mobileOpen;

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    setDeleting(id);
    try {
      await deleteSession(id);
      onSessionDeleted(id);
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    onMobileClose?.();
  };

  const handleNewSessionClick = () => {
    onNewSession();
    onMobileClose?.();
  };

  const handleNavigate = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-xl md:shadow-sm
        transition-all duration-300 md:relative md:z-auto md:h-screen md:flex-shrink-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        ${collapsed ? "md:w-16" : "md:w-64"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        {!displayCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Wellness Bot</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={onMobileClose}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition ml-auto"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <Button
          onClick={handleNewSessionClick}
          size="sm"
          className={`w-full ${displayCollapsed ? "justify-center px-2" : ""}`}
        >
          <Plus size={15} />
          {!displayCollapsed && "New Chat"}
        </Button>
      </div>

      {/* Session List */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {!displayCollapsed && (
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1">
            Recent chats
          </p>
        )}

        {sessions.length === 0 && !displayCollapsed && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6 px-4">
            No conversations yet. Start one!
          </p>
        )}

        {sessions.map((s) => {
          const isActive = s._id === sessionId;
          const emotionCfg = getEmotionConfig(s.dominantEmotion);
          return (
            <div
              key={s._id}
              onClick={() => handleNavigate(`/chat/${s._id}`)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 mb-0.5 cursor-pointer
                transition-all duration-100
                ${isActive
                  ? "bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                }`}
            >
              {/* Emotion dot */}
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${emotionCfg.dot}`}
                title={emotionCfg.label}
              />

              {!displayCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? "text-brand-700 dark:text-brand-300 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                      {truncate(s.title, 28)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatRelative(s.updatedAt)}</p>
                  </div>

                  {/* Delete button — only visible on hover */}
                  <button
                    onClick={(e) => handleDelete(e, s._id)}
                    disabled={deleting === s._id}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-2 md:p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30
                      hover:text-red-500 text-slate-400 dark:text-slate-500 transition-all flex-shrink-0"
                  >
                    {deleting === s._id ? (
                      <div className="w-3 h-3 border border-slate-300 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-3 space-y-0.5">
        <SidebarNavItem
          icon={<BarChart2 size={16} />}
          label="Dashboard"
          collapsed={displayCollapsed}
          onClick={() => handleNavigate("/dashboard")}
        />
        <SidebarNavItem
          icon={<Brain size={16} />}
          label="My Memory"
          collapsed={displayCollapsed}
          onClick={() => handleNavigate("/memory")}
        />
        {/* Theme toggle */}
        <SidebarNavItem
          icon={theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          label={theme === "dark" ? "Light Mode" : "Dark Mode"}
          collapsed={displayCollapsed}
          onClick={toggleTheme}
        />
      </div>

      {/* User / Logout */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-3">
        {!displayCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center
              text-brand-700 dark:text-brand-300 text-xs font-bold flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 dark:text-slate-500 transition"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500
              text-slate-400 dark:text-slate-500 transition"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};

const SidebarNavItem = ({ icon, label, collapsed, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm
      text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition
      ${collapsed ? "justify-center" : ""}`}
    title={collapsed ? label : ""}
  >
    {icon}
    {!collapsed && label}
  </button>
);
