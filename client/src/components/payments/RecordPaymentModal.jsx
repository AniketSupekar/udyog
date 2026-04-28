// src/components/payments/RecordPaymentModal.jsx
import { useState } from "react";
import { recordPayment } from "../../services/order.api";
import { formatCurrency } from "../../utils/currency.util";
import { X } from "lucide-react";

const METHODS = ["CASH","UPI","BANK_TRANSFER","CHEQUE","OTHER"];

export default function RecordPaymentModal({ order, onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: order.payment?.remainingAmount || "", method: "CASH", reference: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Amount must be > 0"); return; }
    if (Number(form.amount) > order.payment?.remainingAmount) { setError(`Cannot exceed balance: ${formatCurrency(order.payment?.remainingAmount)}`); return; }
    setLoading(true);
    try {
      const updated = await recordPayment(order._id, { amount: Number(form.amount), method: form.method, reference: form.reference || undefined, note: form.note || undefined });
      onSuccess(updated);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", width: "100%", maxWidth: 480, paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Record Payment</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--color-border)", marginBottom: 4 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Balance Due</p>
          <p className="amount" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-danger)" }}>{formatCurrency(order.payment?.remainingAmount)}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.875rem" }}>{error}</div>}
          <div>
            <label className="section-label">Amount (₹)</label>
            <input type="number" step="0.01" required className="input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="section-label">Payment Method</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {METHODS.map(m => (
                <button key={m} type="button" className="btn btn-sm" onClick={() => setForm({ ...form, method: m })}
                  style={{ background: form.method === m ? "var(--color-accent)" : "var(--color-surface)", color: form.method === m ? "white" : "var(--color-text-secondary)", border: `1.5px solid ${form.method === m ? "var(--color-accent)" : "var(--color-border)"}` }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="section-label">Reference (optional)</label>
            <input type="text" className="input" placeholder="UPI ref, cheque no..." value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="section-label">Note (optional)</label>
            <input type="text" className="input" placeholder="e.g. Paid at delivery" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? "Recording…" : "Record Payment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}