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
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identity / Navigation */}
      <Header />

      {/* Context + actions */}
      {/* <DashboardTopBar /> */}

      {/* Business overview */}
      <section className="space-y-4">
        <SummaryCards summary={data.summary} />
        {/* <BusinessSnapshot /> */}
      </section>

      {/* Operational lists */}
      <section className="space-y-6">
        <OverdueOrders orders={data.overdue} />
        <DueTodayOrders orders={data.dueToday} />
        <UpcomingOrders orders={data.upcoming} />
      </section>
    </div>
  );
};

export default Dashboard;
