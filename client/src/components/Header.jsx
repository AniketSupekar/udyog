import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./notifications/NotificationBell";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Sign out?")) return;
    await logout();
  };

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      marginBottom: 8,
    }}>
      {/* Logo + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo.png"
          alt="Udyog"
          style={{ width: 32, height: 32, objectFit: "contain" }}
        />
        <div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
            Order Management
          </p>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <NotificationBell />
        {user && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(p => !p)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                height: 40, padding: "0 12px",
                background: "var(--color-surface)",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 26, height: 26,
                background: "var(--color-accent)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, color: "white",
              }}>
                {user.name?.[0]?.toUpperCase() || "A"}
              </div>
              <ChevronDown size={14} color="var(--color-text-secondary)" style={{ transform: showMenu ? "rotate(180deg)" : "", transition: "transform 0.15s" }} />
            </button>

            {showMenu && (
              <div className="animate-in" style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                minWidth: 160, overflow: "hidden", zIndex: 100,
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{user.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 2 }}>{user.email}</p>
                </div>
                <button
                  onClick={() => { navigate("/settings"); setShowMenu(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text-primary)" }}
                >
                  <Settings size={15} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-danger)" }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}