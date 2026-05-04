// src/services/client.api.js
import api from "./api";

export const getClients = async (params = {}) => {
  const { data } = await api.get("/clients", { params });
  return data;
};

export const searchClients = async (q) => {
  const { data } = await api.get("/clients/search", { params: { q } });
  return data;
};

export const getClientById = async (id) => {
  const { data } = await api.get(`/clients/${id}`);
  return data;
};

export const createClient = async (payload) => {
  const { data } = await api.post("/clients", payload);
  return data;
};

export const updateClient = async (id, payload) => {
  const { data } = await api.patch(`/clients/${id}`, payload);
  return data;
};

export const deleteClient = async (id) => {
  const { data } = await api.delete(`/clients/${id}`);
  return data;
};