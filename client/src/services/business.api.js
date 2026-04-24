// src/services/business.api.js
import api from "./api";

export const getBusinessProfile = async () => {
  const { data } = await api.get("/business/profile");
  return data.data;
};

export const updateBusinessProfile = async (payload) => {
  const { data } = await api.patch("/business/profile", payload);
  return data.data;
};