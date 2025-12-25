export default function StatusBadge({ status }) {
  const STATUS_MAP = {
    CREATED: {
      label: "Created",
      classes: "bg-blue-100 text-blue-700",
    },
    PENDING: {
      label: "Pending",
      classes: "bg-yellow-100 text-yellow-700",
    },
    DELIVERED: {
      label: "Delivered",
      classes: "bg-green-100 text-green-700",
    },
    CANCELLED: {
      label: "Cancelled",
      classes: "bg-red-100 text-red-700",
    },
  };

  const current = STATUS_MAP[status] || {
    label: status,
    classes: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${current.classes}`}
    >
      {current.label}
    </span>
  );
}