// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)" }}>
      <main
        style={{
          maxWidth: "768px",
          margin: "0 auto",
          padding: "16px 16px 88px",
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}