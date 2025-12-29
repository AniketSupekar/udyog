const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://nursery-app-iin1.onrender.com/api/orders"
    : "/api/orders";
    
export const fetchOrders = async ({ showDeleted = false } = {}) => {
  const res = await fetch(
    `${API_BASE_URL}?showDeleted=${showDeleted}`
  );
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

export const fetchOrderById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
};

export const createOrder = async (data) => {
  const res = await fetch(`${API_BASE_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
};

export const updateOrderStatus = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/${id}/status`, {
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
  const res = await fetch(`${API_BASE_URL}/${id}/delete`, {
    method: "PATCH"
  });
  if (!res.ok) throw new Error("Failed to delete order");
  return res.json();
};

export const updateOrderDetails = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
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