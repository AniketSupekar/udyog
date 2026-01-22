import api from "./api";

export const fetchOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  filter = "",
  showDeleted = false
} = {}) => {
  const params = {
    page,
    limit,
    search,
    status,
    showDeleted
  };

  if (filter) params.filter = filter;

  const { data } = await api.get("/orders", { params });
  return data;
};

export const fetchOrderById = (id) =>
  api.get(`/orders/${id}`).then(res => res.data);

export const createOrder = (data) =>
  api.post("/orders", data).then(res => res.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then(res => res.data);

export const softDeleteOrder = (id) =>
  api.patch(`/orders/${id}/delete`).then(res => res.data);

export const updateOrderDetails = (id, data) =>
  api.patch(`/orders/${id}`, data).then(res => res.data);