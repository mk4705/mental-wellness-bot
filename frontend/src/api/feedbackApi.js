// api/feedbackApi.js
import api from "./axiosInstance";
export const submitFeedback    = (data) => api.post("/feedback", data);
export const getFeedbackSummary = ()    => api.get("/feedback/summary");

// api/memoryApi.js — exported separately but same file for brevity
