// api/sessionApi.js
import api from "./axiosInstance";

export const getSessions        = ()         => api.get("/sessions");
export const createSession      = ()         => api.post("/sessions");
export const getSession         = (id)       => api.get(`/sessions/${id}`);
export const deleteSession      = (id)       => api.delete(`/sessions/${id}`);
export const updateSessionTitle = (id, title) => api.patch(`/sessions/${id}/title`, { title });
