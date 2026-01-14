import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api"
    : "https://nursery-app-iin1.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // important for cookie-based auth
});

// Dashboard APIs
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getOverdueOrders = () => api.get("/dashboard/overdue");
export const getDueTodayOrders = () => api.get("/dashboard/due-today");
export const getUpcomingOrders = () => api.get("/dashboard/upcoming");
export const getBusinessSnapshot = () => api.get("/dashboard/business-snapshot");