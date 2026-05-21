// src/components/payments/RecordPaymentModal.jsx
import { useState } from "react";
import { recordPayment } from "../../services/order.api";
import { formatCurrency } from "../../utils/currency.util";
import { X } from "lucide-react";

const METHODS = [
  { key: "CASH", label: "Cash" },
  { key: "UPI", label: "UPI" },
  { key: "BANK_TRANSFER", label: "Bank" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "OTHER", label: "Other" },
];

export default function RecordPaymentModal({ order, onClose, onSuccess }) {
  const remaining = order.payment?.remainingAmount || 0;
  const [form, setForm] = useState({
    amount: remaining,
    method: "CASH",
    reference: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be greater than 0"); return; }
    if (Number(form.amount) > remaining) { setError(`Cannot exceed balance: ${formatCurrency(remaining)}`); return; }
    setLoading(true);
    try {
      const updated = await recordPayment(order._id, {
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        note: form.note || undefined,
      });
      onSuccess(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-in"
        style={{
          background: "var(--color-surface)",
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 480,
          paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 0" }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>Record Payment</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>
              {order.clientSnapshot?.name}
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Balance pill */}
        <div style={{ margin: "14px 20px", padding: "12px 16px", background: "var(--color-danger-light)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-danger)", fontWeight: 500 }}>Balance Due</p>
          <p className="amount" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-danger)" }}>
            {formatCurrency(remaining)}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="section-label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="input"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              autoFocus
            />
          </div>

          {/* Method */}
          <div>
            <label className="section-label">Payment Method</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {METHODS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setForm({ ...form, method: m.key })}
                  style={{
                    height: 36,
                    padding: "0 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8125rem",
                    fontWeight: form.method === m.key ? 600 : 400,
                    background: form.method === m.key ? "var(--color-cta)" : "var(--color-surface)",
                    color: form.method === m.key ? "white" : "var(--color-text-secondary)",
                    border: `1.5px solid ${form.method === m.key ? "var(--color-cta)" : "var(--color-border)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference — only show for UPI/Bank/Cheque */}
          {["UPI", "BANK_TRANSFER", "CHEQUE"].includes(form.method) && (
            <div>
              <label className="section-label">Reference No. (optional)</label>
              <input
                type="text"
                className="input"
                placeholder={form.method === "UPI" ? "UPI transaction ID" : form.method === "CHEQUE" ? "Cheque number" : "Transfer reference"}
                value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })}
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="section-label">Note (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Paid at delivery"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, paddingTop: 4, paddingBottom: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? "Recording…" : `Record ${formatCurrency(form.amount || 0)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}