import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFullDashboard } from "../services/dashboard.api";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency.util";
import { formatDate } from "../utils/date.util";
import StatusBadge from "../components/StatusBadge";
import { AlertTriangle, Clock, Calendar, Hourglass, ChevronRight, IndianRupee, Store, MessageCircle, Search, X, Package, Users, ClipboardList } from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";
import { globalSearch } from "../services/search.api";
import { formatCurrency as fc } from "../utils/currency.util";
import { createPortal } from "react-dom";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    getFullDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const sendDailySummary = (summary) => {
    if (!user?.phone && !summary) return;
    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const lines = [
      `📊 *Daily Business Summary — ${today}*`,
      ``,
      `📦 Orders due today: *${summary.dueToday}*`,
      `⚠️ Overdue orders: *${summary.overdue}*`,
      `🕐 Upcoming (7 days): *${summary.upcoming}*`,
      `⏳ Pending: *${summary.pending}*`,
      ``,
      `💰 Total outstanding: *₹${summary.totalOutstanding?.toLocaleString("en-IN")}*`,
      ``,
      `_Sent from Udyog_`,
    ];
    const encoded = lines.map(l => encodeURIComponent(l)).join("%0A");
    const phone = user?.phone?.replace(/\D/g, "") || "";
    const normalized = phone.startsWith("91") ? phone : `91${phone}`;
    const url = normalized.length > 2
      ? `https://wa.me/${normalized}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { summary, overdue, dueToday, upcoming } = data;

  return (
    <>
      {/* STICKY NAVBAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
        padding: "12px var(--page-padding)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <img src="/logo.jpeg" alt="Udyog" style={{ height: 30, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Search button */}
          <button
            onClick={() => setShowSearch(true)}
            style={{
              width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--color-bg)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", cursor: "pointer",
            }}
          >
            <Search size={17} color="var(--color-text-secondary)" />
          </button>
          <NotificationBell />
        </div>
      </div>

      <div className="page animate-in" style={{ paddingTop: 18 }}>

        {/* GREETING */}
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", fontWeight: 400, marginBottom: 16 }}>
          {greeting()}, {user?.name?.split(" ")[0] || "Admin"}
        </p>

        {/* OUTSTANDING BANNER */}
        {summary?.totalOutstanding > 0 && (
          <button
            onClick={() => navigate("/outstanding")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "var(--radius-lg)", padding: "14px 16px",
              marginBottom: 12, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "white", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IndianRupee size={18} color="var(--color-danger)" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-danger)", fontWeight: 500 }}>Outstanding dues</p>
                <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--color-danger)" }}>
                  {formatCurrency(summary.totalOutstanding)}
                </p>
              </div>
            </div>
            <ChevronRight size={18} color="var(--color-danger)" />
          </button>
        )}

        {/* STOREFRONT BANNER */}
        {summary?.storefrontNew > 0 && (
          <button
            onClick={() => navigate("/orders?source=STOREFRONT")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--color-accent-light)", border: "1.5px solid var(--color-accent)",
              borderRadius: "var(--radius-lg)", padding: "14px 16px",
              marginBottom: 12, cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "var(--color-accent)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={18} color="white" />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-accent)", fontWeight: 500 }}>New store orders</p>
                <p className="amount" style={{ fontSize: "1.125rem", fontWeight: 500, color: "var(--color-accent)" }}>
                  {summary.storefrontNew} order{summary.storefrontNew > 1 ? "s" : ""} to review
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: "var(--color-accent)", borderRadius: "50%", animation: "pulse 2s infinite" }} />
              <ChevronRight size={18} color="var(--color-accent)" />
            </div>
          </button>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }`}</style>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <SummaryCard label="Due today" value={summary?.dueToday || 0} icon={Calendar} iconColor="#B45309" pill="Today" pillBg="#FFFBEB" pillColor="#B45309" onClick={() => navigate("/orders?filter=due-today")} />
          <SummaryCard label="Overdue" value={summary?.overdue || 0} icon={AlertTriangle} iconColor="#B91C1C" pill="Urgent" pillBg="#FEF2F2" pillColor="#B91C1C" onClick={() => navigate("/orders?filter=overdue")} />
          <SummaryCard label="Upcoming" value={summary?.upcoming || 0} icon={Clock} iconColor="#1D4ED8" pill="7 days" pillBg="#EFF6FF" pillColor="#1D4ED8" onClick={() => navigate("/orders?filter=upcoming")} />
          <SummaryCard label="Pending" value={summary?.pending || 0} icon={Hourglass} iconColor="#6D28D9" pill="Active" pillBg="#F5F3FF" pillColor="#6D28D9" onClick={() => navigate("/orders?status=PENDING")} />
        </div>

        {/* DAILY SUMMARY BUTTON */}
        <button
          onClick={() => sendDailySummary(summary)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 16px", marginBottom: 24,
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", cursor: "pointer",
            fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <MessageCircle size={15} color="#15803D" />
          Send today's summary to WhatsApp
        </button>

        {/* ORDER SECTIONS */}
        {overdue?.length > 0 && (
          <OrderSection title="Overdue" icon={<AlertTriangle size={15} color="var(--color-danger)" />} titleColor="var(--color-danger)" orders={overdue} viewAllPath="/orders?filter=overdue" navigate={navigate} />
        )}
        {dueToday?.length > 0 && (
          <OrderSection title="Due today" icon={<Calendar size={15} color="var(--color-warning)" />} titleColor="var(--color-warning)" orders={dueToday} viewAllPath="/orders?filter=due-today" navigate={navigate} />
        )}
        {upcoming?.length > 0 && (
          <OrderSection title="Upcoming (7 days)" icon={<Clock size={15} color="var(--color-info)" />} titleColor="var(--color-info)" orders={upcoming} viewAllPath="/orders?filter=upcoming" navigate={navigate} />
        )}

        {!overdue?.length && !dueToday?.length && !upcoming?.length && (
          <div className="empty-state card" style={{ marginTop: 8 }}>
            <div className="empty-state-icon"><Calendar size={22} color="var(--color-text-tertiary)" /></div>
            <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>All clear today</p>
            <p style={{ fontSize: "0.875rem", marginTop: 4 }}>No orders due, overdue, or upcoming</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate("/orders/create")}>Create first order</button>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {showSearch && createPortal(
        <SearchModal onClose={() => setShowSearch(false)} navigate={navigate} />,
        document.body
      )}
    </>
  );
}

