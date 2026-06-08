// src/pages/Products.jsx
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/product.api";
import { formatCurrency } from "../utils/currency.util";
import { Plus, Edit2, Trash2, X, Package, Globe, EyeOff, Camera } from "lucide-react";

const UNITS = ["piece", "kg", "gram", "liter", "ml", "box", "bundle", "bag", "set", "unit"];

const labelStyle = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary)",
  display: "block",
  marginBottom: 6,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

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

  const togglePublic = async (product) => {
    setTogglingId(product._id);
    try {
      await updateProduct(product._id, { isPublic: !product.isPublic });
      load();
    } catch {
      alert("Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className="page animate-in">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">Product Catalog</h1>
            <p className="page-subtitle">Manage products and your public storefront</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus size={16} /> Add
          </button>
        </div>

        <div style={{ background: "var(--color-accent-light)", border: "1px solid #C7D2FE", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: "0.8125rem", color: "var(--color-accent)" }}>
            Toggle <strong>Show on Store</strong> to make products visible on your public storefront.
          </p>
        </div>

        {loading ? (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon"><Package size={22} color="var(--color-text-tertiary)" /></div>
            <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>No products yet</p>
            <p style={{ fontSize: "0.875rem", marginTop: 4 }}>Add products to speed up order creation</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {products.map((product) => (
              <div key={product._id} className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Package size={18} color="var(--color-text-tertiary)" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                    {product.isPublic && (
                      <span style={{ flexShrink: 0, fontSize: "0.625rem", fontWeight: 600, background: "#EEF2FF", color: "var(--color-accent)", padding: "1px 6px", borderRadius: 4 }}>LIVE</span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    <span className="amount">{formatCurrency(product.basePrice)}</span> / {product.unit}
                    {product.category && <span style={{ color: "var(--color-text-tertiary)" }}> · {product.category}</span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => togglePublic(product)}
                    disabled={togglingId === product._id}
                    title={product.isPublic ? "Remove from store" : "Show on store"}
                    style={{
                      width: 34, height: 34,
                      background: product.isPublic ? "var(--color-accent-light)" : "var(--color-bg)",
                      border: `1.5px solid ${product.isPublic ? "var(--color-accent)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-sm)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: togglingId === product._id ? 0.5 : 1, transition: "opacity 0.15s",
                    }}
                  >
                    {product.isPublic ? <Globe size={15} color="var(--color-accent)" /> : <EyeOff size={15} color="var(--color-text-tertiary)" />}
                  </button>
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
      </div>

      {/* DELETE CONFIRM — rendered in body via portal */}
      {deleteConfirm && createPortal(
        <div
          data-modal="true"
          onClick={() => setDeleteConfirm(null)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 44, height: 44, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={20} color="var(--color-danger)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>Delete product?</p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 20 }}>"{deleteConfirm.name}" will be permanently removed.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PRODUCT FORM — rendered in body via portal */}
      {showForm && createPortal(
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={handleSaved}
        />,
        document.body
      )}
    </>
  );
}

function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    name: product?.name || "",
    unit: product?.unit || "piece",
    basePrice: product?.basePrice ?? "",
    description: product?.description || "",
    category: product?.category || "",
    minOrderQty: product?.minOrderQty || 1,
    trackStock: product?.trackStock || false,
    stock: product?.stock ?? "",
    isPublic: product?.isPublic || false,
  });
  const [previewImages, setPreviewImages] = useState(product?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 3 - previewImages.length;
    if (remaining <= 0) return;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result]);
        setNewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const removed = previewImages[index];
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (removed.startsWith("data:")) {
      setNewImages(prev => prev.filter(img => img !== removed));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (form.basePrice === "" || Number(form.basePrice) < 0) { setError("Valid price is required"); return; }
    setLoading(true);
    try {
      const existingUrls = previewImages.filter(img => img.startsWith("http"));
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        minOrderQty: Number(form.minOrderQty) || 1,
        stock: form.trackStock && form.stock !== "" ? Number(form.stock) : null,
        images: [...existingUrls, ...newImages].slice(0, 3),
      };
      if (isEdit) {
        await updateProduct(product._id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.5)",
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
          maxHeight: "calc(100dvh - 60px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Fixed header */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 12px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, background: "var(--color-bg)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

            {error && (
              <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "9px 13px", fontSize: "0.8125rem" }}>
                {error}
              </div>
            )}

            {/* Photos */}
            <div>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                Photos <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem" }}>(up to 3)</span>
              </p>
              {previewImages.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{ width: "100%", height: 88, border: "1.5px dashed var(--color-border-strong)", borderRadius: "var(--radius-lg)", background: "var(--color-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                >
                  <Camera size={20} color="var(--color-text-tertiary)" />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>Add product photos</span>
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  {previewImages.map((img, i) => (
                    <div key={i} style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                      <img src={img} alt="" style={{ width: 76, height: 76, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "block" }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, background: "var(--color-danger)", border: "2px solid white", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 3 && (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ width: 76, height: 76, border: "1.5px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-bg)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
                      <Camera size={16} color="var(--color-text-tertiary)" />
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>Add</span>
                    </button>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageSelect} />
            </div>

            {/* Name */}
            <div>
              <label style={labelStyle}>Product Name *</label>
              <input className="input" placeholder="e.g. Rose Plant, Cotton T-shirt" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            {/* Price + Unit */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Price (₹) *</label>
                <input className="input" type="number" placeholder="0" min="0" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>optional</span></label>
              <input className="input" placeholder="e.g. Plants, T-shirts" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>optional</span></label>
              <textarea className="input" rows={2} placeholder="Shown on your storefront" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Min order qty */}
            <div>
              <label style={labelStyle}>Min. Order Qty</label>
              <input className="input" type="number" min="1" value={form.minOrderQty} onChange={e => setForm({ ...form, minOrderQty: e.target.value })} />
            </div>

            {/* Toggles */}
            <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-surface)" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>Track Stock</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 1 }}>Pause orders when stock hits 0</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, trackStock: !form.trackStock })} style={{ width: 44, height: 24, background: form.trackStock ? "var(--color-accent)" : "var(--color-border)", borderRadius: 99, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", top: 3, left: form.trackStock ? 23 : 3, transition: "left 0.2s" }} />
                </button>
              </div>

              {form.trackStock && (
                <div style={{ background: "var(--color-bg)", padding: "12px 14px", borderTop: "1px solid var(--color-border)" }}>
                  <label style={labelStyle}>Current Stock</label>
                  <input className="input" type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
              )}

              <div style={{ height: 1, background: "var(--color-border)" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: form.isPublic ? "var(--color-accent-light)" : "var(--color-surface)", transition: "background 0.2s" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: form.isPublic ? "var(--color-accent)" : "var(--color-text-primary)" }}>Show on Store</p>
                    {form.isPublic && <span style={{ fontSize: "0.5625rem", fontWeight: 700, background: "var(--color-accent)", color: "white", padding: "1px 5px", borderRadius: 3 }}>LIVE</span>}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: form.isPublic ? "var(--color-accent)" : "var(--color-text-tertiary)", marginTop: 1, opacity: form.isPublic ? 0.8 : 1 }}>
                    {form.isPublic ? "Visible on your public storefront" : "Hidden from storefront"}
                  </p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, isPublic: !form.isPublic })} style={{ width: 44, height: 24, background: form.isPublic ? "var(--color-accent)" : "var(--color-border)", borderRadius: 99, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", top: 3, left: form.isPublic ? 23 : 3, transition: "left 0.2s" }} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 2 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}