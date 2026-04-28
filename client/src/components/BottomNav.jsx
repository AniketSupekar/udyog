// src/components/BottomNav.jsx
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Settings, IndianRupee } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/dashboard",   icon: LayoutDashboard },
  { label: "Orders",    path: "/orders",       icon: ClipboardList },
  { label: "Dues",      path: "/outstanding",  icon: IndianRupee },
  { label: "Analytics", path: "/analytics",    icon: BarChart3 },
  { label: "Settings",  path: "/settings",     icon: Settings },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderTop: "1px solid var(--color-border)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      <div style={{ maxWidth: 768, margin: "0 auto", display: "flex", height: 64 }}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            style={{ flex: 1, textDecoration: "none" }}
          >
            {({ isActive }) => (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: 4,
                position: "relative",
                color: isActive ? "var(--color-accent)" : "var(--color-text-tertiary)",
                transition: "color 0.15s",
              }}>
                {isActive && (
                  <span style={{
                    position: "absolute", top: 0, left: "50%",
                    transform: "translateX(-50%)",
                    width: 28, height: 2,
                    borderRadius: "0 0 2px 2px",
                    background: "var(--color-accent)",
                  }} />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span style={{ fontSize: "0.6875rem", fontWeight: isActive ? 600 : 400, letterSpacing: "0.01em" }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}