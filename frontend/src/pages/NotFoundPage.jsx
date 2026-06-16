// pages/NotFoundPage.jsx
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-900">
      <p className="text-6xl font-black text-brand-200 dark:text-brand-900 mb-2">404</p>
      <h1 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-1">Page not found</h1>
      <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">This page doesn't exist.</p>
      <Button onClick={() => navigate("/")}>Go home</Button>
    </div>
  );
};