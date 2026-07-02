// src/components/Header.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, Search, X, Package, Users, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./notifications/NotificationBell";
import { globalSearch } from "../services/search.api";
import { formatCurrency } from "../utils/currency.util";
import { createPortal } from "react-dom";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Sign out?")) return;
    await logout();
  };

  return (
    <>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0", marginBottom: 8,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Udyog" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>Order Management</p>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Dashboard</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Search button */}
          <button
            onClick={() => setShowSearch(true)}
            style={{
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", cursor: "pointer",
            }}
          >
            <Search size={17} color="var(--color-text-secondary)" />
          </button>

          <NotificationBell />

          {user && (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(p => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 40, padding: "0 12px",
                  background: "var(--color-surface)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-full)", cursor: "pointer",
                }}
              >
                <div style={{ width: 26, height: 26, background: "var(--color-accent)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "white" }}>
                  {user.name?.[0]?.toUpperCase() || "A"}
                </div>
                <ChevronDown size={14} color="var(--color-text-secondary)" style={{ transform: showMenu ? "rotate(180deg)" : "", transition: "transform 0.15s" }} />
              </button>

              {showMenu && (
                <div className="animate-in" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", minWidth: 160, overflow: "hidden", zIndex: 100 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
                    <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{user.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>{user.email}</p>
                  </div>
                  <button onClick={() => { navigate("/settings"); setShowMenu(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    <Settings size={15} /> Settings
                  </button>
                  <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-danger)" }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global search modal */}
      {showSearch && createPortal(
        <SearchModal onClose={() => setShowSearch(false)} navigate={navigate} />,
        document.body
      )}
    </>
  );
}

function SearchModal({ onClose, navigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setResults(null);
      return;
    }
    const run = async () => {
      setLoading(true);
      try {
        const data = await globalSearch(debouncedQuery.trim());
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery]);

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  const hasResults = results && results.total > 0;
  const noResults = results && results.total === 0;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 60 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-in"
        style={{ width: "calc(100% - 32px)", maxWidth: 480, background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "0 24px 48px rgba(0,0,0,0.16)", overflow: "hidden", maxHeight: "70dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <Search size={18} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search orders, clients, products…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: "1rem", background: "transparent", color: "var(--color-text-primary)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--color-text-tertiary)" }}>
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "3px 8px", cursor: "pointer", fontSize: "0.75rem", color: "var(--color-text-tertiary)", flexShrink: 0 }}>
            Esc
          </button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Empty state */}
          {!query && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>
                Type to search across orders, clients and products
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
            </div>
          )}

          {/* No results */}
          {!loading && noResults && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 4 }}>No results found</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>Try a different name, phone, or product</p>
            </div>
          )}

          {/* Results */}
          {!loading && hasResults && (
            <div style={{ padding: "8px" }}>

              {/* Orders */}
              {results.orders.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Orders ({results.orders.length})
                  </p>
                  {results.orders.map(order => (
                    <button
                      key={order._id}
                      onClick={() => goTo(`/orders/${order._id}`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "var(--color-accent-light)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ClipboardList size={15} color="var(--color-accent)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.clientSnapshot?.name}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                          {order.status} · {formatCurrency(order.financial?.total)}
                        </p>
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600, background: "var(--color-bg)", color: "var(--color-text-tertiary)", padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>
                        #{order._id?.slice(-6).toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Clients */}
              {results.clients.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Clients ({results.clients.length})
                  </p>
                  {results.clients.map(client => (
                    <button
                      key={client._id}
                      onClick={() => goTo(`/clients/${client._id}`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "#F0FDF4", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={15} color="#15803D" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {client.name}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                          {client.phone} · {client.totalOrders || 0} orders
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Products ({results.products.length})
                  </p>
                  {results.products.map(product => (
                    <button
                      key={product._id}
                      onClick={() => goTo(`/products`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "#FFFBEB", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={15} color="#D97706" /></div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {product.name}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                          {formatCurrency(product.basePrice)} / {product.unit}
                          {product.category ? ` · ${product.category}` : ""}
                        </p>
                      </div>
                      {product.isPublic && (
                        <span style={{ fontSize: "0.5625rem", fontWeight: 700, background: "#EEF2FF", color: "var(--color-accent)", padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}>LIVE</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}