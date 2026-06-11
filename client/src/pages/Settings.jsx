// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { LogOut, Building2, Smartphone, MapPin, ChevronRight, Check, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getBusinessProfile, updateBusinessProfile } from "../services/business.api";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deletePassword) { setDeleteError("Please enter your password"); return; }
    setDeleteLoading(true);
    try {
      await api.delete("/auth/account", { data: { password: deletePassword } });
      logout();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
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

      {/* ACCOUNT ACTIONS */}
      <p className="section-label">Account</p>
      <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{ width: "100%", display: "flex", alignItems: "center", padding: "16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <div style={{ width: 36, height: 36, background: "var(--color-bg)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, border: "1px solid var(--color-border)" }}>
            <LogOut size={16} color="var(--color-text-secondary)" />
          </div>
          <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>Sign Out</p>
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="card" style={{ marginBottom: 32, overflow: "hidden", border: "1px solid #FECACA" }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{ width: "100%", display: "flex", alignItems: "center", padding: "16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={e => e.currentTarget.style.background = "#FFF5F5"}
          onMouseLeave={e => e.currentTarget.style.background = ""}
        >
          <div style={{ width: 36, height: 36, background: "var(--color-danger-light)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 14, flexShrink: 0 }}>
            <Trash2 size={16} color="var(--color-danger)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-danger)" }}>Delete Account</p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>Permanently delete your account and all data</p>
          </div>
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 4 }}>
        Version 1.0.0
      </p>

      {/* LOGOUT CONFIRM SHEET */}
      {showLogoutConfirm && (
        <div onClick={() => setShowLogoutConfirm(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>
            <div style={{ width: 44, height: 44, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <LogOut size={20} color="var(--color-text-secondary)" />
            </div>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 6 }}>Sign out?</p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 20 }}>You'll need to sign in again to access your account.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: "var(--color-cta)", color: "white" }} onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRM SHEET */}
      {showDeleteConfirm && (
        <div onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px calc(28px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
            </div>

            <div style={{ width: 48, height: 48, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <AlertTriangle size={22} color="var(--color-danger)" />
            </div>

            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)", marginBottom: 8 }}>
              Delete your account?
            </p>

            <div style={{ background: "var(--color-danger-light)", border: "1px solid #FECACA", borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: 20 }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-danger)", lineHeight: 1.5 }}>
                This will permanently delete your account, business profile, all orders, clients, and products. <strong>This cannot be undone.</strong>
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                Enter your password to confirm
              </label>
              <input
                className="input"
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteError(""); }}
                autoFocus
              />
              {deleteError && (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-danger)", marginTop: 6 }}>{deleteError}</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
              >
                Cancel
              </button>
              <button
                className="btn"
                style={{ flex: 1, background: deleteLoading ? "var(--color-border)" : "var(--color-danger)", color: "white" }}
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}