// src/pages/Products.jsx
import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/product.api";
import { formatCurrency } from "../utils/currency.util";
import { Plus, Edit2, Trash2, X, Package } from "lucide-react";

const UNITS = ["piece", "kg", "gram", "liter", "ml", "box", "bundle", "bag", "set", "unit"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaved = () => {
    setShowForm(false);
    setEditingProduct(null);
    load();
  };

  const handleDelete = async (product) => {
    try {
      await deleteProduct(product._id);
      setDeleteConfirm(null);
      load();
    } catch {
      alert("Failed to delete product");
    }
  };

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">Quick-add items when creating orders</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <Package size={22} color="var(--color-text-tertiary)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>No products yet</p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>Add products to speed up order creation</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map((product) => (
            <div key={product._id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={18} color="var(--color-accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>{product.name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                  <span className="amount">{formatCurrency(product.basePrice)}</span> / {product.unit}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingProduct(product); setShowForm(true); }}>
                  <Edit2 size={15} />
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteConfirm(product)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation bottom sheet */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 44, height: 44, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={20} color="var(--color-danger)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>Delete product?</p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 20 }}>
              "{deleteConfirm.name}" will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name || "",
    unit: product?.unit || "piece",
    basePrice: product?.basePrice ?? "",
    description: product?.description || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (form.basePrice === "" || Number(form.basePrice) < 0) { setError("Valid price is required"); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateProduct(product._id, { ...form, basePrice: Number(form.basePrice) });
      } else {
        await createProduct({ ...form, basePrice: Number(form.basePrice) });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 16px" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-text-primary)" }}>
            {isEdit ? "Edit product" : "Add product"}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{ margin: "0 20px 14px", background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="section-label">Product name</label>
            <input className="input" placeholder="e.g. Rose Plant, Soil Mix" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="section-label">Price (₹)</label>
              <input className="input" type="number" placeholder="0" min="0" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
            </div>
            <div>
              <label className="section-label">Unit</label>
              <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="section-label">Description (optional)</label>
            <input className="input" placeholder="Short description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4, paddingBottom: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}