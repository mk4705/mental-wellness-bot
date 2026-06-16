// api/analyticsApi.js
import api from "./axiosInstance";
export const getOverview       = (days = 30) => api.get(`/analytics/overview?days=${days}`);
export const getEmotionTimeline = (days = 14) => api.get(`/analytics/emotions?days=${days}`);
