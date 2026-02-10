import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./notifications/NotificationBell";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    try {
      await logout();
      alert("You have been logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed! Please try again.");
    }
  };

  return (
    <header className="flex items-center justify-between rounded-2xl border bg-white px-5 py-4 shadow-sm">
      {/* Left */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Nursery Orders
        </h1>
        <p className="text-xs text-gray-500">
          Manage daily orders & deliveries
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Create Order */}
        {/* <button
          onClick={() => navigate("/create")}
          className="flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition"
        >
          <Plus size={16} />
          Create
        </button> */}

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        {user && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                {user.name?.[0]?.toUpperCase() || "A"}
              </div>
              <span className="hidden sm:block">{user.name}</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  showMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
