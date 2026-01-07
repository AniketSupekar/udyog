import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
