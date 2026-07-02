import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClientById, updateClient, deleteClient, getClientLedger } from "../services/client.api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import {
  ChevronLeft, Edit2, Trash2, Phone, Mail,
  MapPin, X, Check, BookOpen, ShoppingBag,
} from "lucide-react";

const TABS = [
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "ledger", label: "Ledger", icon: BookOpen },
];

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  useEffect(() => {
    getClientById(id)
      .then(res => { setData(res.data); setForm(res.data); })
      .catch(() => navigate("/clients"))
      .finally(() => setLoading(false));
  }, [id]);

  // Load ledger only when tab is clicked
  useEffect(() => {
    if (activeTab !== "ledger" || ledger) return;
    setLedgerLoading(true);
    getClientLedger(id)
      .then(setLedger)
      .catch(() => toast.error("Failed to load ledger"))
      .finally(() => setLedgerLoading(false));
  }, [activeTab]);

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
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.875rem", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 12 }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.375rem", fontWeight: 500, color: "white", flexShrink: 0 }}>
              {data.name[0].toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ height: 36, fontSize: "1rem", fontWeight: 500 }} />
              ) : (
                <h1 style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--color-text-primary)" }}>{data.name}</h1>
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

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Orders", value: data.stats?.totalOrders || 0, color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "Revenue", value: formatCurrency(data.stats?.totalRevenue || 0), color: "#15803D", bg: "#F0FDF4" },
          { label: "Outstanding", value: formatCurrency(Math.max(0, totalOutstanding)), color: totalOutstanding > 0 ? "#B91C1C" : "#15803D", bg: totalOutstanding > 0 ? "#FEF2F2" : "#F0FDF4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: "var(--radius-lg)", padding: "12px 14px" }}>
            <p style={{ fontSize: "0.6875rem", color: s.color, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p className="amount" style={{ fontSize: "1rem", fontWeight: 500, color: s.color, marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <div className="card" style={{ padding: "16px", marginBottom: 12 }}>
        <p className="section-label">Contact</p>
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
          {isEditing
            ? <textarea className="input" rows={2} placeholder="Internal notes..." value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
            : <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>{data.notes}</p>
          }
        </div>
      )}

      {/* TABS — Orders | Ledger */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px",
                fontSize: "0.8125rem", fontWeight: active ? 500 : 400,
                color: active ? "white" : "var(--color-text-secondary)",
                background: active ? "var(--color-cta)" : "var(--color-surface)",
                border: `1.5px solid ${active ? "var(--color-cta)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-full)",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-sans)",
              }}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="card" style={{ padding: "16px" }}>
          {data.recentOrders?.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", textAlign: "center", padding: "24px 0" }}>No orders yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {data.recentOrders?.map((order, i) => (
                <button
                  key={order._id}
                  onClick={() => navigate(`/orders/${order._id}`)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 0",
                    borderBottom: i < data.recentOrders.length - 1 ? "1px solid var(--color-border)" : "none",
                    background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                      {formatDate(order.deliveryDate || order.createdAt)}
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
          )}
        </div>
      )}

      {/* LEDGER TAB */}
      {activeTab === "ledger" && (
        ledgerLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
          </div>
        ) : ledger ? (
          <LedgerView ledger={ledger} navigate={navigate} />
        ) : null
      )}
    </div>
  );
}

/* ─── Ledger View ──────────────────────────────────────────────────── */
function LedgerView({ ledger, navigate }) {
  const { summary, entries } = ledger;

  return (
    <div>
      {/* Ledger summary */}
      <div className="card" style={{ padding: "16px", marginBottom: 14 }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Summary</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <LedgerRow label="Total billed" value={formatCurrency(summary.totalCharged)} />
          <LedgerRow label="Total received" value={formatCurrency(summary.totalPaid)} valueColor="var(--color-success)" />
          <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
          <LedgerRow
            label="Balance outstanding"
            value={formatCurrency(summary.totalOutstanding)}
            valueColor={summary.totalOutstanding > 0 ? "var(--color-danger)" : "var(--color-success)"}
            bold
          />
        </div>
      </div>

      {/* Khata entries — oldest to newest, running balance */}
      <div style={{ position: "relative" }}>
        {/* Timeline line */}
        <div style={{
          position: "absolute", left: 15, top: 8, bottom: 8,
          width: 1, background: "var(--color-border)",
          zIndex: 0,
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.length === 0 ? (
            <div className="card" style={{ padding: "24px 16px", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>No transactions yet</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const isPaid = entry.paymentStatus === "PAID";
              const isPartial = entry.paymentStatus === "PARTIAL";
              const dotColor = isPaid ? "var(--color-success)" : isPartial ? "var(--color-warning)" : "var(--color-danger)";

              return (
                <div key={entry.orderId} style={{ display: "flex", gap: 14, position: "relative", zIndex: 1 }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "var(--color-surface)",
                    border: `2px solid ${dotColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 8,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor }} />
                  </div>

                  {/* Entry card */}
                  <div
                    className="card"
                    style={{ flex: 1, padding: "12px 14px", cursor: "pointer" }}
                    onClick={() => navigate(`/orders/${entry.orderId}`)}
                  >
                    {/* Top row — date + running balance */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 1 }}>
                          {formatDate(entry.date)}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusBadge status={entry.status} />
                          {entry.source === "STOREFRONT" && (
                            <span style={{ fontSize: "0.5625rem", fontWeight: 500, background: "var(--color-accent-light)", color: "var(--color-accent)", padding: "1px 5px", borderRadius: 4 }}>
                              STORE
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", marginBottom: 1 }}>Running balance</p>
                        <p className="amount" style={{ fontSize: "0.875rem", fontWeight: 500, color: entry.runningBalance > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                          {formatCurrency(entry.runningBalance)}
                        </p>
                      </div>
                    </div>

                    {/* Items summary */}
                    {entry.items?.length > 0 && (
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                        {entry.items.slice(0, 2).map(i => `${i.productName} ×${i.quantity}`).join(", ")}
                        {entry.items.length > 2 && ` +${entry.items.length - 2} more`}
                      </p>
                    )}

                    {/* Amount row */}
                    <div style={{ display: "flex", gap: 16 }}>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>Billed</p>
                        <p className="amount" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{formatCurrency(entry.charged)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>Paid</p>
                        <p className="amount" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-success)" }}>{formatCurrency(entry.paid)}</p>
                      </div>
                      {entry.outstanding > 0 && (
                        <div>
                          <p style={{ fontSize: "0.625rem", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>Due</p>
                          <p className="amount" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-danger)" }}>{formatCurrency(entry.outstanding)}</p>
                        </div>
                      )}
                    </div>

                    {/* Individual payments */}
                    {entry.transactions?.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
                        {entry.transactions.map((txn, ti) => (
                          <div key={ti} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ti < entry.transactions.length - 1 ? 4 : 0 }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                              {txn.method} · {formatDate(txn.recordedAt)}
                            </span>
                            <span className="amount" style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>
                              +{formatCurrency(txn.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Closing balance */}
        {entries.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 10, position: "relative", zIndex: 1 }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{
              flex: 1, padding: "12px 14px",
              background: summary.totalOutstanding > 0 ? "#FEF2F2" : "#F0FDF4",
              borderRadius: "var(--radius-lg)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: summary.totalOutstanding > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                {summary.totalOutstanding > 0 ? "Total outstanding" : "Account clear ✓"}
              </p>
              <p className="amount" style={{ fontSize: "1rem", fontWeight: 500, color: summary.totalOutstanding > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                {formatCurrency(summary.totalOutstanding)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LedgerRow({ label, value, valueColor, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{label}</span>
      <span className="amount" style={{ fontSize: bold ? "1rem" : "0.875rem", fontWeight: bold ? 500 : 400, color: valueColor || "var(--color-text-primary)" }}>
        {value}
      </span>
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