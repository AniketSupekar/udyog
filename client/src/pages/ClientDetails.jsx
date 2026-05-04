// src/pages/ClientDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClientById, updateClient, deleteClient } from "../services/client.api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import { ChevronLeft, Edit2, Trash2, Phone, Mail, MapPin, X, Check } from "lucide-react";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClientById(id)
      .then(res => { setData(res.data); setForm(res.data); })
      .catch(() => navigate("/clients"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateClient(id, {
        name: form.name, phone: form.phone,
        email: form.email, address: form.address, notes: form.notes,
      });
      setData(prev => ({ ...prev, ...res.data }));
      setIsEditing(false);
      toast.success("Client updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${data.name}? This cannot be undone.`)) return;
    try {
      await deleteClient(id);
      toast.success("Client deleted");
      navigate("/clients");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) return (
    <div className="page">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)}
    </div>
  );
  if (!data) return null;

  const totalOutstanding = (data.stats?.totalRevenue || 0) - (data.stats?.totalPaid || 0);

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.375rem", fontWeight: 700, color: "white", flexShrink: 0 }}>
              {data.name[0].toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ height: 36, fontSize: "1rem", fontWeight: 600 }} />
              ) : (
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{data.name}</h1>
              )}
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>{data.type}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isEditing ? (
              <>
                <button className="btn btn-sm" style={{ background: "var(--color-accent)", color: "white" }} onClick={handleSave} disabled={saving}>
                  <Check size={14} /> {saving ? "…" : "Save"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}><X size={14} /></button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}><Edit2 size={14} /></button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Orders", value: data.stats?.totalOrders || 0, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Revenue", value: formatCurrency(data.stats?.totalRevenue || 0), color: "#15803D", bg: "#F0FDF4" },
          { label: "Outstanding", value: formatCurrency(Math.max(0, totalOutstanding)), color: totalOutstanding > 0 ? "#B91C1C" : "#15803D", bg: totalOutstanding > 0 ? "#FEF2F2" : "#F0FDF4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
            <p style={{ fontSize: "0.6875rem", color: s.color, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p className="amount" style={{ fontSize: "1rem", fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* CONTACT INFO */}
      <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
        <p className="section-label">Contact Information</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isEditing ? (
            <>
              <input className="input" placeholder="Phone" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input" type="email" placeholder="Email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Address" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </>
          ) : (
            <>
              {data.phone && <ContactRow icon={Phone} value={data.phone} />}
              {data.email && <ContactRow icon={Mail} value={data.email} />}
              {data.address && <ContactRow icon={MapPin} value={data.address} />}
            </>
          )}
        </div>
      </div>

      {/* NOTES */}
      {(data.notes || isEditing) && (
        <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
          <p className="section-label">Notes</p>
          {isEditing ? (
            <textarea className="input" rows={2} placeholder="Internal notes..." value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
          ) : (
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{data.notes}</p>
          )}
        </div>
      )}

      {/* RECENT ORDERS */}
      {data.recentOrders?.length > 0 && (
        <div className="card" style={{ padding: "16px" }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Recent Orders</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {data.recentOrders.map((order, i) => (
              <button
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < data.recentOrders.length - 1 ? "1px solid var(--color-border)" : "none", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <div>
                  <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                    {formatDate(order.deliveryDate)}
                  </p>
                  <p className="amount" style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {formatCurrency(order.financial?.total)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={order.status} />
                  <ChevronLeft size={14} color="var(--color-text-tertiary)" style={{ transform: "rotate(180deg)" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({ icon: Icon, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, background: "var(--color-bg)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} color="var(--color-text-secondary)" />
      </div>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}