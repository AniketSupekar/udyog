// src/services/search.api.js
import api from "./api";

export const globalSearch = async (q) => {
  const { data } = await api.get("/search", { params: { q } });
  return data.data;
};