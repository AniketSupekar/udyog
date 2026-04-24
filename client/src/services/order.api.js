// src/services/order.api.js
import api from "./api";

// ─── Orders ──────────────────────────────────────────────────────────────────

export const fetchOrders = async (params = {}) => {
  const { data } = await api.get("/orders", { params });
  // Returns { success, data: [], pagination: {} }
  return data;
};

export const fetchOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data; // unwrap
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data.data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data.data;
};

export const updateOrderDetails = async (id, payload) => {
  const { data } = await api.patch(`/orders/${id}`, payload);
  return data.data;
};

export const recordPayment = async (id, payload) => {
  const { data } = await api.post(`/orders/${id}/payments`, payload);
  return data.data;
};

export const softDeleteOrder = async (id) => {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
};