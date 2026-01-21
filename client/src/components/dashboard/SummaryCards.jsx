// src/components/dashboard/SummaryCards.jsx
import { useNavigate } from "react-router-dom";

const SummaryCards = ({ summary }) => {
  const navigate = useNavigate();

  if (!summary) return null;

  const cards = [
    { label: "Due Today", value: summary.dueToday, route: "/order?filter=due-today" },
    { label: "Overdue", value: summary.overdue, route: "/order?filter=overdue", highlight: true },
    { label: "Upcoming", value: summary.upcoming, route: "/order?filter=upcoming" },
    { label: "Pending", value: summary.pending, route: "/order?status=PENDING" }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(card => (
        <button
          key={card.label}
          onClick={() => navigate(card.route)}
          className={`rounded-lg p-4 text-left shadow-sm border transition-transform hover:scale-[1.02]
            ${card.highlight ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
        >
          <div className="text-sm text-gray-500">{card.label}</div>
          <div className="text-2xl font-semibold mt-1">{card.value}</div>
        </button>
      ))}
    </div>
  );
};

export default SummaryCards;