// api/authApi.js
import api from "./axiosInstance";

export const register = (data) => api.post("/auth/register", data);
export const login    = (data) => api.post("/auth/login", data);
export const getMe    = ()     => api.get("/auth/me");
export const updatePreferences = (data) => api.patch("/auth/preferences", data);
