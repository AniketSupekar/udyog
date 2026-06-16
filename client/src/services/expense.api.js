import api from "./api";

export const getExpenses = async (params = {}) => {
  const { data } = await api.get("/expenses", { params });
  return data.data;
};

export const createExpense = async (payload) => {
  const { data } = await api.post("/expenses", payload);
  return data.data;
};

export const deleteExpense = async (id) => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};

export const getExpenseSummary = async (params = {}) => {
  const { data } = await api.get("/expenses/summary", { params });
  return data.data;
};