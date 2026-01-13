import { useNavigate } from "react-router-dom";

export default function DashboardTopBar() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md px-6 py-3 flex items-center justify-between">
      {/* Left: Page context */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Dashboard
      </h2>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Go to Orders */}
        <button
          onClick={() => navigate("/order")}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-gray-300 rounded-md transition"
        >
          Go to Orders
          <span className="text-base">→</span>
        </button>

        {/* Create Order (Primary) */}
        {/* <button
          onClick={() => navigate("/create")}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition"
        >
          Create Order
        </button> */}
      </div>
    </div>
  );
}
