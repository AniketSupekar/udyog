import { useEffect, useState } from "react";
import { fetchOrders } from "../services/order.api";
import { Link } from "react-router-dom";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Orders</h2>

      <Link to="/create">+ Create Order</Link>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Delivery Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(order => (
            <tr key={order._id}>
              <td>{order.customer.name}</td>
              <td>{order.deliveryDate.slice(0, 10)}</td>
              <td>{order.totalAmount}</td>
              <td>{order.status}</td>
              <td>
                <Link to={`/order/${order._id}`}>Details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}