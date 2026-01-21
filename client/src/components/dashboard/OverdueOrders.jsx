// src/components/dashboard/OverdueOrders.jsx
import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";

const OverdueOrders = ({ orders = [] }) => {
  const navigate = useNavigate();

  if (!orders.length) return null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-red-600">Overdue Orders</h2>
        <button
          onClick={() => navigate("/order?filter=overdue")}
          className="text-xs text-blue-600"
        >
          View all
        </button>
      </div>

      <div className="space-y-3">
        {orders.slice(0, 7).map(order => (
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

export default OverdueOrders;
