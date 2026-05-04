// src/context/ToastContext.jsx
// Global toast notification system — replaces ALL window.alert() calls
// Usage: const { toast } = useToast(); toast.success("Saved!"); toast.error("Failed");

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast("success", msg),
    error:   (msg) => addToast("error",   msg, 4500),
    warning: (msg) => addToast("warning", msg),
    info:    (msg) => addToast("info",    msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};

// ─── Config ──────────────────────────────────────────────────────────
const CONFIG = {
  success: { icon: CheckCircle, bg: "#F0FDF4", border: "#86EFAC", color: "#15803D", iconColor: "#16A34A" },
  error:   { icon: XCircle,     bg: "#FEF2F2", border: "#FCA5A5", color: "#B91C1C", iconColor: "#DC2626" },
  warning: { icon: AlertTriangle,bg:"#FFFBEB", border: "#FCD34D", color: "#92400E", iconColor: "#D97706" },
  info:    { icon: Info,         bg: "#EFF6FF", border: "#93C5FD", color: "#1E40AF", iconColor: "#2563EB" },
};

// ─── Container ────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: 80,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "calc(100vw - 32px)",
      maxWidth: 400,
      pointerEvents: "none",
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Individual Toast ─────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const cfg = CONFIG[toast.type] || CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        animation: "slideUpToast 0.25s ease-out",
        pointerEvents: "all",
      }}
    >
      <style>{`
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Icon size={18} color={cfg.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />

      <p style={{
        flex: 1,
        fontSize: "0.9rem",
        fontWeight: 500,
        color: cfg.color,
        lineHeight: 1.4,
        fontFamily: "var(--font-sans)",
      }}>
        {toast.message}
      </p>

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          color: cfg.color,
          opacity: 0.6,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}