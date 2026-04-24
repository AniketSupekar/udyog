// src/pages/Analytics.jsx
import { useState, useEffect } from "react";
import { getBusinessSnapshot } from "../services/dashboard.api";
import { format, subMonths } from "date-fns";
import { TrendingUp, IndianRupee, CheckCircle, Info } from "lucide-react";
import { formatCurrency } from "../utils/currency.util";

export default function Analytics() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), i);
    return { label: format(date, "MMMM yyyy"), value: format(date, "yyyy-MM") };
  });

  useEffect(() => {
    setLoading(true);
    getBusinessSnapshot({ month })
      .then((res) => setSnapshot(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  const collectionRate = snapshot?.totalRevenue > 0
    ? Math.round((snapshot.totalCollected / snapshot.totalRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Track your business performance</p>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Business Snapshot</h3>
            <p className="text-xs text-gray-500 mt-0.5">Monthly performance overview</p>
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <MetricCard
            icon={<CheckCircle size={22} />}
            label="Delivered Orders"
            value={loading ? "…" : snapshot?.deliveredOrders ?? 0}
            color="green"
          />
          <MetricCard
            icon={<IndianRupee size={22} />}
            label="Total Revenue"
            value={loading ? "…" : formatCurrency(snapshot?.totalRevenue ?? 0)}
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp size={22} />}
            label="Collection Rate"
            value={loading ? "…" : `${collectionRate}%`}
            color={collectionRate >= 80 ? "green" : collectionRate >= 50 ? "yellow" : "red"}
          />
        </div>

        {/* Collection breakdown */}
        {snapshot && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Revenue (delivered orders)</span>
              <span className="font-medium">{formatCurrency(snapshot.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Amount Collected</span>
              <span className="font-medium text-green-600">{formatCurrency(snapshot.totalCollected)}</span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-2">
              <span>Outstanding</span>
              <span className="font-medium text-red-600">
                {formatCurrency((snapshot.totalRevenue || 0) - (snapshot.totalCollected || 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-2xl border bg-gray-50 p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">About Analytics: </span>
            This snapshot shows delivered orders for the selected month. Use the dropdown to navigate between months.
            More detailed analytics including revenue trends and top customers are coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

const colorMap = {
  green: { bg: "bg-green-50 border-green-100", icon: "bg-green-100 text-green-700", text: "text-green-700" },
  blue: { bg: "bg-blue-50 border-blue-100", icon: "bg-blue-100 text-blue-700", text: "text-blue-700" },
  yellow: { bg: "bg-yellow-50 border-yellow-100", icon: "bg-yellow-100 text-yellow-700", text: "text-yellow-700" },
  red: { bg: "bg-red-50 border-red-100", icon: "bg-red-100 text-red-700", text: "text-red-700" },
};

const MetricCard = ({ icon, label, value, color = "green" }) => {
  const c = colorMap[color];
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-4 ${c.bg}`}>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${c.icon}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${c.text}`}>{value}</p>
      </div>
    </div>
  );
};