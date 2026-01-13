import Header from "../components/Header";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import OverdueOrders from "../components/dashboard/OverdueOrders";
import DueTodayOrders from "../components/dashboard/DueTodayOrders";
import UpcomingOrders from "../components/dashboard/UpcomingOrders";

const Dashboard = () => {
  return (
    <div className="p-4 space-y-6">
      <Header />

      <DashboardTopBar />

      <SummaryCards />
      <OverdueOrders />
      <DueTodayOrders />
      <UpcomingOrders />
    </div>
  );
};

export default Dashboard;
