import api from "./api";

export const getAnalyticsOverview = async () => {
  const { data } = await api.get("/analytics/overview");
  return data.data;
};

export const getExpenseSummary = async (params = {}) => {
  const { data } = await api.get("/expenses/summary", { params });
  return data.data;
};