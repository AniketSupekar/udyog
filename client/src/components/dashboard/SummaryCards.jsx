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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(card => (
        <button
          key={card.label}
          onClick={() => navigate(card.route)}
          className={`
            rounded-xl p-4 text-left border bg-white
            transition active:scale-[0.98] md:hover:shadow-md
            ${card.highlight ? "border-red-200 bg-red-50/60" : "border-gray-200"}
          `}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {card.label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {card.value}
          </div>
        </button>
      ))}
    </div>
  );
};

export default SummaryCards;
