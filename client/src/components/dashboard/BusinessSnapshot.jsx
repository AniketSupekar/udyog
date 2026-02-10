import { useEffect, useState } from "react";
import { getBusinessSnapshot } from "../../services/dashboard.api";
import { format, subMonths } from "date-fns";
import { TrendingUp, Package } from "lucide-react";

const BusinessSnapshot = () => {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [snapshot, setSnapshot] = useState({
    deliveredOrders: 0,
    totalQuantity: 0,
  });
  const [loading, setLoading] = useState(false);

  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return {
      label: format(date, "MMMM yyyy"),
      value: format(date, "yyyy-MM"),
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
    <section className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1 px-5 py-4 border-b bg-gray-50/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Business Snapshot
            </h3>
            <p className="text-xs text-gray-500">
              Monthly performance overview
            </p>
          </div>

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        {/* Delivered Orders */}
        <div className="flex items-center gap-4 rounded-xl border bg-green-50/70 border-green-100 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
            <TrendingUp size={22} />
          </div>

          <div>
            <div className="text-xs text-gray-600">
              Delivered Orders
            </div>
            <div className="mt-1 text-2xl font-semibold text-green-700">
              {loading ? "…" : snapshot.deliveredOrders}
            </div>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="flex items-center gap-4 rounded-xl border bg-blue-50/70 border-blue-100 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Package size={22} />
          </div>

          <div>
            <div className="text-xs text-gray-600">
              Total Quantity Delivered
            </div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">
              {loading ? "…" : snapshot.totalQuantity}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessSnapshot;
