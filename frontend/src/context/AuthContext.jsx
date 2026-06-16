// context/AuthContext.jsx
// Global auth state: user object, token, login/logout helpers.
// React Context is used to make authentication state accessible across components
// without prop-drilling.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true); // true while verifying stored token

  // On mount: if a token exists in localStorage, verify it's still valid
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await getMe();
        setUser(res.data.user);
      } catch {
        // Token is invalid/expired — clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const login = useCallback((userData, authToken) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — cleaner than calling useContext(AuthContext) everywhere
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
