// api/chatApi.js
import api from "./axiosInstance";

export const sendMessage   = (data)      => api.post("/chat/message", data);
export const getChatHistory = (sessionId) => api.get(`/chat/${sessionId}/history`);
