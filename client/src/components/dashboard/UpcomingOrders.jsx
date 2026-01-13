// src/components/dashboard/UpcomingOrders.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUpcomingOrders } from "../../services/dashboard.api";
import StatusBadge from "../StatusBadge";

const UpcomingOrders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getUpcomingOrders()
      .then(res => setOrders(res.data.slice(0, 7)))
      .catch(err => console.error(err));
  }, []);

  if (!orders.length) return null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-blue-600">Upcoming Orders</h2>
        <button
          onClick={() => navigate("/order?filter=upcoming")}
          className="text-xs text-blue-600"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {orders.map(order => (
          <button
            key={order._id}
            onClick={() => navigate(`/order/${order._id}`)}
            className="w-full text-left p-3 rounded-md border hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{order.customer.name}</div>
                <div className="text-xs text-gray-500">
                  Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UpcomingOrders;
