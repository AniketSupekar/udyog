import { LogOut, User, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account
        </p>
      </div>

      {/* Profile Card */}
      <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white text-xl font-semibold">
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>

        <div className="flex-1">
          <div className="text-base font-medium text-gray-900">
            {user?.name || "Admin"}
          </div>
          <div className="text-sm text-gray-500">
            {user?.email || "admin@nursery.com"}
          </div>
        </div>
      </div>

      {/* Section */}
      <div className="rounded-2xl border bg-white divide-y">
        <div className="flex items-center gap-3 p-4">
          <User className="text-green-600" size={20} />
          <div>
            <div className="text-sm font-medium">Profile</div>
            <div className="text-xs text-gray-500">
              Coming soon
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4">
          <Info className="text-green-600" size={20} />
          <div>
            <div className="text-sm font-medium">About</div>
            <div className="text-xs text-gray-500">
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
            {/* Logout */}
      <button
        onClick={() => {
          const confirmed = window.confirm(
            "Are you sure you want to logout?"
          );
          if (confirmed) {
            logout();
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-red-600 font-medium hover:bg-red-100 transition"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default Settings;