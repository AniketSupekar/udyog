// src/pages/Clients.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getClients, createClient } from "../services/client.api";
import { useToast } from "../context/ToastContext";
import { Search, Plus, X, User, Phone, Building2, ChevronRight } from "lucide-react";

export default function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setDebouncedSearch(search); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getClients({ search: debouncedSearch, page, limit: 20 })
      .then(res => { setClients(res.data || []); setPagination(res.pagination); })
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  const handleCreated = (newClient) => {
    setShowForm(false);
    toast.success(`${newClient.name} added!`);
    setPage(1);
    setDebouncedSearch("");
    setSearch("");
    getClients({ page: 1, limit: 20 })
      .then(res => { setClients(res.data || []); setPagination(res.pagination); });
  };

  return (
    <div className="page animate-in">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            {pagination?.total != null ? `${pagination.total} total clients` : "Manage your customers"}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Add
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)" }} />
        <input
          className="input"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38, paddingRight: search ? 36 : 14 }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={22} color="var(--color-text-tertiary)" />
          </div>
          <p style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
            {search ? "No clients found" : "No clients yet"}
          </p>
          <p style={{ fontSize: "0.875rem", marginTop: 4 }}>
            {search ? "Try a different search" : "Add your first client to get started"}
          </p>
          {!search && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add First Client
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clients.map(client => (
              <button
                key={client._id}
                onClick={() => navigate(`/clients/${client._id}`)}
                className="card"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", border: "1px solid var(--color-border)", transition: "all 0.15s", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ""}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "var(--color-accent-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "1rem", fontWeight: 700, color: "var(--color-accent)",
                }}>
                  {client.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {client.name}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    📞 {client.phone}
                  </p>
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="amount" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {client.stats?.totalOrders || 0} orders
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>
                    {client.type}
                  </p>
                </div>

                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </button>
            ))}
          </div>

          {pagination?.totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, alignItems: "center" }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{page} / {pagination.totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button onClick={() => setShowForm(true)} style={{
        position: "fixed", bottom: 80, right: 20,
        width: 56, height: 56,
        background: "var(--color-accent)", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(22,163,74,0.4)",
        border: "none", cursor: "pointer", zIndex: 40,
      }}>
        <Plus size={24} color="white" />
      </button>

      {/* CREATE MODAL */}
      {showForm && (
        <ClientFormModal
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />
      )}
    </div>
  );
}

// ─── Client Form Modal ────────────────────────────────────────────────
function ClientFormModal({ client, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(client);
  const [form, setForm] = useState({
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    type: client?.type || "INDIVIDUAL",
    notes: client?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }
    setLoading(true);
    try {
      const { updateClient } = await import("../services/client.api");
      const result = isEdit
        ? await updateClient(client._id, form)
        : await createClient(form);
      onSaved(result.data || result);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="animate-in" style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", width: "100%", maxWidth: 480, maxHeight: "90dvh", overflowY: "auto", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{isEdit ? "Edit Client" : "Add Client"}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="section-label">Full Name *</label>
            <input className="input" placeholder="Customer name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div>
            <label className="section-label">Phone Number *</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <label className="section-label">Email (optional)</label>
            <input className="input" type="email" placeholder="customer@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="section-label">Address (optional)</label>
            <textarea className="input" rows={2} placeholder="Delivery address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="section-label">Client Type</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {["INDIVIDUAL","RETAIL","WHOLESALE","CORPORATE","OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="section-label">Notes (optional)</label>
            <input className="input" placeholder="Internal notes about this client" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}