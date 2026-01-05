import { Link } from "react-router-dom";
import NotificationBell from "./notifications/NotificationBell";

export default function Header() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Nursery Orders
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        {/* keep space for future actions */}
        {/* <Link to="/create">Create Order</Link> */}
      </div>
    </div>
  );
}