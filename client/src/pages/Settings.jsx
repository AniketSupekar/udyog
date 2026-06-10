// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { LogOut, Building2, Smartphone, MapPin, ChevronRight, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBusinessProfile, updateBusinessProfile } from "../services/business.api";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState(null);
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      setEditField(null);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const profileFields = [
    { key: "name",          label: "Business Name",  icon: Building2,  placeholder: "Your business name",    value: business?.name },
    { key: "phone",         label: "Phone Number",   icon: Smartphone, placeholder: "+91 98765 43210",        value: business?.phone },
    { key: "address",       label: "Address",        icon: MapPin,     placeholder: "Shop address for bills", value: business?.address },
    { key: "upiId",         label: "UPI ID",         icon: Smartphone, placeholder: "yourname@upi",           value: business?.upiId,         hint: "Used in WhatsApp payment links" },
    { key: "gstNumber",     label: "GST Number",     icon: Building2,  placeholder: "22AAAAA0000A1Z5",        value: business?.gstNumber },
    { key: "invoicePrefix", label: "Invoice Prefix", icon: Building2,  placeholder: "ORD",                    value: business?.invoicePrefix, hint: "e.g. ORD → ORD-001" },
  ];

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your business profile</p>
      </div>

      {/* PROFILE CARD */}
      <div className="card" style={{ padding: "20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 52, height: 52, background: "var(--color-cta)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.375rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>{user?.name}</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>{user?.email}</p>
          {business?.name && <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>{business.name}</p>}
        </div>
      </div>

      {/* BUSINESS PROFILE */}
      <p className="section-label">Business Profile</p>
      <div className="card" style={{ marginBottom: 32, overflow: "hidden" }}>
        {profileFields.map((field, i) => (
          <div key={field.key} style={{ borderBottom: i < profileFields.length - 1 ? "1px solid var(--color-border)" : "none" }}>
            {editField === field.key ? (
              <div style={{ padding: "16px" }}>
                <label className="section-label">{field.label}</label>
                {field.hint && <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 8 }}>{field.hint}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  {field.key === "address" ? (
                    <textarea className="input" rows={3} style={{ flex: 1 }} placeholder={field.placeholder} value={fieldValue} onChange={e => setFieldValue(e.target.value)} autoFocus />
                  ) : (
                    <input
                      className="input" style={{ flex: 1 }}
                      placeholder={field.placeholder} value={fieldValue}
                      onChange={e => setFieldValue(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === "Enter") saveField(); if (e.key === "Escape") setEditField(null); }}
                    />
                  )}
                  <button className="btn btn-primary btn-sm" onClick={saveField} disabled={saving} style={{ flexShrink: 0 }}>
                    {saving ? "…" : <Check size={15} />}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditField(null)} style={{ flexShrink: 0 }}>✕</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startEdit(field.key, field.value)}
                style={{ display: "flex", alignItems: "center", padding: "16px", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <div style={{ width: 36, height: 36, background: "var(--color-accent-light)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 }}>
                  <field.icon size={16} color="var(--color-accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{field.label}</p>
                  <p style={{ fontSize: "0.8125rem", color: field.value ? "var(--color-text-secondary)" : "var(--color-text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {field.value || `Tap to add ${field.label.toLowerCase()}`}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LOGOUT */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="btn"
        style={{ width: "100%", background: "var(--color-danger-light)", color: "var(--color-danger)", border: "1.5px solid #FECACA", justifyContent: "center", gap: 10, height: 52 }}
      >
        <LogOut size={18} /> Sign Out
      </button>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 20 }}>
        Version 1.0.0
      </p>

      {/* LOGOUT CONFIRM SHEET */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-in"
            style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 44, height: 44, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <LogOut size={20} color="var(--color-danger)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>Sign out?</p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 20 }}>
              You'll need to sign in again to access your account.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: "var(--color-danger)", color: "white" }} onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}