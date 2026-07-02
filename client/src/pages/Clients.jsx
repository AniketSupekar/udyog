import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getClients, createClient, updateClient } from "../services/client.api";
import { useToast } from "../context/ToastContext";
import { Search, Plus, X, User, ChevronRight } from "lucide-react";

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
          <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
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
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s", textAlign: "left", border: "none" }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "var(--color-accent-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: "1rem", fontWeight: 500, color: "var(--color-accent)",
                }}>
                  {client.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {client.name}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {client.phone}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="amount" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-primary)" }}>
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
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)",
          right: 24,
          width: 52, height: 52,
          background: "var(--color-cta)", borderRadius: "var(--radius-full)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          border: "none", cursor: "pointer", zIndex: 40,
        }}
      >
        <Plus size={22} color="white" />
      </button>

      {/* CREATE MODAL — portaled to body */}
      {showForm && createPortal(
        <ClientFormModal
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />,
        document.body
      )}
    </div>
  );
}

/* ─── Client Form Modal ──────────────────────────────────────────────── */
function ClientFormModal({ client, onClose, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(client);
  const scrollRef = useRef(null);
  const [form, setForm] = useState({
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    type: client?.type || "INDIVIDUAL",
    notes: client?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }
    setLoading(true);
    try {
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

  const field = (label, node) => (
    <div>
      <label style={{
        fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--color-text-tertiary)",
        display: "block", marginBottom: 6,
      }}>{label}</label>
      {node}
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-in"
        style={{
          background: "var(--color-surface)",
          borderRadius: "20px 20px 0 0",
          width: "100%", maxWidth: 480,
          maxHeight: "calc(100dvh - 60px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header — fixed, never scrolls */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
            <div style={{ width: 36, height: 4, background: "var(--color-border-strong)", borderRadius: 99 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 14px" }}>
            <h2 style={{ fontWeight: 500, fontSize: "1rem", color: "var(--color-text-primary)" }}>
              {isEdit ? "Edit Client" : "Add Client"}
            </h2>
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, background: "var(--color-bg)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} color="var(--color-text-secondary)" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>

            {field("Full Name *",
              <input className="input" placeholder="e.g. Ramesh Textiles" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
            )}

            {field("Phone Number *",
              <input className="input" placeholder="98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            )}

            {field("Email (optional)",
              <input className="input" type="email" placeholder="customer@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            )}

            {field("Address (optional)",
              <textarea className="input" rows={2} placeholder="Delivery address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            )}

            {field("Client Type",
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {["INDIVIDUAL", "RETAIL", "WHOLESALE", "CORPORATE", "OTHER"].map(t => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            )}

            {field("Notes (optional)",
              <input className="input" placeholder="Internal notes about this client" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            )}

            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}