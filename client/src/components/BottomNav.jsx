import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Settings
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard
  },
  {
    label: "Orders",
    path: "/order",
    icon: ClipboardList
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings
  }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-7xl">
        <ul className="flex h-16">
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path} className="flex-1">
              <NavLink
                to={path}
                end
                className={({ isActive }) =>
                  `
                  flex h-full flex-col items-center justify-center gap-1
                  text-xs font-medium transition-all
                  ${
                    isActive
                      ? "text-green-600"
                      : "text-gray-500 hover:text-gray-800"
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      className={isActive ? "stroke-[2.5]" : ""}
                    />
                    <span>{label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 h-1 w-10 rounded-t-full bg-green-600" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
