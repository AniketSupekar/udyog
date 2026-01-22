import api from "./api";

export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getOverdueOrders = () => api.get("/dashboard/overdue");
export const getDueTodayOrders = () => api.get("/dashboard/due-today");
export const getUpcomingOrders = () => api.get("/dashboard/upcoming");

export const getBusinessSnapshot = (params = {}) =>
  api.get("/dashboard/business-snapshot", { params });

export const getDashboardSummaryForTenant = () =>
  api.get("/dashboard/full-dashboard");