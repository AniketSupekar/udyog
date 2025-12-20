import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchOrderById } from "../services/order.api";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrderById(id).then(setOrder);
  }, [id]);

  if (!order) return <p>Loading...</p>;

  return (
    <div>
      <h2>Order Details</h2>
      <p><b>Name:</b> {order.customer.name}</p>
      <p><b>Phone:</b> {order.customer.phone}</p>
      <p><b>Address:</b> {order.customer.address}</p>
      <p><b>Quantity:</b> {order.quantity}</p>
      <p><b>Rate:</b> {order.rate}</p>
      <p><b>Total:</b> {order.totalAmount}</p>
      <p><b>Advance:</b> {order.advancePaid}</p>
      <p><b>Remaining:</b> {order.remainingAmount}</p>
      <p><b>Status:</b> {order.status}</p>
    </div>
  );
}