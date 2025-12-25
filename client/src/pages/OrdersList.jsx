import { useEffect, useState } from "react";
import { fetchOrders } from "../services/order.api";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  const loadOrders = async (showDeletedFlag = false) => {
    setLoading(true);
    try {
      const fetchedOrders = await fetchOrders({ showDeleted: showDeletedFlag });
      setOrders(fetchedOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(showDeleted);
  }, [showDeleted]);

  if (loading) {
    return (
      <Layout>
        <Header />
        <div className="p-6 text-center text-gray-500">
          Loading orders...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />

      <div className="p-4 md:p-6 space-y-6">
        {/* ================= TOP BAR ================= */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Orders
            </h2>
            <p className="text-sm text-gray-500">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-md hover:bg-gray-300 transition"
            >
              {showDeleted ? "Hide Deleted" : "Show Deleted"}
            </button>
            <Link
              to="/create"
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              + Create Order
            </Link>
          </div>
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="space-y-4 md:hidden">
          {orders.map((order) => (
            <div
              key={order._id}
              className={`bg-white rounded-xl shadow-sm p-4 space-y-3 ${order.isDeleted ? "bg-gray-100 opacity-60" : "bg-white"
                }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className={`text-sm font-medium ${order.isDeleted ? "line-through text-gray-500" : "text-gray-800"
                      }`}
                  >
                    {order.customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Delivery: {order.deliveryDate.slice(0, 10)}
                  </p>
                </div>

                <StatusBadge status={order.status} />
              </div>

              <div className="flex justify-between items-center">
                <p
                  className={`text-lg font-semibold ${order.isDeleted ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                >
                  ₹ {order.totalAmount}
                </p>
                <Link
                  to={`/order/${order._id}`}
                  className={`text-sm font-medium ${order.isDeleted ? "text-gray-400" : "text-green-600"
                    }`}
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ================= DESKTOP VIEW ================= */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="text-left px-6 py-4 border-b border-r border-gray-200">
                  Customer
                </th>
                <th className="text-left px-6 py-4 border-b border-r border-gray-200">
                  Delivery Date
                </th>
                <th className="text-right px-6 py-4 border-b border-r border-gray-200">
                  Total
                </th>
                <th className="text-left px-6 py-4 border-b border-r border-gray-200">
                  Status
                </th>
                <th className="text-center px-6 py-4 border-b border-gray-200">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className={`hover:bg-gray-50 transition ${order.isDeleted ? "bg-gray-100 opacity-60" : "bg-white"
                    }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-800 border-b border-r border-gray-200">
                    {order.customer.name}
                  </td>

                  <td className="px-6 py-4 text-gray-600 border-b border-r border-gray-200">
                    {order.deliveryDate.slice(0, 10)}
                  </td>

                  <td className="px-6 py-4 text-right font-semibold text-gray-900 border-b border-r border-gray-200">
                    ₹ {order.totalAmount}
                  </td>

                  <td className="px-6 py-4 border-b border-r border-gray-200">
                    <StatusBadge status={order.status} />
                  </td>

                  <td className="px-6 py-4 text-center border-b border-gray-200">
                    <Link
                      to={`/order/${order._id}`}
                      className={`text-green-600 font-medium hover:underline ${order.isDeleted ? "text-gray-400" : "text-green-600"
                        }`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <p className="text-center text-gray-500">
            No orders found.
          </p>
        )}
      </div>
    </Layout>
  );
}