/* ─── Search Modal ───────────────────────────────────────────────────────── */
function SearchModal({ onClose, navigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // focus input on mount
    const t = setTimeout(() => {
      document.getElementById("global-search-input")?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

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

  const goTo = (path) => { onClose(); navigate(path); };
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
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
          <Search size={18} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
          <input
            id="global-search-input"
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
          {!query && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>Type to search orders, clients and products</p>
            </div>
          )}

          {loading && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />)}
            </div>
          )}

          {!loading && noResults && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-text-primary)", marginBottom: 4 }}>No results found</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>Try a different name, phone, or product</p>
            </div>
          )}

          {!loading && hasResults && (
            <div style={{ padding: "8px" }}>
              {results.orders.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Orders ({results.orders.length})
                  </p>
                  {results.orders.map(order => (
                    <button key={order._id} onClick={() => goTo(`/orders/${order._id}`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "var(--color-accent-light)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ClipboardList size={15} color="var(--color-accent)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.clientSnapshot?.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{order.status} · {fc(order.financial?.total)}</p>
                      </div>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 600, background: "var(--color-bg)", color: "var(--color-text-tertiary)", padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>
                        #{order._id?.slice(-6).toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Clients ({results.clients.length})
                  </p>
                  {results.clients.map(client => (
                    <button key={client._id} onClick={() => goTo(`/clients/${client._id}`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "#F0FDF4", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={15} color="#15803D" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{client.phone} · {client.totalOrders || 0} orders</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-tertiary)", padding: "6px 10px" }}>
                    Products ({results.products.length})
                  </p>
                  {results.products.map(product => (
                    <button key={product._id} onClick={() => goTo(`/products`)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--radius-md)", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ width: 32, height: 32, background: "#FFFBEB", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <Package size={15} color="#D97706" />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{fc(product.basePrice)} / {product.unit}{product.category ? ` · ${product.category}` : ""}</p>
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

function SummaryCard({ label, value, icon: Icon, iconColor, pill, pillBg, pillColor, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "var(--color-surface)", border: "none", borderRadius: "var(--radius-lg)", padding: "14px", textAlign: "left", cursor: "pointer", transition: "transform 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Icon size={17} color={iconColor} />
        <span style={{ fontSize: "0.625rem", fontWeight: 500, color: pillColor, background: pillBg, padding: "2px 7px", borderRadius: 5 }}>{pill}</span>
      </div>
      <p className="amount" style={{ fontSize: "1.625rem", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-tertiary)", marginTop: 6 }}>{label}</p>
    </button>
  );
}

function OrderSection({ title, icon, titleColor, orders, viewAllPath, navigate }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {icon}
          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: titleColor }}>{title}</span>
        </div>
        <button onClick={() => navigate(viewAllPath)} style={{ fontSize: "0.75rem", color: titleColor, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
          View all <ChevronRight size={13} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {orders.slice(0, 3).map((order) => (
          <button key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="card"
            style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 15px", cursor: "pointer" }}
          >
            <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {order.clientSnapshot?.name}
                </p>
                {order.source === "STOREFRONT" && (
                  <span style={{ flexShrink: 0, fontSize: "0.5625rem", fontWeight: 500, background: "var(--color-accent-light)", color: "var(--color-accent)", padding: "1px 5px", borderRadius: 4 }}>STORE</span>
                )}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>{formatDate(order.deliveryDate)}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <StatusBadge status={order.status} />
              <ChevronRight size={15} color="var(--color-text-tertiary)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}     

function DashboardSkeleton() {
  return (
    <>
      <div style={{ height: 65, background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }} />
      <div className="page">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: 10 }} />)}
      </div>
    </>
  );
}