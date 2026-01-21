const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://nursery-app-iin1.onrender.com/api/orders"
    : "/api/orders";

const fetchWithAuth = (url, options = {}) =>
  fetch(url, {
    credentials: "include",
    ...options
  });
    
export const fetchOrders = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  filter = "",      
  showDeleted = false
} = {}) => {
  const params = new URLSearchParams({
    page,
    limit,
    search,
    status,
    showDeleted
  });

  if (filter) {
    params.append("filter", filter);
  }

  const res = await fetchWithAuth(`${API_BASE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};



export const fetchOrderById = async (id) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
};

export const createOrder = async (data) => {
 const res = await fetchWithAuth(`${API_BASE_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
};

export const updateOrderStatus = async (id, status) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return res.json();
};

export const softDeleteOrder = async (id) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/${id}/delete`, {
    method: "PATCH"
  });
  if (!res.ok) throw new Error("Failed to delete order");
  return res.json();
};

export const updateOrderDetails = async (id, data) => {
  const res = await fetchWithAuth(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  return res.json();
};