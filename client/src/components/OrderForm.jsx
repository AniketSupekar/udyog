import { useState, useEffect } from "react";
import { createOrder } from "../services/order.api";
import { getProducts } from "../services/product.api";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Package, ChevronDown } from "lucide-react";
import { formatCurrency } from "../utils/currency.util";

const UNITS = ["piece","kg","gram","liter","ml","box","bundle","bag","set","unit"];
const DEFAULT_ITEM = { productName: "", quantity: "", unitPrice: "", costPrice: "", unit: "piece" };

export default function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [clientSnapshot, setClientSnapshot] = useState({ name: "", phone: "", address: "" });
  const [orderDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState([{ ...DEFAULT_ITEM }]);
  const [advancePaid, setAdvancePaid] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { getProducts().then(setProducts).catch(() => {}); }, []);

  const addFromCatalog = (product) => {
    const exists = items.findIndex(i => i.productName === product.name);
    if (exists >= 0) {
      const updated = [...items];
      updated[exists].quantity = String((parseFloat(updated[exists].quantity) || 0) + 1);
      setItems(updated);
    } else {
      const emptyIdx = items.findIndex(i => !i.productName.trim());
      const newItem = {
        productName: product.name,
        quantity: "1",
        unitPrice: String(product.basePrice),
        costPrice: product.costPrice != null ? String(product.costPrice) : "",
        unit: product.unit,
      };
      if (emptyIdx >= 0) { const u = [...items]; u[emptyIdx] = newItem; setItems(u); }
      else setItems([...items, newItem]);
    }
    setShowCatalog(false);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) =>
    sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  const remaining = subtotal - (parseFloat(advancePaid) || 0);

  const validate = (isQuote) => {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productName.trim()) { setError(`Item ${i+1}: product name required`); return false; }
      if (!items[i].quantity || parseFloat(items[i].quantity) <= 0) { setError(`Item ${i+1}: quantity must be > 0`); return false; }
      if (items[i].unitPrice === "" || parseFloat(items[i].unitPrice) < 0) { setError(`Item ${i+1}: price required`); return false; }
    }
    if (!isQuote && !deliveryDate) { setError("Delivery date is required for orders"); return false; }
    if (remaining < 0) { setError("Advance cannot exceed total"); return false; }
    return true;
  };

  const handleSubmit = async (isQuote = false) => {
    setError("");
    if (!validate(isQuote)) return;
    setLoading(true);
    try {
      await createOrder({
        clientSnapshot,
        orderDate,
        deliveryDate: deliveryDate || undefined,
        items: items.map(i => ({
          productName: i.productName.trim(),
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
          unit: i.unit || "piece",
          costPrice: i.costPrice !== "" && i.costPrice != null ? parseFloat(i.costPrice) : null,
        })),
        advancePaid: parseFloat(advancePaid) || 0,
        notes: notes.trim() || undefined,
        isQuote,
      });
      navigate(isQuote ? "/orders?showQuotes=true" : "/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page animate-in">
      <div className="page-header">
        <button onClick={() => navigate(-1)} style={{ fontSize: "0.875rem", color: "var(--color-accent)", marginBottom: 8, display: "block", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Back</button>
        <h1 className="page-title">Create Order</h1>
        <p className="page-subtitle">Fill in the details below</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {error && (
          <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "12px 16px", fontSize: "0.875rem", fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* CUSTOMER */}
        <div className="card" style={{ padding: "16px" }}>
          <p className="section-label">Customer Details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input className="input" placeholder="Customer Name *" required value={clientSnapshot.name} onChange={e => setClientSnapshot({ ...clientSnapshot, name: e.target.value })} />
            <input className="input" placeholder="Phone Number *" required value={clientSnapshot.phone} onChange={e => setClientSnapshot({ ...clientSnapshot, phone: e.target.value })} />
            <input className="input" placeholder="Address (optional)" value={clientSnapshot.address} onChange={e => setClientSnapshot({ ...clientSnapshot, address: e.target.value })} />
          </div>
        </div>

        {/* DATES */}
        <div className="card" style={{ padding: "16px" }}>
          <p className="section-label">Dates</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: 6 }}>Order Date</p>
              <input type="date" className="input" value={orderDate} readOnly style={{ background: "var(--color-bg)" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Delivery Date
                <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}> (optional for quotes)</span>
              </p>
              <input type="date" className="input" value={deliveryDate} min={orderDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="card" style={{ padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="section-label" style={{ marginBottom: 0 }}>Order Items</p>
            {products.length > 0 && (
              <button type="button" className="btn btn-sm" onClick={() => setShowCatalog(!showCatalog)}
                style={{ background: "#F0FDF4", color: "#15803D", border: "1.5px solid #BBF7D0", gap: 5 }}>
                <Package size={13} /> Catalog <ChevronDown size={12} />
              </button>
            )}
          </div>

          {showCatalog && (
            <div className="animate-in" style={{ background: "var(--color-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: 12, overflow: "hidden" }}>
              {products.map(p => (
                <button key={p._id} type="button" onClick={() => addFromCatalog(p)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderBottom: "1px solid var(--color-border)", background: "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <div style={{ textAlign: "left" }}>
                    <span style={{ fontWeight: 500, fontSize: "0.9rem", display: "block" }}>{p.name}</span>
                    {p.costPrice && <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>Cost: {formatCurrency(p.costPrice)}</span>}
                  </div>
                  <span className="amount" style={{ fontSize: "0.875rem", color: "var(--color-accent)" }}>{formatCurrency(p.basePrice)}/{p.unit}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, index) => (
              <div key={index} style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", background: "var(--color-bg)", display: "flex", flexDirection: "column", gap: 8 }}>
                <input className="input" placeholder="Product name *" value={item.productName} onChange={e => updateItem(index, "productName", e.target.value)} required />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <input className="input" type="number" placeholder="Qty" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(index, "quantity", e.target.value)} required />
                  <select className="input" value={item.unit} onChange={e => updateItem(index, "unit", e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="₹ Sell" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, "unitPrice", e.target.value)} required />
                </div>
                <input
                  className="input"
                  type="number"
                  placeholder="₹ Cost (optional - for profit tracking)"
                  min="0" step="0.01"
                  value={item.costPrice}
                  onChange={e => updateItem(index, "costPrice", e.target.value)}
                  style={{ fontSize: "0.8125rem", background: "var(--color-surface)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {item.quantity && item.unitPrice ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span className="amount" style={{ fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 600 }}>
                        = {formatCurrency(parseFloat(item.quantity) * parseFloat(item.unitPrice))}
                      </span>
                      {item.costPrice && item.quantity && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                          Margin: {formatCurrency((parseFloat(item.unitPrice) - parseFloat(item.costPrice)) * parseFloat(item.quantity))}
                        </span>
                      )}
                    </div>
                  ) : <span />}
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer" }}>
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setItems([...items, { ...DEFAULT_ITEM }])}
            style={{ width: "100%", marginTop: 10, padding: "11px", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.875rem", color: "var(--color-text-secondary)", background: "none", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}>
            <Plus size={15} /> Add Item
          </button>
        </div>

        {/* PAYMENT */}
        <div className="card" style={{ padding: "16px" }}>
          <p className="section-label">Payment</p>
          <input className="input" type="number" placeholder="Advance Paid (₹)" min="0" step="0.01" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)} style={{ marginBottom: 12 }} />
          <div style={{ background: "var(--color-bg)", borderRadius: "var(--radius-md)", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Subtotal</span>
              <span className="amount" style={{ fontSize: "0.9375rem" }}>{formatCurrency(subtotal)}</span>
            </div>
            {advancePaid && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Advance</span>
                <span className="amount" style={{ fontSize: "0.9375rem", color: "var(--color-accent)" }}>-{formatCurrency(parseFloat(advancePaid) || 0)}</span>
              </div>
            )}
            <div style={{ height: 1, background: "var(--color-border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)" }}>Balance Due</span>
              <span className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: remaining < 0 ? "var(--color-danger)" : "var(--color-text-primary)" }}>{formatCurrency(Math.max(0, remaining))}</span>
            </div>
          </div>
        </div>

        {/* NOTES */}
        <div className="card" style={{ padding: "16px" }}>
          <p className="section-label">Notes (optional)</p>
          <textarea className="input" rows={2} placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* SUBMIT — two buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => handleSubmit(false)}
          >
            {loading ? "Creating…" : "Create Order"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            style={{
              width: "100%", padding: "13px",
              background: "#F5F3FF", color: "#6D28D9",
              border: "1.5px solid #DDD6FE",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.9375rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            {loading ? "Saving…" : "Save as Quote"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}