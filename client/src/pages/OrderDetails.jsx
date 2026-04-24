// src/pages/OrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchOrderById,
  updateOrderStatus,
  softDeleteOrder,
  updateOrderDetails,
  recordPayment,
} from "../services/order.api";
import StatusBadge from "../components/StatusBadge";
import BillModal from "../components/bill/BillModal";
import RecordPaymentModal from "../components/payments/RecordPaymentModal";
import { formatDate, toInputDate } from "../utils/date.util";
import { formatCurrency } from "../utils/currency.util";
import { getConfirmationUrl, getPaymentReminderUrl, getBillUrl } from "../utils/whatsapp.util";
import { MessageCircle, Trash2, Edit2, X, Check } from "lucide-react";

const STATUS_TRANSITIONS = {
  CREATED: ["PENDING"],
  PENDING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showBill, setShowBill] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Hardcoded business name for now — will come from business profile later
  const businessName = "My Business";

  useEffect(() => {
    fetchOrderById(id)
      .then(setOrder)
      .catch(() => navigate("/orders"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (nextStatus) => {
    if (!window.confirm(`Mark this order as ${nextStatus}?`)) return;
    try {
      const updated = await updateOrderStatus(order._id, nextStatus);
      setOrder(updated);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    try {
      await softDeleteOrder(order._id);
      navigate("/orders");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleEditStart = () => {
    setFormData({
      clientSnapshot: { ...order.clientSnapshot },
      orderDate: toInputDate(order.orderDate),
      deliveryDate: toInputDate(order.deliveryDate),
      notes: order.notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!window.confirm("Save changes?")) return;
    try {
      const updated = await updateOrderDetails(order._id, formData);
      setOrder(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order");
    }
  };

  const handlePaymentRecorded = (updatedOrder) => {
    setOrder(updatedOrder);
    setShowPaymentModal(false);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading order details…</div>;
  }

  if (!order) return null;

  const isEditable = !["DELIVERED", "CANCELLED"].includes(order.status) && !order.isDeleted;
  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

        {/* ── HEADER ── */}
        <div className="flex justify-between items-start">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-green-600 hover:underline mb-1 block">
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">ID: {order._id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* ── ACTION BAR ── */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {isEditable && !isEditing && (
            <button onClick={handleEditStart} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <Edit2 size={14} /> Edit
            </button>
          )}
          {isEditing && (
            <>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <Check size={14} /> Save
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                <X size={14} /> Cancel
              </button>
            </>
          )}

          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-4 py-2 text-sm rounded-lg text-white transition ${s === "DELIVERED" ? "bg-green-600 hover:bg-green-700" : "bg-yellow-500 hover:bg-yellow-600"}`}
            >
              Mark as {s}
            </button>
          ))}

          {order.payment?.remainingAmount > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Record Payment
            </button>
          )}

          {!order.isDeleted && (
            <button onClick={() => setShowBill(true)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Generate Bill
            </button>
          )}

          {isEditable && (
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition ml-auto">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

        {/* ── WHATSAPP ACTIONS ── */}
        {order.clientSnapshot?.phone && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">WhatsApp</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={getConfirmationUrl(order, businessName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <MessageCircle size={13} /> Order Confirmation
              </a>
              {order.payment?.remainingAmount > 0 && (
                <a
                  href={getPaymentReminderUrl(order, businessName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  <MessageCircle size={13} /> Payment Reminder
                </a>
              )}
              <a
                href={getBillUrl(order, businessName)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <MessageCircle size={13} /> Send Bill
              </a>
            </div>
          </div>
        )}

        {/* ── CUSTOMER INFO ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-600">Customer Information</h3>
          {isEditing ? (
            <div className="space-y-2">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Name"
                value={formData.clientSnapshot?.name || ""}
                onChange={(e) => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, name: e.target.value } })}
              />
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Phone"
                value={formData.clientSnapshot?.phone || ""}
                onChange={(e) => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, phone: e.target.value } })}
              />
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Address"
                value={formData.clientSnapshot?.address || ""}
                onChange={(e) => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, address: e.target.value } })}
              />
            </div>
          ) : (
            <>
              <p className="font-medium text-gray-900">{order.clientSnapshot?.name}</p>
              <p className="text-sm text-gray-600">📞 {order.clientSnapshot?.phone}</p>
              {order.clientSnapshot?.address && (
                <p className="text-sm text-gray-600">📍 {order.clientSnapshot?.address}</p>
              )}
            </>
          )}
        </div>

        {/* ── DATES ── */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Dates</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Date</p>
              {isEditing ? (
                <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full mt-1" value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })} />
              ) : (
                <p className="font-medium text-gray-900 mt-1">{formatDate(order.orderDate)}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Delivery Date</p>
              {isEditing ? (
                <input type="date" className="border rounded-lg px-3 py-2 text-sm w-full mt-1" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
              ) : (
                <p className="font-medium text-gray-900 mt-1">{formatDate(order.deliveryDate)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── ORDER ITEMS ── */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PAYMENT SUMMARY ── */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-600">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.financial?.subtotal)}</span>
            </div>
            {order.financial?.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.financial?.discountAmount)}</span>
              </div>
            )}
            {order.financial?.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({order.financial?.taxRate}%)</span>
                <span>{formatCurrency(order.financial?.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t pt-2 text-base">
              <span>Total</span>
              <span>{formatCurrency(order.financial?.total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Paid</span>
              <span className="text-green-600">{formatCurrency(order.payment?.totalPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold text-red-600 text-base">
              <span>Balance Due</span>
              <span>{formatCurrency(order.payment?.remainingAmount)}</span>
            </div>
          </div>

          {/* Payment Status Badge */}
          <div className="pt-2 border-t">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              order.payment?.status === "PAID" ? "bg-green-100 text-green-700" :
              order.payment?.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {order.payment?.status}
            </span>
          </div>
        </div>

        {/* ── PAYMENT HISTORY ── */}
        {order.payment?.transactions?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Payment History</h3>
            <div className="space-y-2">
              {order.payment.transactions.map((txn, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(txn.amount)}</p>
                    <p className="text-xs text-gray-500">{txn.method} · {formatDate(txn.recordedAt)}</p>
                    {txn.note && <p className="text-xs text-gray-400">{txn.note}</p>}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{txn.method}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        {(order.notes || isEditing) && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Notes</h3>
            {isEditing ? (
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add order notes..."
              />
            ) : (
              <p className="text-sm text-gray-700">{order.notes}</p>
            )}
          </div>
        )}
      </div>

      {showBill && <BillModal order={order} onClose={() => setShowBill(false)} />}
      {showPaymentModal && (
        <RecordPaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentRecorded}
        />
      )}
    </>
  );
}