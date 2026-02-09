import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";

const OverdueOrders = ({ orders = [] }) => {
  const navigate = useNavigate();

  if (!orders.length) return null;

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/60">
        <h2 className="text-sm font-semibold text-red-600">
          Overdue Orders
        </h2>
        <button
          onClick={() => navigate("/order?filter=overdue")}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          View all
        </button>
      </div>

      {/* List */}
      <div className="divide-y">
        {orders.slice(0, 7).map(order => (
          <button
            key={order._id}
            onClick={() => navigate(`/order/${order._id}`)}
            className="group w-full text-left px-4 py-3 transition hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {order.customer.name}
                </div>
                <div className="text-xs text-gray-500">
                  Due on{" "}
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </div>
              </div>

              <div className="shrink-0">
                <StatusBadge status={order.status} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default OverdueOrders;
