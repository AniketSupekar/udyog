import { useNavigate } from "react-router-dom";
import {
  Calendar,
  AlertTriangle,
  Clock,
  Hourglass
} from "lucide-react";

const cardConfig = {
  dueToday: {
    label: "Due Today",
    icon: Calendar,
    bg: "bg-yellow-100",
    iconBg: "bg-white/80",
    iconColor: "text-yellow-700",
    route: "/order?filter=due-today"
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    bg: "bg-red-100",
    iconBg: "bg-white/80",
    iconColor: "text-red-700",
    route: "/order?filter=overdue"
  },
  upcoming: {
    label: "Upcoming",
    icon: Clock,
    bg: "bg-blue-100",
    iconBg: "bg-white/80",
    iconColor: "text-blue-700",
    route: "/order?filter=upcoming"
  },
  pending: {
    label: "Pending",
    icon: Hourglass,
    bg: "bg-purple-100",
    iconBg: "bg-white/80",
    iconColor: "text-purple-700",
    route: "/order?status=PENDING"
  }
};

const SummaryCards = ({ summary }) => {
  const navigate = useNavigate();
  if (!summary) return null;

  const cards = [
    { type: "dueToday", value: summary.dueToday },
    { type: "overdue", value: summary.overdue },
    { type: "upcoming", value: summary.upcoming },
    { type: "pending", value: summary.pending }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(({ type, value }) => {
        const config = cardConfig[type];
        const Icon = config.icon;

        return (
          <button
            key={config.label}
            onClick={() => navigate(config.route)}
            className={`
            ${config.bg}
            rounded-xl p-4 text-left
            transition-all duration-200
            hover:shadow-md hover:-translate-y-[2px]
            active:scale-[0.98]
          `}
          >
            {/* Icon */}
            <div
              className={`
              w-9 h-9 rounded-lg
              ${config.iconBg}
              flex items-center justify-center
              mb-3
            `}
            >
              <Icon className={`w-4.5 h-4.5 ${config.iconColor}`} />
            </div>

            {/* Count */}
            <div className="text-2xl font-bold text-gray-900 leading-tight">
              {value}
            </div>

            {/* Label */}
            <div className="mt-1 text-sm font-medium text-gray-600">
              {config.label}
            </div>
          </button>
        );
      })}
    </div>
  );


};

export default SummaryCards;
