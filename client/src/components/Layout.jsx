import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-4 md:px-6 md:py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
