// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { LogOut, Building2, Smartphone, Package, ChevronRight, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBusinessProfile, updateBusinessProfile } from "../services/business.api";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [editField, setEditField] = useState(null); // which field is being edited
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedField, setSavedField] = useState(null);

  useEffect(() => {
    getBusinessProfile().then(setBusiness).catch(console.error);
  }, []);

  const startEdit = (field, currentValue) => {
    setEditField(field);
    setFieldValue(currentValue || "");
  };

  const saveField = async () => {
    setSaving(true);
    try {
      const updated = await updateBusinessProfile({ [editField]: fieldValue.trim() });
      setBusiness(updated);
      setSavedField(editField);
      setTimeout(() => setSavedField(null), 2000);
      setEditField(null);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Sign out?")) logout();
  };

  const settingsFields = [
    { key: "name", label: "Business Name", icon: Building2, placeholder: "Your business name", value: business?.name },
    { key: "phone", label: "Phone Number", icon: Smartphone, placeholder: "+91 98765 43210", value: business?.phone },
    { key: "upiId", label: "UPI ID", icon: Smartphone, placeholder: "yourname@upi", value: business?.upiId, hint: "Used in payment links sent via WhatsApp" },
    { key: "gstNumber", label: "GST Number", icon: Building2, placeholder: "22AAAAA0000A1Z5", value: business?.gstNumber },
    { key: "invoicePrefix", label: "Invoice Prefix", icon: Building2, placeholder: "ORD", value: business?.invoicePrefix, hint: "e.g. ORD → ORD-001, INV → INV-001" },
  ];

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your business profile</p>
      </div>

      {/* PROFILE CARD */}
      <div className="card" style={{ padding: "20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56, height: 56,
          background: "var(--color-accent)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", fontWeight: 700, color: "white", flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>{user?.name}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{user?.email}</p>
          {business?.name && <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>{business.name}</p>}
        </div>
      </div>

      {/* BUSINESS SETTINGS */}
      <p className="section-label">Business Profile</p>
      <div className="card" style={{ marginBottom: 24, overflow: "hidden" }}>
        {settingsFields.map((field, i) => (
          <div key={field.key} style={{ borderBottom: i < settingsFields.length - 1 ? "1px solid var(--color-border)" : "none" }}>
            {editField === field.key ? (
              <div style={{ padding: "16px" }}>
                <label className="section-label">{field.label}</label>
                {field.hint && <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 8 }}>{field.hint}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder={field.placeholder}
                    value={fieldValue}
                    onChange={e => setFieldValue(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === "Enter") saveField(); if (e.key === "Escape") setEditField(null); }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={saveField} disabled={saving} style={{ flexShrink: 0 }}>
                    {saving ? "…" : <Check size={15} />}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditField(null)} style={{ flexShrink: 0 }}>✕</button>
                </div>
                {savedField === field.key && (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-accent)", marginTop: 6, fontWeight: 500 }}>✓ Saved</p>
                )}
              </div>
            ) : (
              <div
                onClick={() => startEdit(field.key, field.value)}
                style={{ display: "flex", alignItems: "center", padding: "16px", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <div style={{ width: 38, height: 38, background: "var(--color-accent-light)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 }}>
                  <field.icon size={17} color="var(--color-accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{field.label}</p>
                  <p style={{ fontSize: "0.8125rem", color: field.value ? "var(--color-text-secondary)" : "var(--color-text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {field.value || `Add ${field.label.toLowerCase()}`}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PRODUCT CATALOG LINK */}
      <p className="section-label">Quick Actions</p>
      <div className="card" style={{ marginBottom: 24, overflow: "hidden" }}>
        <div
          onClick={() => navigate("/products")}
          style={{ display: "flex", alignItems: "center", padding: "16px", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <div style={{ width: 38, height: 38, background: "var(--color-accent-light)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
            <Package size={17} color="var(--color-accent)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>Product Catalog</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
              Manage saved products for quick order entry
            </p>
          </div>
          <ChevronRight size={16} color="var(--color-text-tertiary)" />
        </div>
      </div>

      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        className="btn"
        style={{
          width: "100%",
          background: "var(--color-danger-light)",
          color: "var(--color-danger)",
          border: "1.5px solid #FECACA",
          justifyContent: "center",
          gap: 10,
          height: 52,
        }}
      >
        <LogOut size={18} />
        Sign Out
      </button>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 20 }}>
        Version 1.0.0
      </p>
    </div>
  );
}