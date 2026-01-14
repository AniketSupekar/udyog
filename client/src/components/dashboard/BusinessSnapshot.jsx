// src/components/dashboard/BusinessSnapshot.jsx
import { useEffect, useState } from "react";
import { getBusinessSnapshot } from "../../services/dashboard.api";
import { format, subMonths } from "date-fns";

const BusinessSnapshot = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [snapshot, setSnapshot] = useState({ deliveredOrders: 0, totalQuantity: 0 });
  const [loading, setLoading] = useState(false);

  // Generate last 12 months for dropdown
  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return {
      label: format(date, "MMMM yyyy"),
      value: format(date, "yyyy-MM")
    };
  });

  const fetchSnapshot = async (selectedMonth) => {
    setLoading(true);
    try {
      const res = await getBusinessSnapshot({ month: selectedMonth });
      setSnapshot(res.data);
    } catch (err) {
      console.error("Failed to fetch snapshot", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot(month);
  }, [month]);

  return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-200 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Business Snapshot</h3>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded-md text-sm"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col items-start justify-center">
          <span className="text-sm text-gray-500">Delivered Orders</span>
          <span className="text-2xl font-semibold text-green-700">
            {loading ? "..." : snapshot.deliveredOrders}
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-start justify-center">
          <span className="text-sm text-gray-500">Total Quantity</span>
          <span className="text-2xl font-semibold text-blue-700">
            {loading ? "..." : snapshot.totalQuantity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BusinessSnapshot;
