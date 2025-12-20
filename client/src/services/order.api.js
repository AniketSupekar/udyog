const API_BASE_URL = "http://localhost:5000/api/orders";

export const fetchOrders = async () => {
  const res = await fetch(API_BASE_URL);
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