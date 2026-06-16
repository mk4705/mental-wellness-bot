// api/memoryApi.js
import api from "./axiosInstance";
export const getMemory    = ()   => api.get("/memory");
export const deleteMemory = (id) => api.delete(`/memory/${id}`);
