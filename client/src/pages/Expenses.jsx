import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Receipt } from "lucide-react";
import { getExpenses, createExpense, deleteExpense } from "../services/expense.api";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../utils/currency.util";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "RENT",      label: "Rent",       color: "#7C3AED", bg: "#F5F3FF" },
  { value: "SALARIES",  label: "Salaries",   color: "#1D4ED8", bg: "#EFF6FF" },
  { value: "UTILITIES", label: "Utilities",  color: "#D97706", bg: "#FEF3C7" },
  { value: "TRANSPORT", label: "Transport",  color: "#0891B2", bg: "#ECFEFF" },
  { value: "SUPPLIES",  label: "Supplies",   color: "#15803D", bg: "#F0FDF4" },
  { value: "MARKETING", label: "Marketing",  color: "#DB2777", bg: "#FDF2F8" },
  { value: "EQUIPMENT", label: "Equipment",  color: "#9F580A", bg: "#FFFBEB" },
  { value: "OTHER",     label: "Other",      color: "#6B7280", bg: "#F9FAFB" },
];

const getCat = (value) => CATEGORIES.find(c => c.value === value) || CATEGORIES[7];

const today = () => new Date().toISOString().split("T")[0];

export default function Expenses() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ title: "", amount: "", category: "OTHER", date: today(), notes: "" });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ limit: 50 });
      setExpenses(res.expenses || []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }

    setSubmitting(true);
    try {
      const expense = await createExpense({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        notes: form.notes.trim() || undefined,
      });
      setExpenses(prev => [expense, ...prev]);
      setForm({ title: "", amount: "", category: "OTHER", date: today(), notes: "" });
      setShowForm(false);
      toast.success("Expense added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeleting(id);
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e._id !== id));
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const totalThisMonth = expenses
    .filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page animate-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate("/analytics")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--color-text-secondary)", padding: 4 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ margin: 0 }}>Expenses</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Track your business costs</p>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {/* This month total */}
      <div className="card" style={{ padding: "16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>This Month</p>
          <p className="amount" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-danger)", marginTop: 2 }}>
            {formatCurrency(totalThisMonth)}
          </p>
        </div>
        <Receipt size={28} color="var(--color-border)" />
      </div>

      {/* Add form — inline bottom sheet style */}
      {showForm && (
        <div className="card animate-in" style={{ padding: "20px", marginBottom: 16, border: "1.5px solid var(--color-accent)" }}>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: 16 }}>New Expense</p>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="auth-label">Title</label>
                <input
                  className="input"
                  placeholder="e.g. Monthly rent"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="auth-label">Amount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="auth-label">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="auth-label">Category</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-full)",
                        border: form.category === cat.value ? `1.5px solid ${cat.color}` : "1.5px solid var(--color-border)",
                        background: form.category === cat.value ? cat.bg : "var(--color-surface)",
                        color: form.category === cat.value ? cat.color : "var(--color-text-secondary)",
                        fontWeight: form.category === cat.value ? 600 : 400,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="auth-label">Notes (optional)</label>
                <input
                  className="input"
                  placeholder="Any details..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  {submitting ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />)
      ) : expenses.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 16 }}>
          <div className="empty-state-icon"><Receipt size={22} color="var(--color-text-tertiary)" /></div>
          <p style={{ fontWeight: 600 }}>No expenses yet</p>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", marginTop: 4 }}>
            Tap Add to log your first expense
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {expenses.map(expense => {
            const cat = getCat(expense.category);
            return (
              <div key={expense._id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "var(--radius-md)",
                  background: cat.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: cat.color }}>{cat.label.slice(0, 3).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {expense.title}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                    {format(new Date(expense.date), "dd MMM yyyy")}
                    {expense.notes && <span> · {expense.notes}</span>}
                  </p>
                </div>
                <p className="amount" style={{ fontWeight: 700, color: "var(--color-danger)", fontSize: "0.9375rem", flexShrink: 0 }}>
                  {formatCurrency(expense.amount)}
                </p>
                <button
                  onClick={() => handleDelete(expense._id)}
                  disabled={deleting === expense._id}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}