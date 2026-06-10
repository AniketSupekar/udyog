// src/pages/Products.jsx
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/product.api";
import { updateStoreSettings } from "../services/store.api";
import { getBusinessProfile } from "../services/business.api";
import { formatCurrency } from "../utils/currency.util";
import { useToast } from "../context/ToastContext";
import {
  Plus, Edit2, Trash2, X, Package, Globe, EyeOff, Camera,
  Loader, ChevronDown, ChevronUp, Link, Check, Settings,
} from "lucide-react";

const UNITS = ["piece", "kg", "gram", "liter", "ml", "box", "bundle", "bag", "set", "unit"];
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const labelStyle = {
  fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "var(--color-text-tertiary)",
  display: "block", marginBottom: 6,
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "udyog/products");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST", body: formData,
  });
  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.secure_url;
};

/* ─── Storefront Settings Panel ─────────────────────────────────────────── */
function StorefrontPanel({ business, onUpdate }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");

  const store = business?.store || {};
  const storeUrl = store.slug ? `${APP_URL}/store/${store.slug}` : null;

  const handleToggle = async (field, value) => {
    setUpdating(true);
    try {
      const res = await updateStoreSettings({ [field]: value });
      onUpdate(res.data.data.store);
      toast.success(
        field === "isActive"
          ? (value ? "Store is now live!" : "Store deactivated")
          : "Updated"
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const handleFieldSave = async (field, value) => {
    setUpdating(true);
    try {
      const res = await updateStoreSettings({ [field]: value });
      onUpdate(res.data.data.store);
      setEditField(null);
      toast.success("Saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setUpdating(false);
    }
  };

  const storeFields = [
    { key: "slug",           label: "Store URL",        placeholder: "your-store-name",               value: store.slug,            hint: "Letters, numbers, hyphens only" },
    { key: "tagline",        label: "Tagline",           placeholder: "Quality products, fast delivery", value: store.tagline },
    { key: "whatsappNumber", label: "WhatsApp Number",   placeholder: "9876543210",                    value: store.whatsappNumber,  hint: "Customers contact you on this" },
    { key: "deliveryNote",   label: "Delivery Note",     placeholder: "Delivery within Pune only",     value: store.deliveryNote,    hint: "Shown to customers at checkout" },
  ];

  return (
    <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
      {/* Header — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: store.isActive ? "var(--color-accent-light)" : "var(--color-bg)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--color-border)" }}>
            <Globe size={16} color={store.isActive ? "var(--color-accent)" : "var(--color-text-tertiary)"} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>Storefront</p>
            <p style={{ fontSize: "0.75rem", marginTop: 1, color: store.isActive ? "var(--color-accent)" : "var(--color-text-tertiary)", fontWeight: store.isActive ? 500 : 400 }}>
              {store.isActive
                ? (store.acceptingOrders !== false ? "Live · Accepting orders" : "Live · Orders paused")
                : "Not published"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={e => { e.stopPropagation(); handleToggle("isActive", !store.isActive); }}
            disabled={updating}
            style={{ width: 44, height: 24, background: store.isActive ? "var(--color-accent)" : "var(--color-border)", borderRadius: 99, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: updating ? 0.6 : 1 }}
          >
            <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", top: 3, left: store.isActive ? 23 : 3, transition: "left 0.2s" }} />
          </button>
          {open
            ? <ChevronUp size={16} color="var(--color-text-tertiary)" />
            : <ChevronDown size={16} color="var(--color-text-tertiary)" />
          }
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid var(--color-border)" }}>
          {/* Store link */}
          {storeUrl && (
            <div style={{ padding: "12px 16px", background: "var(--color-accent-light)", borderBottom: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ flex: 1, fontSize: "0.8125rem", color: "var(--color-accent)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{storeUrl}</p>
              <button
                className="btn btn-sm"
                style={{ background: "var(--color-accent)", color: "white", flexShrink: 0 }}
                onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success("Link copied!"); }}
              >
                <Link size={13} /> Copy
              </button>
            </div>
          )}

          {/* Accept orders toggle */}
          {store.isActive && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>Accepting Orders</p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 1 }}>Pause without taking store offline</p>
              </div>
              <button
                onClick={() => handleToggle("acceptingOrders", store.acceptingOrders === false ? true : false)}
                disabled={updating}
                style={{ width: 44, height: 24, background: store.acceptingOrders !== false ? "var(--color-success)" : "var(--color-border)", borderRadius: 99, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: updating ? 0.6 : 1 }}
              >
                <div style={{ width: 18, height: 18, background: "white", borderRadius: "50%", position: "absolute", top: 3, left: store.acceptingOrders !== false ? 23 : 3, transition: "left 0.2s" }} />
              </button>
            </div>
          )}

          {/* Editable fields */}
          {storeFields.map((field, i) => (
            <div key={field.key} style={{ borderBottom: i < storeFields.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              {editField === field.key ? (
                <div style={{ padding: "12px 16px" }}>
                  <label style={labelStyle}>{field.label}</label>
                  {field.hint && <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 6 }}>{field.hint}</p>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input" style={{ flex: 1 }}
                      placeholder={field.placeholder} value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditField(null); }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => handleFieldSave(field.key, fieldValue.trim())} disabled={updating} style={{ flexShrink: 0 }}>
                      {updating ? "…" : <Check size={15} />}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditField(null)} style={{ flexShrink: 0 }}>✕</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => { setEditField(field.key); setFieldValue(field.value || ""); }}
                  style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{field.label}</p>
                    <p style={{ fontSize: "0.8125rem", color: field.value ? "var(--color-text-secondary)" : "var(--color-text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {field.value || "Tap to set"}
                    </p>
                  </div>
                  <Settings size={14} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Products Page ─────────────────────────────────────────────────── */
export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [productsData, businessData] = await Promise.all([
        getProducts(),
        getBusinessProfile(),
      ]);
      setProducts(productsData || []);
      setBusiness(businessData);
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
      toast.error("Failed to delete product");
    }
  };

  const togglePublic = async (product) => {
    setTogglingId(product._id);
    try {
      await updateProduct(product._id, { isPublic: !product.isPublic });
      load();
    } catch {
      toast.error("Failed to update");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className="page animate-in">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Catalog & storefront</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Storefront panel — loads after business data ready */}
        {!loading && (
          <StorefrontPanel
            business={business}
            onUpdate={(store) => setBusiness(prev => ({ ...prev, store }))}
          />
        )}

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
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Package size={18} color="var(--color-text-tertiary)" />
                  }
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
                    {product.costPrice > 0 && <span style={{ color: "var(--color-text-tertiary)" }}> · cost {formatCurrency(product.costPrice)}</span>}
                    {product.category && <span style={{ color: "var(--color-text-tertiary)" }}> · {product.category}</span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => togglePublic(product)}
                    disabled={togglingId === product._id}
                    title={product.isPublic ? "Remove from store" : "Show on store"}
                    style={{ width: 34, height: 34, background: product.isPublic ? "var(--color-accent-light)" : "var(--color-bg)", border: `1.5px solid ${product.isPublic ? "var(--color-accent)" : "var(--color-border)"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: togglingId === product._id ? 0.5 : 1, transition: "opacity 0.15s" }}
                  >
                    {product.isPublic
                      ? <Globe size={15} color="var(--color-accent)" />
                      : <EyeOff size={15} color="var(--color-text-tertiary)" />
                    }
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

      {deleteConfirm && createPortal(
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 44, height: 44, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={20} color="var(--color-danger)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>Delete product?</p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 20 }}>"{deleteConfirm.name}" will be removed from your catalog.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

/* ─── Product Form Modal ─────────────────────────────────────────────────── */
function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  const [images, setImages] = useState(
    (product?.images || []).map(url => ({ url, file: null, uploading: false, error: false }))
  );
  const [form, setForm] = useState({
    name: product?.name || "",
    unit: product?.unit || "piece",
    basePrice: product?.basePrice ?? "",
    costPrice: product?.costPrice ?? "",
    description: product?.description || "",
    category: product?.category || "",
    minOrderQty: product?.minOrderQty || 1,
    trackStock: product?.trackStock || false,
    stock: product?.stock ?? "",
    isPublic: product?.isPublic || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => { images.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); }); };
  }, []);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 3 - images.length;
    if (remaining <= 0) return;
    const newEntries = files.slice(0, remaining).map(file => ({
      url: URL.createObjectURL(file), file, uploading: false, error: false,
    }));
    setImages(prev => [...prev, ...newEntries]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages(prev => {
      const entry = prev[index];
      if (entry.file) URL.revokeObjectURL(entry.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (form.basePrice === "" || Number(form.basePrice) < 0) { setError("Valid selling price is required"); return; }
    if (form.costPrice !== "" && Number(form.costPrice) > Number(form.basePrice)) {
      setError("Cost price cannot be higher than selling price"); return;
    }
    if (images.some(img => img.uploading)) { setError("Please wait for images to finish uploading"); return; }
    setLoading(true);
    try {
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (!img.file) return img.url;
          return await uploadToCloudinary(img.file);
        })
      );
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        costPrice: form.costPrice !== "" ? Number(form.costPrice) : null,
        minOrderQty: Number(form.minOrderQty) || 1,
        stock: form.trackStock && form.stock !== "" ? Number(form.stock) : null,
        images: uploadedImages,
      };
      if (isEdit) {
        await updateProduct(product._id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const margin = form.basePrice && form.costPrice
    ? Math.round(((Number(form.basePrice) - Number(form.costPrice)) / Number(form.basePrice)) * 100)
    : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "calc(100dvh - 60px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 12px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>
            <button onClick={onClose} style={{ width: 30, height: 30, background: "var(--color-bg)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
            {error && (
              <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", padding: "9px 13px", fontSize: "0.8125rem" }}>
                {error}
              </div>
            )}

            {/* Photos */}
            <div>
              <p style={{ ...labelStyle, marginBottom: 8 }}>Photos <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem" }}>(up to 3)</span></p>
              {images.length === 0 ? (
                <button type="button" onClick={() => fileRef.current?.click()} style={{ width: "100%", height: 88, border: "1.5px dashed var(--color-border-strong)", borderRadius: "var(--radius-lg)", background: "var(--color-bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <Camera size={20} color="var(--color-text-tertiary)" />
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>Add product photos</span>
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
                      <img src={img.url} alt="" style={{ width: 76, height: 76, objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "block", opacity: img.uploading ? 0.5 : 1 }} />
                      {img.uploading && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Loader size={18} color="var(--color-accent)" />
                        </div>
                      )}
                      <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, background: "var(--color-danger)", border: "2px solid white", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  {images.length < 3 && (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ width: 76, height: 76, border: "1.5px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-bg)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
                      <Camera size={16} color="var(--color-text-tertiary)" />
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>Add</span>
                    </button>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageSelect} />
            </div>

            <div>
              <label style={labelStyle}>Product Name *</label>
              <input className="input" placeholder="e.g. Rose Plant, Cotton T-shirt" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Selling Price (₹) *</label>
                <input className="input" type="number" placeholder="0" min="0" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <select className="input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Cost Price (₹) <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>optional</span></label>
              <input className="input" type="number" placeholder="Your purchase cost" min="0" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} />
              {margin !== null && (
                <p style={{ fontSize: "0.75rem", marginTop: 5, fontWeight: 500, color: margin >= 20 ? "var(--color-success)" : margin >= 0 ? "var(--color-warning)" : "var(--color-danger)" }}>
                  {margin >= 0 ? `${margin}% margin · profit ${formatCurrency(Number(form.basePrice) - Number(form.costPrice))} per ${form.unit}` : "Cost exceeds selling price"}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Category <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>optional</span></label>
              <input className="input" placeholder="e.g. Plants, T-shirts" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Description <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>optional</span></label>
              <textarea className="input" rows={2} placeholder="Shown on your storefront" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label style={labelStyle}>Min. Order Qty</label>
              <input className="input" type="number" min="1" value={form.minOrderQty} onChange={e => setForm({ ...form, minOrderQty: e.target.value })} />
            </div>

            <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
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