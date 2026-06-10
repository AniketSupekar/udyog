// src/services/store.api.js
import api from "./api";
import axios from "axios";

const PUBLIC_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Public API — no auth, uses plain axios ────────────────────────────────

export const getStorefront = (slug) =>
  axios.get(`${PUBLIC_BASE}/store/${slug}`);

export const placeStorefrontOrder = (slug, data) =>
  axios.post(`${PUBLIC_BASE}/store/${slug}/order`, data);

export const getStorefrontOrderStatus = (slug, orderId) =>
  axios.get(`${PUBLIC_BASE}/store/${slug}/order/${orderId}`);

export const getOrdersByPhone = (slug, phone) =>
  axios.get(`${PUBLIC_BASE}/store/${slug}/orders`, { params: { phone } });

// ── Protected API — admin only ────────────────────────────────────────────

export const updateStoreSettings = (data) =>
  api.patch("/store/settings", data);