import { useState, useRef, useEffect } from "react";
import NotificationBell from "./notifications/NotificationBell";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

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
    <header className="flex items-center justify-between bg-white shadow-md px-6 py-4 rounded-md mb-6">
      {/* Left: Title */}
      <h1 className="text-xl font-semibold text-gray-800">Nursery Orders</h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Admin Name / Dropdown */}
        {user && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full shadow-sm transition duration-200 font-medium text-gray-700"
            >
              <span className="text-sm">{user.name}</span>
              <svg
                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                  showMenu ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        <NotificationBell />
      </div>
    </header>
  );
}
