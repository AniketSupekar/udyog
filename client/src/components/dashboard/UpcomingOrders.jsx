// src/components/dashboard/UpcomingOrders.jsx
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { formatDate } from "../../utils/date.util";

const UpcomingOrders = ({ orders = [] }) => {
  const navigate = useNavigate();
  if (!orders.length) return null;

  return (
    <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Clock size={18} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-blue-600">Upcoming</h2>
        </div>
        <button
          onClick={() => navigate("/orders?filter=upcoming")}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          View all <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {orders.slice(0, 3).map((order) => (
          <button
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="w-full text-left flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3.5 transition-all hover:shadow-sm hover:border-gray-300"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {order.clientSnapshot?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Scheduled for {formatDate(order.deliveryDate)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={order.status} />
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default UpcomingOrders;