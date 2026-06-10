// src/pages/Storefront.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getStorefront, placeStorefrontOrder, getOrdersByPhone } from "../services/store.api";
import { formatCurrency } from "../utils/currency.util";
import {
  ShoppingCart, Plus, Minus, X, MessageCircle, Package,
  ChevronRight, AlertTriangle, Info, Search, Clock, Truck,
  XCircle, MapPin, Bike,
} from "lucide-react";

const F = { sans: "'Inter', -apple-system, sans-serif" };

const STATUS_CONFIG = {
  CREATED:   { color: "#6366F1", bg: "#EEF2FF", label: "Received",  Icon: Clock   },
  PENDING:   { color: "#D97706", bg: "#FFFBEB", label: "Preparing", Icon: Package },
  DELIVERED: { color: "#15803D", bg: "#F0FDF4", label: "Delivered", Icon: Truck   },
  CANCELLED: { color: "#B91C1C", bg: "#FEF2F2", label: "Cancelled", Icon: XCircle },
};

const sendOrderWhatsApp = ({ businessName, whatsappNumber, customerName, orderRef, items, total }) => {
  if (!whatsappNumber) return;
  const digits = whatsappNumber.replace(/\D/g, "");
  const normalized = digits.startsWith("91") ? digits : `91${digits}`;
  const itemLines = items.map(i => `  • ${i.productName} × ${i.quantity} — ₹${i.amount.toLocaleString("en-IN")}`).join("%0A");
  const text = [
    `Hello! 👋 Your order has been placed successfully.`,
    ``, `*Order Ref: #${orderRef}*`, `Store: ${businessName}`,
    ``, `*Items:*`, itemLines, ``,
    `*Total: ₹${total.toLocaleString("en-IN")}*`, ``,
    `Track your order anytime using your phone number on our store.`,
    `Thank you! 🙏`,
  ].join("%0A");
  window.open(`https://wa.me/${normalized}?text=${text}`, "_blank", "noopener,noreferrer");
};

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
  const [showTrackOrder, setShowTrackOrder] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    getStorefront(slug)
      .then(res => { setStore(res.data.data.store); setProducts(res.data.data.products); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product, qty) =>
    setCart(prev => ({ ...prev, [product._id]: (prev[product._id] || 0) + qty }));

  const updateQty = (productId, qty) => {
    if (qty <= 0) { const n = { ...cart }; delete n[productId]; setCart(n); }
    else setCart(prev => ({ ...prev, [productId]: qty }));
  };

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p._id === id), qty }))
    .filter(i => i.product);
  const cartTotal = cartItems.reduce((s, { product, qty }) => s + product.basePrice * qty, 0);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const hasCategories = categories.length > 1;

  useEffect(() => {
    if (hasCategories && !activeCategory) setActiveCategory(categories[0]);
  }, [categories.length]);

  const filteredProducts = hasCategories && activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#F8F8FA", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #E4E4E7", borderTopColor: "#0F1117", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: "0.875rem", color: "#8A8A8E", fontWeight: 500 }}>Loading store…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100dvh", background: "#F8F8FA", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: F.sans }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
        <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "#0F1117", marginBottom: 6 }}>Store not found</p>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", lineHeight: 1.6 }}>This store link may be invalid or the store may have been deactivated.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F8FA", fontFamily: F.sans, paddingBottom: cartCount > 0 ? 96 : 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .store-card { transition: box-shadow 0.18s, transform 0.18s; }
        .store-card:active { transform: scale(0.985); }
        .add-btn:active { transform: scale(0.92); }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0F1117 0%, #1E2030 100%)",
        padding: "28px 20px 24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle background texture */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          {/* Top row — name + actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "white", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                  {store.name}
                </h1>
                {store.acceptingOrders !== false && (
                  <span style={{ flexShrink: 0, fontSize: "0.5625rem", fontWeight: 700, background: "#16A34A", color: "white", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    OPEN
                  </span>
                )}
              </div>
              {store.tagline && (
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4, fontWeight: 400 }}>
                  {store.tagline}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button
                onClick={() => setShowTrackOrder(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, height: 36, padding: "0 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem", fontWeight: 500, fontFamily: F.sans, backdropFilter: "blur(4px)", transition: "background 0.15s" }}
              >
                <Search size={13} />
                Track
              </button>
              {store.whatsappNumber && (
                <a
                  href={`https://wa.me/91${store.whatsappNumber.replace(/\D/g, "").slice(-10)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, background: "#16A34A", borderRadius: 10, flexShrink: 0, transition: "opacity 0.15s" }}
                >
                  <MessageCircle size={17} color="white" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO STRIPS ── */}
      {(!store.acceptingOrders || store.deliveryNote) && (
        <div style={{ background: "white", borderBottom: "1px solid #EBEBED" }}>
          {!store.acceptingOrders && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: store.deliveryNote ? "1px solid #EBEBED" : "none" }}>
              <div style={{ width: 28, height: 28, background: "#FEF3C7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={14} color="#D97706" />
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#92400E", fontWeight: 500 }}>Not accepting orders right now</p>
            </div>
          )}
          {store.deliveryNote && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px" }}>
              <div style={{ width: 28, height: 28, background: "#EFF6FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bike size={14} color="#2563EB" />
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#1E40AF", fontWeight: 500 }}>{store.deliveryNote}</p>
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORY TABS ── */}
      {hasCategories && (
        <div style={{ background: "white", borderBottom: "1px solid #EBEBED", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ overflowX: "auto", display: "flex", padding: "0 16px", scrollbarWidth: "none" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "13px 14px",
                  fontSize: "0.875rem",
                  fontWeight: activeCategory === cat ? 700 : 400,
                  color: activeCategory === cat ? "#0F1117" : "#9CA3AF",
                  background: "none", border: "none",
                  borderBottom: activeCategory === cat ? "2.5px solid #0F1117" : "2.5px solid transparent",
                  cursor: "pointer", whiteSpace: "nowrap", fontFamily: F.sans,
                  transition: "color 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PRODUCTS ── */}
      <div style={{ padding: "16px 16px 8px" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📦</div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0F1117", marginBottom: 4 }}>No products here yet</p>
            <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>Check back soon</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredProducts.map((product, idx) => {
              const qty = cart[product._id] || 0;
              const outOfStock = product.trackStock && product.stock !== null && product.stock <= 0;
              return (
                <div
                  key={product._id}
                  className="store-card"
                  style={{ animation: `fadeUp 0.25s ease both`, animationDelay: `${idx * 0.04}s` }}
                >
                  <ProductCard
                    product={product} qty={qty}
                    outOfStock={outOfStock} acceptingOrders={store.acceptingOrders}
                    onTap={() => setSelectedProduct(product)}
                    onAdd={() => addToCart(product, product.minOrderQty || 1)}
                    onUpdate={(q) => updateQty(product._id, q)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
        <p style={{ fontSize: "0.6875rem", color: "#C4C4C8", letterSpacing: "0.04em" }}>
          Powered by <span style={{ fontWeight: 700, color: "#6366F1" }}>Udyog</span>
        </p>
      </div>

      {/* ── CART BAR ── */}
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 16px calc(12px + env(safe-area-inset-bottom, 0px))", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #EBEBED", zIndex: 40 }}>
          <button
            onClick={() => setShowCheckout(true)}
            style={{ width: "100%", height: 52, background: "#0F1117", color: "white", border: "none", borderRadius: 16, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 14px", fontFamily: F.sans, letterSpacing: "-0.01em" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.15)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <ShoppingCart size={15} color="white" />
                <span style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, background: "#6366F1", borderRadius: "50%", fontSize: "0.5625rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #0F1117" }}>
                  {cartCount}
                </span>
              </div>
              <span>View Cart</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 800 }}>{formatCurrency(cartTotal)}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* ── SHEETS ── */}
      {selectedProduct && createPortal(
        <ProductDetailSheet
          product={selectedProduct}
          qty={cart[selectedProduct._id] || 0}
          acceptingOrders={store.acceptingOrders}
          onClose={() => setSelectedProduct(null)}
          onAdd={(qty) => { addToCart(selectedProduct, qty); setSelectedProduct(null); }}
          onUpdate={(q) => updateQty(selectedProduct._id, q)}
        />, document.body
      )}

      {showCheckout && createPortal(
        <CheckoutSheet
          cart={cartItems} total={cartTotal} slug={slug} store={store}
          onClose={() => setShowCheckout(false)}
          onSuccess={(orderData) => {
            setCart({}); setShowCheckout(false);
            if (store.whatsappNumber) sendOrderWhatsApp({ businessName: store.name, whatsappNumber: store.whatsappNumber, customerName: orderData.customerName, orderRef: orderData.orderRef, items: orderData.items, total: orderData.total });
            navigate(`/store/${slug}/order/${orderData.orderId}`);
          }}
        />, document.body
      )}

      {showTrackOrder && createPortal(
        <TrackOrderSheet
          slug={slug} store={store}
          onClose={() => setShowTrackOrder(false)}
          onViewOrder={(orderId) => { setShowTrackOrder(false); navigate(`/store/${slug}/order/${orderId}`); }}
        />, document.body
      )}
    </div>
  );
}

/* ─── Product Card ──────────────────────────────────────────────────────── */
function ProductCard({ product, qty, outOfStock, acceptingOrders, onTap, onAdd, onUpdate }) {
  const lowStock = !outOfStock && product.trackStock && product.stock !== null && product.stock <= 5;

  return (
    <div
      onClick={onTap}
      style={{ background: "white", borderRadius: 16, border: "1px solid #EBEBED", display: "flex", alignItems: "center", gap: 14, padding: "14px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Image */}
      <div style={{ width: 76, height: 76, borderRadius: 12, background: "#F4F4F6", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={26} color="#D1D5DB" /></div>
        }
        {outOfStock && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12 }}>
            <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "#B91C1C", background: "#FEF2F2", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" }}>SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F1117", marginBottom: 3, lineHeight: 1.3 }}>{product.name}</p>
        {product.description && (
          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{product.description}</p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <p style={{ fontSize: "1rem", fontWeight: 800, color: "#0F1117", letterSpacing: "-0.02em" }}>{formatCurrency(product.basePrice)}</p>
          <span style={{ fontSize: "0.75rem", color: "#B0B0B8", fontWeight: 400 }}>/ {product.unit}</span>
        </div>
        {lowStock && (
          <p style={{ fontSize: "0.6875rem", color: "#D97706", fontWeight: 600, marginTop: 3 }}>
            Only {product.stock} left
          </p>
        )}
      </div>

      {/* Add / qty */}
      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {outOfStock ? null : qty === 0 ? (
          <button
            className="add-btn"
            onClick={onAdd}
            disabled={!acceptingOrders}
            style={{ width: 38, height: 38, background: acceptingOrders ? "#0F1117" : "#E4E4E7", color: "white", border: "none", borderRadius: 12, cursor: acceptingOrders ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#0F1117", borderRadius: 12, padding: "3px", gap: 2 }}>
            <button onClick={() => onUpdate(qty - (product.minOrderQty || 1))} style={{ width: 30, height: 30, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Minus size={14} color="white" />
            </button>
            <span style={{ fontSize: "0.9375rem", fontWeight: 800, minWidth: 26, textAlign: "center", color: "white" }}>{qty}</span>
            <button onClick={() => onUpdate(qty + (product.minOrderQty || 1))} style={{ width: 30, height: 30, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} color="white" />
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: F.sans }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Drag handle */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, background: "#E4E4E7", borderRadius: 99 }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Image */}
          {images.length > 0 ? (
            <div style={{ position: "relative" }}>
              <img src={images[imgIndex]} alt={product.name} style={{ width: "100%", height: 240, objectFit: "cover" }} />
              <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                <X size={16} color="white" />
              </button>
              {images.length > 1 && (
                <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} style={{ width: i === imgIndex ? 20 : 6, height: 6, borderRadius: 99, background: i === imgIndex ? "white" : "rgba(255,255,255,0.45)", border: "none", cursor: "pointer", transition: "width 0.2s", padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ height: 140, background: "#F4F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={48} color="#D1D5DB" />
              </div>
              <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, background: "rgba(0,0,0,0.15)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#374151" />
              </button>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: "18px 20px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0F1117", flex: 1, lineHeight: 1.25, letterSpacing: "-0.02em" }}>{product.name}</h2>
              {product.category && (
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, background: "#F4F4F6", color: "#6B7280", padding: "4px 9px", borderRadius: 99, marginLeft: 10, flexShrink: 0, letterSpacing: "0.02em" }}>{product.category}</span>
              )}
            </div>

            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F1117", marginBottom: 12, letterSpacing: "-0.03em" }}>
              {formatCurrency(product.basePrice)}
              <span style={{ fontSize: "0.9375rem", fontWeight: 400, color: "#9CA3AF", marginLeft: 5 }}>/ {product.unit}</span>
            </p>

            {product.description && (
              <p style={{ fontSize: "0.9375rem", color: "#4B5563", lineHeight: 1.65, marginBottom: 16 }}>{product.description}</p>
            )}

            {/* Meta pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {product.minOrderQty > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F4F4F6", borderRadius: 99, padding: "5px 10px" }}>
                  <Info size={12} color="#6B7280" />
                  <span style={{ fontSize: "0.75rem", color: "#6B7280", fontWeight: 500 }}>Min. {product.minOrderQty} {product.unit}</span>
                </div>
              )}
              {product.trackStock && product.stock !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: outOfStock ? "#FEF2F2" : product.stock <= 5 ? "#FFFBEB" : "#F0FDF4", borderRadius: 99, padding: "5px 10px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: outOfStock ? "#B91C1C" : product.stock <= 5 ? "#D97706" : "#16A34A" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: outOfStock ? "#B91C1C" : product.stock <= 5 ? "#D97706" : "#16A34A" }}>
                    {outOfStock ? "Out of stock" : `${product.stock} available`}
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            {!outOfStock && acceptingOrders && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F4F4F6", borderRadius: 14, padding: "4px" }}>
                  <button onClick={() => setLocalQty(q => Math.max(product.minOrderQty || 1, q - (product.minOrderQty || 1)))} style={{ width: 36, height: 36, background: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: "1.0625rem", fontWeight: 800, minWidth: 32, textAlign: "center", color: "#0F1117" }}>{localQty}</span>
                  <button onClick={() => setLocalQty(q => q + (product.minOrderQty || 1))} style={{ width: 36, height: 36, background: "#0F1117", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={16} color="white" />
                  </button>
                </div>
                <button
                  onClick={() => alreadyInCart ? onUpdate(localQty) : onAdd(localQty)}
                  style={{ flex: 1, height: 50, background: "#0F1117", color: "white", border: "none", borderRadius: 14, fontSize: "0.9375rem", fontWeight: 700, cursor: "pointer", fontFamily: F.sans, letterSpacing: "-0.01em" }}
                >
                  {alreadyInCart ? `Update · ${formatCurrency(product.basePrice * localQty)}` : `Add to Cart · ${formatCurrency(product.basePrice * localQty)}`}
                </button>
              </div>
            )}
            {outOfStock && (
              <div style={{ background: "#FEF2F2", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <p style={{ color: "#B91C1C", fontWeight: 600, fontSize: "0.9375rem" }}>Currently out of stock</p>
              </div>
            )}
            {!acceptingOrders && !outOfStock && (
              <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <p style={{ color: "#B45309", fontWeight: 600, fontSize: "0.9375rem" }}>Store not accepting orders right now</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Checkout Sheet ────────────────────────────────────────────────────── */
function CheckoutSheet({ cart, total, slug, store, onClose, onSuccess }) {
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
        name: form.name.trim(), phone: form.phone.trim(),
        address: form.address.trim(), notes: form.notes.trim(),
        items: cart.map(({ product, qty }) => ({ productId: product._id, quantity: qty })),
      });
      onSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: "100%", height: 46, border: "1.5px solid #EBEBED", borderRadius: 12, padding: "0 14px", fontSize: "0.9375rem", fontFamily: F.sans, outline: "none", boxSizing: "border-box", background: "white", color: "#0F1117" };
  const lbl = { display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: 6, letterSpacing: "0.03em" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: F.sans }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#F8F8FA", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "94dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, background: "white", borderBottom: "1px solid #EBEBED" }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, background: "#E4E4E7", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 20px 14px" }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", color: "#0F1117", letterSpacing: "-0.02em" }}>Review Order</h2>
            <button onClick={onClose} style={{ background: "#F4F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#6B7280" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Order summary */}
          <div style={{ background: "white", margin: "12px 16px 0", borderRadius: 16, border: "1px solid #EBEBED", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 6px" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 10 }}>Your Items</p>
              {cart.map(({ product, qty }) => (
                <div key={product._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F4F4F6", overflow: "hidden", flexShrink: 0 }}>
                      {product.images?.[0]
                        ? <img src={product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={14} color="#9CA3AF" /></div>
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F1117" }}>{product.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>× {qty} {product.unit}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0F1117" }}>{formatCurrency(product.basePrice * qty)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #F4F4F6", background: "#FAFAFA" }}>
              <p style={{ fontWeight: 700, color: "#0F1117" }}>Total</p>
              <p style={{ fontWeight: 800, fontSize: "1.125rem", color: "#0F1117", letterSpacing: "-0.02em" }}>{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12, paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            {error && (
              <div style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: "0.875rem", fontWeight: 500 }}>{error}</div>
            )}

            <div style={{ background: "white", borderRadius: 16, border: "1px solid #EBEBED", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: -4 }}>Your Details</p>
              <div>
                <label style={lbl}>Full Name *</label>
                <input style={inp} placeholder="Enter your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={lbl}>Phone Number *</label>
                <input style={inp} placeholder="10-digit mobile number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" inputMode="numeric" required />
              </div>
              <div>
                <label style={lbl}>Delivery Address <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
                <textarea style={{ ...inp, height: 76, padding: "12px 14px", resize: "none" }} placeholder="Where should we deliver?" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Special Instructions <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· optional</span></label>
                <input style={inp} placeholder="Any notes for the seller" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            {store.whatsappNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "11px 14px" }}>
                <MessageCircle size={15} color="#16A34A" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: "0.8125rem", color: "#15803D", fontWeight: 500 }}>Order confirmation will open in WhatsApp</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: "100%", height: 52, background: loading ? "#E4E4E7" : "#0F1117", color: "white", border: "none", borderRadius: 16, fontSize: "1rem", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: F.sans, letterSpacing: "-0.01em" }}
            >
              {loading ? "Placing order…" : `Place Order · ${formatCurrency(total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Track Order Sheet ─────────────────────────────────────────────────── */
function TrackOrderSheet({ slug, store, onClose, onViewOrder }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setError("Enter a valid 10-digit phone number"); return; }
    setLoading(true);
    try {
      const res = await getOrdersByPhone(slug, digits);
      setOrders(res.data.data.orders);
    } catch {
      setError("Could not find orders. Please check your number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: F.sans }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#F8F8FA", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "85dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, background: "white", borderBottom: "1px solid #EBEBED" }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, background: "#E4E4E7", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 20px 14px" }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.0625rem", color: "#0F1117", letterSpacing: "-0.02em" }}>Track Order</h2>
              <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", marginTop: 2 }}>Enter your phone to see your orders</p>
            </div>
            <button onClick={onClose} style={{ background: "#F4F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#6B7280" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              style={{ flex: 1, height: 46, border: "1.5px solid #EBEBED", borderRadius: 12, padding: "0 14px", fontSize: "0.9375rem", fontFamily: F.sans, outline: "none", background: "white" }}
              placeholder="Your 10-digit phone number"
              value={phone}
              onChange={e => { setPhone(e.target.value); setOrders(null); setError(""); }}
              type="tel" inputMode="numeric"
            />
            <button
              type="submit" disabled={loading}
              style={{ height: 46, padding: "0 18px", background: "#0F1117", color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontFamily: F.sans, fontSize: "0.9375rem", flexShrink: 0 }}
            >
              {loading ? "…" : "Search"}
            </button>
          </form>

          {error && (
            <div style={{ background: "#FEF2F2", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: "0.875rem", marginBottom: 12, fontWeight: 500 }}>{error}</div>
          )}

          {orders !== null && (
            orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>📭</div>
                <p style={{ fontWeight: 700, color: "#0F1117", marginBottom: 4 }}>No orders found</p>
                <p style={{ fontSize: "0.875rem", color: "#9CA3AF" }}>No orders placed with this number yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 600, marginBottom: 2 }}>{orders.length} order{orders.length > 1 ? "s" : ""} found</p>
                {orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.CREATED;
                  const { Icon } = cfg;
                  return (
                    <button
                      key={order.orderId}
                      onClick={() => onViewOrder(order.orderId)}
                      style={{ background: "white", border: "1px solid #EBEBED", borderRadius: 14, padding: "14px", cursor: "pointer", textAlign: "left", fontFamily: F.sans, width: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: cfg.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={15} color={cfg.color} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#0F1117", fontFamily: "monospace", letterSpacing: "0.04em" }}>#{order.orderRef}</p>
                            <p style={{ fontSize: "0.6875rem", color: cfg.color, fontWeight: 700, marginTop: 1 }}>{cfg.label}</p>
                          </div>
                        </div>
                        <p style={{ fontWeight: 800, fontSize: "1rem", color: "#0F1117", letterSpacing: "-0.02em" }}>{formatCurrency(order.total)}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                          {order.items?.length} item{order.items?.length > 1 ? "s" : ""} · {new Date(order.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                        {order.remaining > 0 && (
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#B91C1C", background: "#FEF2F2", padding: "2px 8px", borderRadius: 99 }}>₹{order.remaining} due</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}