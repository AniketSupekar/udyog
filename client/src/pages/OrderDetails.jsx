// src/pages/OrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrderById, updateOrderStatus, softDeleteOrder, updateOrderDetails } from "../services/order.api";
import { getBusinessProfile } from "../services/business.api";
import StatusBadge from "../components/StatusBadge";
import BillModal from "../components/bill/BillModal";
import RecordPaymentModal from "../components/payments/RecordPaymentModal";
import { formatDate, toInputDate } from "../utils/date.util";
import { formatCurrency } from "../utils/currency.util";
import { getConfirmationUrl, getPaymentReminderUrl, getBillUrl } from "../utils/whatsapp.util";
import { MessageCircle, Trash2, Edit2, X, Check, ChevronLeft, IndianRupee } from "lucide-react";

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
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showBill, setShowBill] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchOrderById(id)
      .then(setOrder)
      .catch(() => navigate("/orders"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getBusinessProfile()
      .then(setBusiness)
      .catch(console.error);
  }, []);

  const businessName = business?.name || "My Business";

  const handleStatusChange = async (nextStatus) => {
    if (!window.confirm(`Mark as ${nextStatus}?`)) return;
    setStatusLoading(true);
    try {
      const updated = await updateOrderStatus(order._id, nextStatus);
      setOrder(updated);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
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
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="page">
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />)}
      </div>
    );
  }

  if (!order) return null;

  const isEditable = !["DELIVERED", "CANCELLED"].includes(order.status) && !order.isDeleted;
  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <>
      <div className="page animate-in">

        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="page-title">Order Details</h1>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                #{order._id?.slice(-8).toUpperCase()}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* ACTION BAR */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {isEditable && !isEditing && (
            <button className="btn btn-secondary btn-sm" onClick={handleEditStart}>
              <Edit2 size={14} /> Edit
            </button>
          )}
          {isEditing && (
            <>
              <button className="btn btn-sm" style={{ background: "var(--color-accent)", color: "white" }} onClick={handleSave}>
                <Check size={14} /> Save
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>
                <X size={14} /> Cancel
              </button>
            </>
          )}
          {nextStatuses.map(s => (
            <button
              key={s}
              className="btn btn-sm"
              disabled={statusLoading}
              onClick={() => handleStatusChange(s)}
              style={{ background: s === "DELIVERED" ? "var(--color-accent)" : "#F59E0B", color: "white" }}
            >
              {statusLoading ? "…" : `Mark ${s}`}
            </button>
          ))}
          {order.payment?.remainingAmount > 0 && (
            <button className="btn btn-sm" style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1.5px solid #BFDBFE" }} onClick={() => setShowPaymentModal(true)}>
              <IndianRupee size={14} /> Record Payment
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowBill(true)}>
            Bill
          </button>
          {isEditable && (
            <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

        {/* WHATSAPP ROW */}
        {order.clientSnapshot?.phone && (
          <div className="card" style={{ padding: "14px 16px", marginBottom: 12, background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Send on WhatsApp</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <WhatsAppBtn label="Confirmation" url={getConfirmationUrl(order, businessName)} color="#15803D" bg="#DCFCE7" />
              {order.payment?.remainingAmount > 0 && (
                <WhatsAppBtn label="Pay Reminder" url={getPaymentReminderUrl(order, businessName)} color="#B45309" bg="#FEF9C3" />
              )}
              <WhatsAppBtn label="Bill" url={getBillUrl(order, businessName, business?.upiId)} color="#1D4ED8" bg="#DBEAFE" />
            </div>
          </div>
        )}

        {/* CUSTOMER */}
        <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
          <p className="section-label">Customer</p>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="input" placeholder="Name" value={formData.clientSnapshot?.name || ""} onChange={e => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, name: e.target.value } })} />
              <input className="input" placeholder="Phone" value={formData.clientSnapshot?.phone || ""} onChange={e => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, phone: e.target.value } })} />
              <input className="input" placeholder="Address" value={formData.clientSnapshot?.address || ""} onChange={e => setFormData({ ...formData, clientSnapshot: { ...formData.clientSnapshot, address: e.target.value } })} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text-primary)" }}>{order.clientSnapshot?.name}</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>📞 {order.clientSnapshot?.phone}</p>
              {order.clientSnapshot?.address && <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>📍 {order.clientSnapshot?.address}</p>}
            </div>
          )}
        </div>

        {/* DATES */}
        <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
          <p className="section-label">Dates</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 4 }}>Order Date</p>
              {isEditing
                ? <input type="date" className="input" value={formData.orderDate} onChange={e => setFormData({ ...formData, orderDate: e.target.value })} />
                : <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{formatDate(order.orderDate)}</p>
              }
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 4 }}>Delivery Date</p>
              {isEditing
                ? <input type="date" className="input" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
                : <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{formatDate(order.deliveryDate)}</p>
              }
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
          <p className="section-label">Order Items</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < order.items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>{item.productName}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="amount" style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT SUMMARY */}
        <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
          <p className="section-label">Payment</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PayRow label="Subtotal" value={formatCurrency(order.financial?.subtotal)} />
            {order.financial?.discountAmount > 0 && <PayRow label="Discount" value={`-${formatCurrency(order.financial.discountAmount)}`} valueColor="var(--color-success)" />}
            {order.financial?.taxAmount > 0 && <PayRow label={`Tax (${order.financial.taxRate}%)`} value={formatCurrency(order.financial.taxAmount)} />}
            <div style={{ height: 1, background: "var(--color-border)" }} />
            <PayRow label="Total" value={formatCurrency(order.financial?.total)} bold />
            <PayRow label="Amount Paid" value={formatCurrency(order.payment?.totalPaid)} valueColor="var(--color-success)" />
            <div style={{ height: 1, background: "var(--color-border)" }} />
            <PayRow
              label="Balance Due"
              value={formatCurrency(order.payment?.remainingAmount)}
              valueColor={order.payment?.remainingAmount > 0 ? "var(--color-danger)" : "var(--color-success)"}
              bold
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <StatusBadge status={order.payment?.status} />
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        {order.payment?.transactions?.length > 0 && (
          <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
            <p className="section-label">Payment History</p>
            {order.payment.transactions.map((txn, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < order.payment.transactions.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div>
                  <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{txn.method}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                    {formatDate(txn.recordedAt)}{txn.note ? ` · ${txn.note}` : ""}
                  </p>
                </div>
                <p className="amount" style={{ fontWeight: 600, color: "var(--color-success)" }}>{formatCurrency(txn.amount)}</p>
              </div>
            ))}
          </div>
        )}

        {/* NOTES */}
        {(order.notes || isEditing) && (
          <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
            <p className="section-label">Notes</p>
            {isEditing
              ? <textarea className="input" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Add notes..." />
              : <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{order.notes}</p>
            }
          </div>
        )}
      </div>

      {showBill && (
        <BillModal
          order={order}
          onClose={() => setShowBill(false)}
          business={business}
        />
      )}
      {showPaymentModal && (
        <RecordPaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(updated) => { setOrder(updated); setShowPaymentModal(false); }}
        />
      )}
    </>
  );
}

function WhatsAppBtn({ label, url, color, bg }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-sm"
      style={{ background: bg, color, border: `1.5px solid ${color}33`, textDecoration: "none" }}
    >
      <MessageCircle size={13} /> {label}
    </a>
  );
}

function PayRow({ label, value, valueColor, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{label}</span>
      <span className="amount" style={{ fontSize: bold ? "1rem" : "0.9375rem", fontWeight: bold ? 700 : 500, color: valueColor || "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}