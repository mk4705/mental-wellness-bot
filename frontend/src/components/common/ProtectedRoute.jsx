// components/common/ProtectedRoute.jsx
// Redirects unauthenticated users to /login.
// A wrapper component that checks authentication state and either renders
// children or redirects to the login page. The loading check prevents
// rendering issues while the token is verified on startup.

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "./Spinner";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Still verifying token from localStorage — don't redirect yet
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};