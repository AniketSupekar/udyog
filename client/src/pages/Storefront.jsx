// src/pages/Storefront.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getStorefront, placeStorefrontOrder } from "../services/store.api";
import { formatCurrency } from "../utils/currency.util";
import { ShoppingCart, Plus, Minus, X, MessageCircle, Package, ChevronRight, AlertTriangle, ChevronLeft, Info } from "lucide-react";

const F = { sans: "Inter, sans-serif" };

export default function Storefront() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    getStorefront(slug)
      .then(res => {
        setStore(res.data.data.store);
        setProducts(res.data.data.products);
      })
      .catch(() => setError("Store not found or unavailable"))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product, qty) => {
    setCart(prev => ({ ...prev, [product._id]: (prev[product._id] || 0) + qty }));
  };

  const updateQty = (productId, qty, minQty = 1) => {
    if (qty <= 0) {
      const next = { ...cart };
      delete next[productId];
      setCart(next);
    } else {
      setCart(prev => ({ ...prev, [productId]: qty }));
    }
  };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p._id === id), qty }))
    .filter(i => i.product);
  const cartTotal = cartItems.reduce((s, { product, qty }) => s + product.basePrice * qty, 0);
  const categories = [...new Set(products.map(p => p.category || "All"))];

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) setActiveCategory(categories[0]);
  }, [categories.length]);

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E4E4E7", borderTopColor: "#6366F1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: "0.875rem", color: "#8A8A8E" }}>Loading store…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 52, height: 52, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <AlertTriangle size={24} color="#B91C1C" />
        </div>
        <p style={{ fontWeight: 600, color: "#0F1117", marginBottom: 6 }}>Store not found</p>
        <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>This store link may be invalid or unavailable.</p>
      </div>
    </div>
  );

  const filteredProducts = activeCategory
    ? products.filter(p => (p.category || "All") === activeCategory)
    : products;

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F7F8", fontFamily: F.sans, paddingBottom: cartCount > 0 ? 88 : 32 }}>

      {/* ── HEADER ── */}
      <div style={{ background: "#0F1117", color: "white", padding: "20px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 2 }}>{store.name}</h1>
            {store.tagline && <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}>{store.tagline}</p>}
          </div>
          {store.whatsappNumber && (
            <a
              href={`https://wa.me/91${store.whatsappNumber.replace(/\D/g, "").slice(-10)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, background: "#16A34A", borderRadius: "50%", flexShrink: 0, marginLeft: 12 }}
            >
              <MessageCircle size={17} color="white" />
            </a>
          )}
        </div>
      </div>

      {/* ── BANNERS ── */}
      {!store.acceptingOrders && (
        <div style={{ background: "#FFFBEB", borderBottom: "1px solid #FCD34D", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} color="#B45309" />
          <p style={{ fontSize: "0.8125rem", color: "#B45309", fontWeight: 500 }}>Not accepting orders right now</p>
        </div>
      )}
      {store.deliveryNote && (
        <div style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.875rem" }}>📦</span>
          <p style={{ fontSize: "0.8125rem", color: "#1D4ED8" }}>{store.deliveryNote}</p>
        </div>
      )}

      {/* ── CATEGORY TABS ── */}
      {categories.length > 1 && (
        <div style={{ background: "white", borderBottom: "1px solid #E4E4E7", overflowX: "auto", display: "flex", gap: 0, padding: "0 12px" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "12px 14px",
                fontSize: "0.875rem",
                fontWeight: activeCategory === cat ? 600 : 400,
                color: activeCategory === cat ? "#0F1117" : "#6B7280",
                background: "none",
                border: "none",
                borderBottom: activeCategory === cat ? "2px solid #0F1117" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: F.sans,
                transition: "color 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── PRODUCTS ── */}
      <div style={{ padding: "12px 16px" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <Package size={36} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 600, color: "#0F1117" }}>No products available</p>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: 4 }}>Check back soon</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredProducts.map(product => {
              const qty = cart[product._id] || 0;
              const outOfStock = product.trackStock && product.stock !== null && product.stock <= 0;
              return (
                <ProductCard
                  key={product._id}
                  product={product}
                  qty={qty}
                  outOfStock={outOfStock}
                  acceptingOrders={store.acceptingOrders}
                  onTap={() => setSelectedProduct(product)}
                  onAdd={() => addToCart(product, product.minOrderQty || 1)}
                  onUpdate={(q) => updateQty(product._id, q, product.minOrderQty || 1)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── CART BAR ── */}
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))", background: "white", borderTop: "1px solid #E4E4E7", zIndex: 40 }}>
          <button
            onClick={() => setShowCheckout(true)}
            style={{ width: "100%", height: 50, background: "#0F1117", color: "white", border: "none", borderRadius: 14, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 14px", fontFamily: F.sans }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={15} color="white" />
              </div>
              <span>{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>{formatCurrency(cartTotal)}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* ── PRODUCT DETAIL SHEET ── */}
      {selectedProduct && createPortal(
        <ProductDetailSheet
          product={selectedProduct}
          qty={cart[selectedProduct._id] || 0}
          acceptingOrders={store.acceptingOrders}
          onClose={() => setSelectedProduct(null)}
          onAdd={(qty) => { addToCart(selectedProduct, qty); setSelectedProduct(null); }}
          onUpdate={(q) => updateQty(selectedProduct._id, q, selectedProduct.minOrderQty || 1)}
        />,
        document.body
      )}

      {/* ── CHECKOUT ── */}
      {showCheckout && createPortal(
        <CheckoutSheet
          cart={cartItems}
          total={cartTotal}
          slug={slug}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderId) => {
            setCart({});
            setShowCheckout(false);
            navigate(`/store/${slug}/order/${orderId}`);
          }}
        />,
        document.body
      )}
    </div>
  );
}

/* ─── Product Card — horizontal layout ─────────────────────────────────── */
function ProductCard({ product, qty, outOfStock, acceptingOrders, onTap, onAdd, onUpdate }) {
  return (
    <div
      style={{ background: "white", borderRadius: 14, border: "1px solid #E4E4E7", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={onTap}
    >
      {/* Image */}
      <div style={{ width: 72, height: 72, borderRadius: 10, background: "#F4F4F5", flexShrink: 0, overflow: "hidden" }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={24} color="#D1D5DB" /></div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F1117", marginBottom: 2 }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: "0.75rem", color: "#6B7280", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.description}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F1117" }}>{formatCurrency(product.basePrice)}</p>
          <span style={{ fontSize: "0.75rem", color: "#8A8A8E" }}>/ {product.unit}</span>
        </div>
        {outOfStock && <p style={{ fontSize: "0.75rem", color: "#B91C1C", marginTop: 2 }}>Out of stock</p>}
        {!outOfStock && product.trackStock && product.stock !== null && product.stock <= 5 && (
          <p style={{ fontSize: "0.75rem", color: "#D97706", marginTop: 2 }}>Only {product.stock} left</p>
        )}
      </div>

      {/* Action — stop propagation so tap on button doesn't open sheet */}
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {outOfStock ? (
          <span style={{ fontSize: "0.6875rem", color: "#B91C1C", fontWeight: 500, background: "#FEF2F2", padding: "4px 8px", borderRadius: 6 }}>Sold out</span>
        ) : qty === 0 ? (
          <button
            onClick={onAdd}
            disabled={!acceptingOrders}
            style={{ width: 36, height: 36, background: acceptingOrders ? "#0F1117" : "#E4E4E7", color: "white", border: "none", borderRadius: 10, cursor: acceptingOrders ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={18} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F4F4F5", borderRadius: 10, padding: "4px 6px" }}>
            <button onClick={() => onUpdate(qty - (product.minOrderQty || 1))} style={{ width: 26, height: 26, background: "white", border: "1px solid #E4E4E7", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minus size={13} />
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, minWidth: 18, textAlign: "center" }}>{qty}</span>
            <button onClick={() => onUpdate(qty + (product.minOrderQty || 1))} style={{ width: 26, height: 26, background: "#0F1117", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={13} color="white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Product Detail Sheet ──────────────────────────────────────────────── */
function ProductDetailSheet({ product, qty, acceptingOrders, onClose, onAdd, onUpdate }) {
  const outOfStock = product.trackStock && product.stock !== null && product.stock <= 0;
  const [localQty, setLocalQty] = useState(qty > 0 ? qty : product.minOrderQty || 1);
  const [imgIndex, setImgIndex] = useState(0);
  const images = product.images?.length ? product.images : [];
  const alreadyInCart = qty > 0;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: F.sans }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "85dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        className="animate-in"
      >
        {/* Drag handle */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, background: "#D1D5DB", borderRadius: 99 }} />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Image */}
          {images.length > 0 ? (
            <div style={{ position: "relative" }}>
              <img
                src={images[imgIndex]}
                alt={product.name}
                style={{ width: "100%", height: 220, objectFit: "cover" }}
              />
              {images.length > 1 && (
                <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} style={{ width: i === imgIndex ? 18 : 6, height: 6, borderRadius: 99, background: i === imgIndex ? "white" : "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", transition: "width 0.2s, background 0.2s", padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 120, background: "#F4F4F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={40} color="#D1D5DB" />
            </div>
          )}

          {/* Details */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F1117", flex: 1 }}>{product.name}</h2>
              {product.category && (
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, background: "#F4F4F5", color: "#6B7280", padding: "3px 8px", borderRadius: 6, marginLeft: 8, flexShrink: 0 }}>{product.category}</span>
              )}
            </div>

            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F1117", marginBottom: 4 }}>
              {formatCurrency(product.basePrice)}
              <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "#8A8A8E", marginLeft: 4 }}>/ {product.unit}</span>
            </p>

            {product.description && (
              <p style={{ fontSize: "0.875rem", color: "#4B5563", lineHeight: 1.6, marginBottom: 12 }}>{product.description}</p>
            )}

            {/* Meta info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {product.minOrderQty > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Info size={13} color="#8A8A8E" />
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280" }}>Minimum order: {product.minOrderQty} {product.unit}</p>
                </div>
              )}
              {product.trackStock && product.stock !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: outOfStock ? "#B91C1C" : product.stock <= 5 ? "#D97706" : "#16A34A", flexShrink: 0 }} />
                  <p style={{ fontSize: "0.8125rem", color: outOfStock ? "#B91C1C" : product.stock <= 5 ? "#D97706" : "#16A34A", fontWeight: 500 }}>
                    {outOfStock ? "Out of stock" : `${product.stock} ${product.unit}(s) available`}
                  </p>
                </div>
              )}
            </div>

            {/* Qty selector + Add button */}
            {!outOfStock && acceptingOrders && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F4F4F5", borderRadius: 12, padding: "6px 8px" }}>
                  <button
                    onClick={() => setLocalQty(q => Math.max(product.minOrderQty || 1, q - (product.minOrderQty || 1)))}
                    style={{ width: 32, height: 32, background: "white", border: "1px solid #E4E4E7", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Minus size={15} />
                  </button>
                  <span style={{ fontSize: "1rem", fontWeight: 700, minWidth: 28, textAlign: "center" }}>{localQty}</span>
                  <button
                    onClick={() => setLocalQty(q => q + (product.minOrderQty || 1))}
                    style={{ width: 32, height: 32, background: "#0F1117", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Plus size={15} color="white" />
                  </button>
                </div>
                <button
                  onClick={() => alreadyInCart ? onUpdate(localQty) : onAdd(localQty)}
                  style={{ flex: 1, height: 46, background: "#0F1117", color: "white", border: "none", borderRadius: 12, fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer", fontFamily: F.sans }}
                >
                  {alreadyInCart ? `Update Cart · ${formatCurrency(product.basePrice * localQty)}` : `Add to Cart · ${formatCurrency(product.basePrice * localQty)}`}
                </button>
              </div>
            )}

            {outOfStock && (
              <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <p style={{ color: "#B91C1C", fontWeight: 500, fontSize: "0.875rem" }}>This product is currently out of stock</p>
              </div>
            )}

            {!acceptingOrders && !outOfStock && (
              <div style={{ background: "#FFFBEB", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <p style={{ color: "#B45309", fontWeight: 500, fontSize: "0.875rem" }}>Store is not accepting orders right now</p>
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} color="white" />
        </button>
      </div>
    </div>
  );
}

/* ─── Checkout Sheet ────────────────────────────────────────────────────── */
function CheckoutSheet({ cart, total, slug, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Please enter your name"); return; }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid 10-digit phone number"); return; }
    setLoading(true);
    try {
      const res = await placeStorefrontOrder(slug, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: cart.map(({ product, qty }) => ({ productId: product._id, quantity: qty })),
      });
      onSuccess(res.data.data.orderId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", height: 44, border: "1px solid #E4E4E7", borderRadius: 10, padding: "0 12px", fontSize: "0.9rem", fontFamily: F.sans, outline: "none", boxSizing: "border-box", background: "#FAFAFA" };
  const labelStyle = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#3A3A3C", marginBottom: 5 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: F.sans }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Fixed header */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, background: "#D1D5DB", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 20px 12px", borderBottom: "1px solid #E4E4E7" }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0F1117" }}>Review & Place Order</h2>
            <button onClick={onClose} style={{ background: "#F4F4F5", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Order summary */}
          <div style={{ padding: "14px 20px", background: "#F9FAFB", borderBottom: "1px solid #E4E4E7" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8A8A8E", marginBottom: 10 }}>Your Items</p>
            {cart.map(({ product, qty }) => (
              <div key={product._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#E4E4E7", overflow: "hidden", flexShrink: 0 }}>
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={14} color="#9CA3AF" /></div>
                    }
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#0F1117" }}>{product.name} <span style={{ color: "#6B7280" }}>× {qty}</span></p>
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F1117" }}>{formatCurrency(product.basePrice * qty)}</p>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #E4E4E7" }}>
              <p style={{ fontWeight: 700, color: "#0F1117" }}>Total</p>
              <p style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0F1117" }}>{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            {error && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 8, padding: "10px 14px", fontSize: "0.875rem" }}>{error}</div>
            )}

            <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8A8A8E", marginBottom: -4 }}>Your Details</p>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="Enter your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" inputMode="numeric" required />
            </div>

            <div>
              <label style={labelStyle}>Delivery Address <span style={{ fontWeight: 400, color: "#8A8A8E" }}>optional</span></label>
              <textarea
                style={{ ...inputStyle, height: 72, padding: "10px 12px", resize: "none" }}
                placeholder="Enter delivery address"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Notes <span style={{ fontWeight: 400, color: "#8A8A8E" }}>optional</span></label>
              <input style={inputStyle} placeholder="Any special instructions" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", height: 50, background: loading ? "#E4E4E7" : "#0F1117", color: "white", border: "none", borderRadius: 14, fontSize: "0.9375rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: F.sans, marginTop: 4 }}
            >
              {loading ? "Placing order…" : `Place Order · ${formatCurrency(total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}