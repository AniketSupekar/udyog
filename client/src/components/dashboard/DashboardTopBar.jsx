import { useNavigate } from "react-router-dom";

export default function DashboardTopBar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-200">
      
      {/* Left: Title */}
      <div className="flex flex-col">
        <h2 className="text-base font-semibold text-gray-800">
          Dashboard
        </h2>
        <span className="text-xs text-gray-500">
          Overview of today’s activity
        </span>
      </div>

      {/* Right: Action */}
      <button
        onClick={() => navigate("/order")}
        className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
      >
        Orders
        <span className="text-lg leading-none">→</span>
      </button>
    </div>
  );
}
