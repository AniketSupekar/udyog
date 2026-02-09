import { useEffect, useState } from "react";
import { getBusinessSnapshot } from "../../services/dashboard.api";
import { format, subMonths } from "date-fns";

const BusinessSnapshot = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [snapshot, setSnapshot] = useState({
    deliveredOrders: 0,
    totalQuantity: 0
  });
  const [loading, setLoading] = useState(false);

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
    <section className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/60">
        <h3 className="text-sm font-semibold text-gray-900">
          Business Snapshot
        </h3>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-xs border rounded-md px-2 py-1 bg-white focus:outline-none"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="rounded-lg p-4 bg-green-50/70 border border-green-100">
          <div className="text-xs text-gray-600">
            Delivered Orders
          </div>
          <div className="mt-1 text-2xl font-semibold text-green-700">
            {loading ? "…" : snapshot.deliveredOrders}
          </div>
        </div>

        <div className="rounded-lg p-4 bg-blue-50/70 border border-blue-100">
          <div className="text-xs text-gray-600">
            Total Quantity
          </div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">
            {loading ? "…" : snapshot.totalQuantity}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessSnapshot;
