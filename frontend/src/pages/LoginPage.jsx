// pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { login as loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";

export const LoginPage = () => {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your wellness companion"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
          autoFocus
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

// Shared auth layout wrapper
export const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50
    dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center
          shadow-lg shadow-brand-200 mb-3">
          <Brain size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 sm:p-8">
        {children}
      </div>
    </div>
  </div>
);
