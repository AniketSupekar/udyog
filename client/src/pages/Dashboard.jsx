// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import Header from "../components/Header";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import OverdueOrders from "../components/dashboard/OverdueOrders";
import DueTodayOrders from "../components/dashboard/DueTodayOrders";
import UpcomingOrders from "../components/dashboard/UpcomingOrders";
import BusinessSnapshot from "../components/dashboard/BusinessSnapshot";
import { getDashboardSummaryForTenant } from "../services/dashboard.api";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummaryForTenant()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading dashboard…</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <Header />

      <DashboardTopBar />

      {/* Snapshot stays separate (by design) */}
      <BusinessSnapshot />

      {/* SUMMARY */}
      <SummaryCards summary={data.summary} />

      {/* LISTS */}
      <OverdueOrders orders={data.overdue} />
      <DueTodayOrders orders={data.dueToday} />
      <UpcomingOrders orders={data.upcoming} />
    </div>
  );
};

export default Dashboard;