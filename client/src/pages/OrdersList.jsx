import { useEffect, useState } from "react";
import { fetchOrders } from "../services/order.api";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Header from "../components/Header";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <Header />
        <div className="p-4 text-center text-gray-600">Loading orders...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />

      <div className="p-4 space-y-4">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Orders</h2>

          <Link
            to="/create"
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            + Create Order
          </Link>
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="space-y-4 md:hidden">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-start"
            >
              <div>
                <p className="text-sm text-gray-500">
                  {order.deliveryDate.slice(0, 10)}
                </p>

                <p className="text-base font-medium text-gray-800">
                  {order.customer.name}
                </p>

                <p className="text-sm text-gray-600">
                  ₹ {order.totalAmount}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  {order.status}
                </span>

                <div className="mt-2">
                  <Link
                    to={`/order/${order._id}`}
                    className="text-sm text-green-600 font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= DESKTOP VIEW ================= */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Delivery Date</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    {order.customer.name}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {order.deliveryDate.slice(0, 10)}
                  </td>

                  <td className="px-4 py-3 text-right font-medium">
                    ₹ {order.totalAmount}
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-block text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {order.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/order/${order._id}`}
                      className="text-green-600 font-medium hover:underline"
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
          <p className="text-center text-gray-500">No orders found.</p>
        )}
      </div>
    </Layout>
  );
}