import api from "./api";

export const getAnalyticsOverview = async () => {
  const { data } = await api.get("/analytics/overview");
  return data.data;
};