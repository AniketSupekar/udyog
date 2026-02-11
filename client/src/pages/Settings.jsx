import { useState } from "react";
import {
  LogOut,
  User,
  Info,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/notifications/NotificationBell";

const Settings = () => {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const openComingSoon = (feature) => {
    setModalContent(`${feature} will be available in a future update.`);
    setShowModal(true);
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) logout();
  };

  const version = "1.0.0";

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className="flex items-center gap-5 rounded-3xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white text-xl font-semibold shadow-sm">
          {user?.name?.[0]?.toUpperCase() || "A"}
        </div>

        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-900">
            {user?.name || "Admin"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {user?.email || "admin@nursery.com"}
          </div>
        </div>

        {/* Inline Notifications Bell */}
        <NotificationBell />
      </div>

      {/* ACCOUNT SECTION */}
      <Section title="Account">
        <Item
          icon={<User size={18} />}
          title="Profile"
          subtitle="Manage personal information"
          onClick={() => openComingSoon("Profile management")}
        />
        <Item
          icon={<Building2 size={18} />}
          title="Nursery Details"
          subtitle={user?.nurseryName || "Your nursery"}
          onClick={() => openComingSoon("Nursery settings")}
        />
      </Section>

      {/* PREFERENCES */}
      <Section title="Preferences">
        <Item
          icon={<Bell size={18} />}
          title="Notifications"
          subtitle="View and manage notifications"
          onClick={() => openComingSoon("Notification settings")}
        />
        <Item
          icon={<Shield size={18} />}
          title="Privacy & Security"
          subtitle="Manage your data"
          onClick={() => openComingSoon("Privacy settings")}
        />
      </Section>

      {/* SUPPORT */}
      <Section title="Support">
        <Item
          icon={<HelpCircle size={18} />}
          title="Help Center"
          subtitle="FAQs and support resources"
          onClick={() => openComingSoon("Help center")}
        />
        <Item
          icon={<Info size={18} />}
          title="About"
          subtitle={`Version ${version}`}
        />
      </Section>

      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-red-50 border border-red-100 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
      >
        <LogOut size={18} />
        Logout
      </button>

      {/* COMING SOON MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Coming Soon
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {modalContent}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

/* ---------- Reusable Components ---------- */

const Section = ({ title, children }) => (
  <div>
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
      {title}
    </h2>
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 divide-y divide-gray-100">
      {children}
    </div>
  </div>
);

const Item = ({ icon, title, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between p-5 ${
      onClick ? "cursor-pointer hover:bg-gray-50 transition" : ""
    }`}
  >
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
    {onClick && <ChevronRight size={18} className="text-gray-400" />}
  </div>
);
