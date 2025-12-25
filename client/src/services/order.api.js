const API_BASE_URL = "http://localhost:5000/api/orders";

export const fetchOrders = async ({ showDeleted = false } = {}) => {
  const res = await fetch(`/api/orders?showDeleted=${showDeleted}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};


export const fetchOrderById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
};

export const createOrder = async (data) => {
  const res = await fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
};

export const updateOrderStatus = async (id, status) => {
  const res = await fetch(`/api/orders/${id}/status`, {
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
  const res = await fetch(`/api/orders/${id}/delete`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to delete order");
  return await res.json();
};