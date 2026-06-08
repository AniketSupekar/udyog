// src/pages/StoreOrderConfirm.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStorefrontOrderStatus } from "../services/store.api";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import { CheckCircle, Clock, Package, Truck, XCircle, MessageCircle, Copy, Check } from "lucide-react";

const F = { sans: "Inter, sans-serif" };

const STATUS_CONFIG = {
  CREATED:   { icon: Clock,    color: "#6366F1", bg: "#EEF2FF", label: "Order Received",  desc: "We've received your order and will confirm it shortly." },
  PENDING:   { icon: Package,  color: "#D97706", bg: "#FFFBEB", label: "Being Prepared",  desc: "Your order is being prepared." },
  DELIVERED: { icon: Truck,    color: "#15803D", bg: "#F0FDF4", label: "Delivered",        desc: "Your order has been delivered. Thank you!" },
  CANCELLED: { icon: XCircle,  color: "#B91C1C", bg: "#FEF2F2", label: "Cancelled",        desc: "This order has been cancelled. Contact us for help." },
};

export default function StoreOrderConfirm() {
  const { slug, orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getStorefrontOrderStatus(slug, orderId)
      .then(res => setOrder(res.data.data))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [slug, orderId]);

  const copyRef = () => {
    navigator.clipboard.writeText(`#${order.orderRef}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E4E4E7", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: "0.875rem", color: "#8A8A8E" }}>Loading order…</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600, color: "#0F1117", marginBottom: 8 }}>Order not found</p>
        <Link to={`/store/${slug}`} style={{ color: "#6366F1", fontSize: "0.875rem" }}>← Back to store</Link>
      </div>
    </div>
  );

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.CREATED;
  const Icon = cfg.icon;

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", fontFamily: F.sans }}>

      {/* Top color band */}
      <div style={{ background: cfg.color, padding: "32px 16px 48px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Icon size={30} color="white" />
        </div>
        <p style={{ fontWeight: 700, fontSize: "1.375rem", color: "white", marginBottom: 4 }}>{cfg.label}</p>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>{cfg.desc}</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 32px", marginTop: -24 }}>

        {/* Order ref card */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E4E4E7", padding: "16px 20px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#8A8A8E", marginBottom: 2 }}>Order Reference</p>
            <p style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0F1117", fontFamily: "monospace", letterSpacing: "0.05em" }}>#{order.orderRef}</p>
          </div>
          <button
            onClick={copyRef}
            style={{ display: "flex", alignItems: "center", gap: 6, background: copied ? "#F0FDF4" : "#F4F4F5", color: copied ? "#15803D" : "#6B7280", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, fontFamily: F.sans, transition: "all 0.2s" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Order details */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: "16px 20px", marginBottom: 12 }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8A8A8E", marginBottom: 12 }}>Order Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="Customer" value={order.customerName} />
            <Row label="Order Date" value={formatDate(order.orderDate)} />
            {order.deliveryDate && <Row label="Expected Delivery" value={formatDate(order.deliveryDate)} />}
            <Row
              label="Payment"
              value={order.remaining > 0 ? `₹${order.remaining} due` : "Paid"}
              valueColor={order.remaining > 0 ? "#B91C1C" : "#15803D"}
            />
          </div>
        </div>

        {/* Items */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", padding: "16px 20px", marginBottom: 12 }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8A8A8E", marginBottom: 12 }}>Items Ordered</p>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < order.items.length - 1 ? "1px solid #F4F4F5" : "none" }}>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#0F1117", fontWeight: 500 }}>{item.productName}</p>
                <p style={{ fontSize: "0.75rem", color: "#8A8A8E", marginTop: 1 }}>{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0F1117" }}>{formatCurrency(item.amount)}</p>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #E4E4E7" }}>
            <p style={{ fontWeight: 700, color: "#0F1117" }}>Total</p>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0F1117" }}>{formatCurrency(order.total)}</p>
          </div>
          {order.remaining > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "8px 10px", background: "#FEF2F2", borderRadius: 8 }}>
              <p style={{ fontSize: "0.875rem", color: "#B91C1C", fontWeight: 500 }}>Balance Due</p>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#B91C1C" }}>{formatCurrency(order.remaining)}</p>
            </div>
          )}
        </div>

        {/* Save ref tip */}
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: "0.8125rem", color: "#92400E", lineHeight: 1.5 }}>
            Save your order reference <strong>#{order.orderRef}</strong> to track this order later.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            to={`/store/${slug}`}
            style={{ display: "block", textAlign: "center", background: "#0F1117", color: "white", padding: "15px", borderRadius: 14, fontSize: "0.9375rem", fontWeight: 600, textDecoration: "none" }}
          >
            Continue Shopping
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#B0B0B5", marginTop: 28 }}>
          Powered by <strong style={{ color: "#6366F1" }}>Udyog</strong>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>{label}</p>
      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: valueColor || "#0F1117" }}>{value}</p>
    </div>
  );
}