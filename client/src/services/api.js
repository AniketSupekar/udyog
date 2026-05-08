// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Response interceptor — unwrap data, handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
      
      // Only redirect if NOT already on a public page
      if (!publicPaths.includes(path)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;