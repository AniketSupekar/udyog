import { useEffect, useState } from "react";
import Header from "../components/Header";
import SummaryCards from "../components/dashboard/SummaryCards";
import OverdueOrders from "../components/dashboard/OverdueOrders";
import DueTodayOrders from "../components/dashboard/DueTodayOrders";
import UpcomingOrders from "../components/dashboard/UpcomingOrders";
import { getFullDashboard } from "../services/dashboard.api";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFullDashboard()
      .then(res => {
        // API returns { success, data: { summary, snapshot, overdue, dueToday, upcoming } }
        setData(res.data.data);
      })
      .catch(err => {
        console.error("Dashboard load failed:", err);
        setError("Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || "Something went wrong"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      <section className="space-y-4">
        <SummaryCards summary={data.summary} />
      </section>

      <section className="space-y-6">
        <OverdueOrders orders={data.overdue} />
        <DueTodayOrders orders={data.dueToday} />
        <UpcomingOrders orders={data.upcoming} />
      </section>
    </div>
  );
};

export default Dashboard;