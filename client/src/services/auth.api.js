// src/services/auth.api.js
import api from "./api";

export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
export const register = (data) => api.post("/auth/register", data);
export const verifyEmail = (data) => api.post("/auth/verify-email", data);
export const resendOTP = (data) => api.post("/auth/resend-otp", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const completeOnboarding = () => api.patch("/auth/complete-onboarding");