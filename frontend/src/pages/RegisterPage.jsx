// pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { AuthLayout } from "./LoginPage";

export const RegisterPage = () => {
  const navigate      = useNavigate();
  const { login }     = useAuth();
  const [form, setForm]   = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (form.username.length < 3) errs.username = "At least 3 characters";
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Valid email required";
    if (form.password.length < 8) errs.password = "At least 8 characters";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await registerApi(form);
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start your wellness journey today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="yourname"
          error={errors.username}
          autoFocus
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          error={errors.password}
        />

        {errors.general && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          Create account
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
