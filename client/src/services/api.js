// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // e.g. https://udyog-backend.railway.app/api
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const publicPaths = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/privacy-policy",
        "/terms-of-service",
      ];
      const isStorePath = path.startsWith("/store/");

      if (!publicPaths.includes(path) && !isStorePath) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;