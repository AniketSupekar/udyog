import api from "./api";

export const getProducts = async () => {
  const { data } = await api.get("/products");
  return data.data;
};

export const createProduct = async (payload) => {
  const { data } = await api.post("/products", payload);
  return data.data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data.data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};