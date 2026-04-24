import api from "./api";

export const getFullDashboard = () => api.get("/dashboard/full");
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getBusinessSnapshot = (params = {}) => api.get("/dashboard/snapshot", { params });