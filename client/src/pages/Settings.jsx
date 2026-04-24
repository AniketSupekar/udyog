// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { LogOut, User, Building2, Bell, Shield, ChevronRight, Smartphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/notifications/NotificationBell";
import { getBusinessProfile, updateBusinessProfile } from "../services/business.api";

export default function Settings() {
  const { user, logout } = useAuth();
  const [business, setBusiness] = useState(null);
  const [editingUpi, setEditingUpi] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBusinessProfile()
      .then((data) => {
        setBusiness(data);
        setUpiId(data?.upiId || "");
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) logout();
  };

  const handleSaveUpi = async () => {
    setSaving(true);
    try {
      const updated = await updateBusinessProfile({ upiId: upiId.trim() });
      setBusiness(updated);
      setEditingUpi(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Failed to save UPI ID");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-5 rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white text-xl font-semibold">
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-gray-900">{user?.name || "Admin"}</p>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          {business?.name && (
            <p className="text-xs text-gray-400 mt-0.5">{business.name}</p>
          )}
        </div>
        <NotificationBell />
      </div>

      {/* Business Settings */}
      <Section title="Business">

        {/* UPI ID */}
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Smartphone size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">UPI ID</p>
              <p className="text-xs text-gray-500 mt-0.5">Used in payment links sent via WhatsApp</p>
            </div>
          </div>

          {editingUpi ? (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={handleSaveUpi}
                disabled={saving}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditingUpi(false); setUpiId(business?.upiId || ""); }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {business?.upiId ? (
                  <span className="font-medium text-green-700">{business.upiId}</span>
                ) : (
                  <span className="text-gray-400 italic">Not set</span>
                )}
              </p>
              <button
                onClick={() => setEditingUpi(true)}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                {business?.upiId ? "Edit" : "Add UPI ID"}
              </button>
            </div>
          )}

          {saved && (
            <p className="mt-2 text-xs text-green-600 font-medium">✓ UPI ID saved successfully</p>
          )}
        </div>

        <Item
          icon={<Building2 size={18} />}
          title="Business Profile"
          subtitle={business?.name || "Loading…"}
          onClick={() => alert("Coming soon")}
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        <Item icon={<User size={18} />} title="Profile" subtitle="Update personal information" onClick={() => alert("Coming soon")} />
        <Item icon={<Bell size={18} />} title="Notifications" subtitle="Manage notification preferences" onClick={() => alert("Coming soon")} />
        <Item icon={<Shield size={18} />} title="Privacy & Security" subtitle="Manage your data" onClick={() => alert("Coming soon")} />
      </Section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-red-50 border border-red-100 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">{title}</h2>
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 divide-y divide-gray-100">{children}</div>
  </div>
);

const Item = ({ icon, title, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-5 ${onClick ? "cursor-pointer hover:bg-gray-50 transition" : ""}`}
  >
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {onClick && <ChevronRight size={18} className="text-gray-400" />}
  </div>
);