import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
  softDeleteOrder,
  updateOrderDetails
} from "../services/order.api";
import Layout from "../components/Layout";
import Header from "../components/Header";
import StatusBadge from "../components/StatusBadge";
import BillModal from "../components/bill/BillModal";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const [showBill, setShowBill] = useState(false);

  const handleStatusChange = async (nextStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this order as ${nextStatus}?`
    );
    if (!confirmed) return;

    try {
      const updated = await updateOrderStatus(order._id, nextStatus);
      setOrder(updated);
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (!confirmed) return;

    try {
      await softDeleteOrder(order._id);
      navigate("/");
    } catch (err) {
      alert(err.message || "Failed to delete order");
    }
  };

  const handleEditStart = () => {
    setFormData({
      quantity: order.quantity,
      rate: order.rate,
      advancePaid: order.advancePaid,
      orderDate: order.orderDate.slice(0, 10),
      deliveryDate: order.deliveryDate.slice(0, 10),
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address
      }
    });
    setIsEditing(true);
  };

  // ✅ NEW: save edited order
  const handleSave = async () => {
    const confirmed = window.confirm("Do you want to save the changes?");
    if (!confirmed) return;

    try {
      const updated = await updateOrderDetails(order._id, formData);
      setOrder(updated);
      setIsEditing(false);
      alert("Order updated successfully");
    } catch (err) {
      alert(err.message || "Failed to update order");
    }
  };

  useEffect(() => {
    fetchOrderById(id).then(setOrder);
  }, [id]);

  if (!order) {
    return (
      <Layout>
        <Header />
        <div className="p-6 text-center text-gray-500">
          Loading order details...
        </div>
      </Layout>
    );
  }

  const isEditable = order.status !== "DELIVERED" && !order.isDeleted;

  return (
    <>
      {/* <Header /> */}

      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-green-600 hover:underline mb-1"
            >
              ← Back
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              Order Details
            </h2>

            <p className="text-sm text-gray-500">
              Order ID: {order._id}
            </p>
          </div>

          <StatusBadge status={order.status} />
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex justify-between items-center pt-4 border-t">
          {isEditable && !isEditing && (
            <button
              onClick={handleEditStart}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Edit Order
            </button>
          )}

          {isEditing && (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Save Changes
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-3">


                <button
                  onClick={() => setShowBill(true)}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  Generate Bill
                </button>

            {order.status !== "DELIVERED" && (
              <>
                {order.status === "CREATED" && (
                  <button
                    onClick={() => handleStatusChange("PENDING")}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                  >
                    Mark as Pending
                  </button>
                )}

                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange("DELIVERED")}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Mark as Delivered
                  </button>
                )}
              </>
            )}

            {order.status === "DELIVERED" && !order.isDeleted && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Delete Order
              </button>
            )}
          </div>
        </div>

        {/* ================= CUSTOMER INFO ================= */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-600">
            Customer Information
          </h3>

          {isEditing ? (
            <>
              <input
                type="text"
                value={formData.customer.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, name: e.target.value }
                  })
                }
                className="w-full border rounded px-2 py-1"
                placeholder="Customer Name"
              />

              <input
                type="text"
                value={formData.customer.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, phone: e.target.value }
                  })
                }
                className="w-full border rounded px-2 py-1"
                placeholder="Phone Number"
              />

              <textarea
                value={formData.customer.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, address: e.target.value }
                  })
                }
                className="w-full border rounded px-2 py-1"
                placeholder="Address"
                rows={2}
              />
            </>
          ) : (
            <>
              <p className="text-base font-medium text-gray-800">
                {order.customer.name}
              </p>
              <p className="text-sm text-gray-600">📞 {order.customer.phone}</p>
              <p className="text-sm text-gray-600">📍 {order.customer.address}</p>
            </>
          )}
        </div>
        {/* ================= ORDER SUMMARY ================= */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-600">Order Summary</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Quantity</p>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="font-medium text-gray-800">{order.quantity}</p>
              )}
            </div>

            <div>
              <p className="text-gray-500">Rate</p>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="font-medium text-gray-800">₹ {order.rate}</p>
              )}
            </div>

            <div>
              <p className="text-gray-500">Order Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="font-medium text-gray-800">
                  {order.orderDate.slice(0, 10)}
                </p>
              )}
            </div>

            <div>
              <p className="text-gray-500">Delivery Date</p>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="font-medium text-gray-800">
                  {order.deliveryDate.slice(0, 10)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================= PAYMENT SUMMARY ================= */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-600">Payment Summary</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-semibold text-gray-900">
                ₹ {order.totalAmount}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Advance Paid</p>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.advancePaid}
                  onChange={(e) =>
                    setFormData({ ...formData, advancePaid: e.target.value })
                  }
                  className="w-full border rounded px-2 py-1"
                />
              ) : (
                <p className="font-medium text-gray-800">
                  ₹ {order.advancePaid}
                </p>
              )}
            </div>

            <div className="col-span-2 pt-2 border-t">
              <p className="text-gray-500">Remaining Amount</p>
              <p className="text-lg font-semibold text-red-600">
                ₹ {order.remainingAmount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showBill && (
        <BillModal
          order={order}
          onClose={() => setShowBill(false)}
        />
      )}

    </>
  );
}