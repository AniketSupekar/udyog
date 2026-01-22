import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 15000
});

// Optional but recommended
api.interceptors.response.use(
  res => res,
  err => {
    console.error("API error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;