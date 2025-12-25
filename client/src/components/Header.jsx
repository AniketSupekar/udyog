import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-gray-800">
        Nursery Orders
      </h1>

      <Link
        to="/create"
        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
      >
        + Create Order
      </Link>
    </div>
  );
}