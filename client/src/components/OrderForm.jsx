// src/components/OrderForm.jsx
import { useState } from "react";
import { createOrder } from "../services/order.api";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../utils/currency.util";

const DEFAULT_ITEM = { productName: "", quantity: "", unitPrice: "", unit: "piece" };

export default function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clientSnapshot, setClientSnapshot] = useState({ name: "", phone: "", address: "" });
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);
  const [advancePaid, setAdvancePaid] = useState("");
  const [notes, setNotes] = useState("");

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => setItems([...items, { ...DEFAULT_ITEM }]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // ── Computed totals ───────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const remaining = subtotal - (parseFloat(advancePaid) || 0);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName.trim()) { setError(`Item ${i + 1}: product name is required`); return; }
      if (!item.quantity || parseFloat(item.quantity) <= 0) { setError(`Item ${i + 1}: quantity must be greater than 0`); return; }
      if (item.unitPrice === "" || parseFloat(item.unitPrice) < 0) { setError(`Item ${i + 1}: price is required`); return; }
    }

    if (remaining < 0) { setError("Advance paid cannot exceed total amount"); return; }

    const payload = {
      clientSnapshot,
      orderDate,
      deliveryDate,
      items: items.map((item) => ({
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        unit: item.unit || "piece",
      })),
      advancePaid: parseFloat(advancePaid) || 0,
      notes: notes.trim() || undefined,
    };

    setLoading(true);
    try {
      await createOrder(payload);
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Create Order</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in customer details and order items</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* ── CUSTOMER ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Customer Name *"
                required
                className="input"
                value={clientSnapshot.name}
                onChange={(e) => setClientSnapshot({ ...clientSnapshot, name: e.target.value })}
              />
              <input
                placeholder="Phone Number *"
                required
                className="input"
                value={clientSnapshot.phone}
                onChange={(e) => setClientSnapshot({ ...clientSnapshot, phone: e.target.value })}
              />
            </div>
            <input
              placeholder="Address"
              className="input w-full"
              value={clientSnapshot.address}
              onChange={(e) => setClientSnapshot({ ...clientSnapshot, address: e.target.value })}
            />
          </section>

          {/* ── DATES ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Order Date</label>
                <input type="date" required className="input w-full" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Delivery Date</label>
                <input type="date" required className="input w-full" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            </div>
          </section>

          {/* ── ITEMS ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Items</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <input
                    placeholder="Product Name *"
                    required
                    className="input w-full"
                    value={item.productName}
                    onChange={(e) => updateItem(index, "productName", e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Qty *"
                      required
                      min="0.01"
                      step="0.01"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    />
                    <select
                      className="input"
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                    >
                      {["piece", "kg", "liter", "box", "bundle", "set"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Price ₹ *"
                      required
                      min="0"
                      step="0.01"
                      className="input"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                    />
                  </div>
                  {item.quantity && item.unitPrice && (
                    <p className="text-xs text-right text-gray-500">
                      = {formatCurrency(parseFloat(item.quantity) * parseFloat(item.unitPrice))}
                    </p>
                  )}
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition">
                      <Trash2 size={13} /> Remove item
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Item
            </button>
          </section>

          {/* ── PAYMENT ── */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment</h3>
            <input
              type="number"
              placeholder="Advance Paid (₹)"
              min="0"
              step="0.01"
              className="input w-full"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
            />

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Advance Paid</span>
                <span className="text-green-600">{formatCurrency(parseFloat(advancePaid) || 0)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 border-t pt-2">
                <span>Balance Due</span>
                <span className={remaining < 0 ? "text-red-600" : "text-gray-900"}>{formatCurrency(Math.max(0, remaining))}</span>
              </div>
            </div>
          </section>

          {/* ── NOTES ── */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes (optional)</h3>
            <textarea
              rows={2}
              placeholder="Any special instructions..."
              className="input w-full resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* ── FOOTER ── */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
            >
              {loading ? "Creating…" : "Create Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}