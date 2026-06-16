// pages/IndexRedirect.jsx
// Handles the "/" route: if the user has sessions, go to the most recent one.
// Otherwise create a new session and navigate there.
// Performs asynchronous session loading on mount and then redirects to the active
// or a newly created chat session. Displays a spinner while the redirection logic processes.

import { useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSessions, createSession } from "../api/sessionApi";
import { Spinner } from "../components/common/Spinner";
import { Brain } from "lucide-react";

export const IndexRedirect = () => {
  const hasRun = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
  if (hasRun.current) return;
  hasRun.current = true;

  const go = async () => {
    try {
      const res = await getSessions();
      const sessions = res.data.sessions;

      if (sessions.length > 0) {
        navigate(`/chat/${sessions[0]._id}`, { replace: true });
      } else {
        const newRes = await createSession();
        navigate(`/chat/${newRes.data.session._id}`, { replace: true });
      }
    } catch {
      navigate("/login", { replace: true });
    }
  };

  go();
}, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center">
        <Brain size={24} className="text-white" />
      </div>
      <Spinner size="lg" />
    </div>
  );
};