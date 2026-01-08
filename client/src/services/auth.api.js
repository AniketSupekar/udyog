import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api"
    : "https://nursery-app-iin1.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");