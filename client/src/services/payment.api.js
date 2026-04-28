// src/services/payment.api.js
import api from "./api";

export const getOutstanding = async (params = {}) => {
  const { data } = await api.get("/payments/outstanding", { params });
  return data;
};

export const quickMarkPaid = async (orderId, method = "CASH") => {
  const { data } = await api.post(`/payments/${orderId}/quick-pay`, { method });
  return data.data;
};