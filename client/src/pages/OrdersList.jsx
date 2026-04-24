// src/pages/OrdersList.jsx
import { useEffect, useState, useRef } from "react";
import { fetchOrders } from "../services/order.api";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { Search, Plus, X, Filter } from "lucide-react";
import { formatDate } from "../utils/date.util";
import { formatCurrency } from "../utils/currency.util";

export default function OrdersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const status = searchParams.get("status") || "";
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const isDashboardView = Boolean(filter || status);

  const contextTitle = filter === "overdue" ? "Overdue Orders"
    : filter === "due-today" ? "Due Today"
    : filter === "upcoming" ? "Upcoming Orders"
    : status ? `${status.charAt(0)}${status.slice(1).toLowerCase()} Orders`
    : null;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      page === 1 ? setInitialLoading(true) : setFetching(true);
      try {
        const res = await fetchOrders({ page, limit: 10, search: debouncedSearch, status, filter });
        // API returns { success, data: [], pagination: {} }
        setOrders(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
        setFetching(false);
      }
    };
    load();
  }, [debouncedSearch, status, filter, page]);

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="space-y-1">
          {isDashboardView && (
            <button onClick={() => navigate(-1)} className="text-sm text-green-600 hover:underline">
              ← Back to Dashboard
            </button>
          )}
          <h2 className="text-2xl font-semibold text-gray-900">
            {contextTitle || "Orders"}
          </h2>
          <p className="text-sm text-gray-500">
            {contextTitle ? "Filtered orders from dashboard" : "Search and manage all orders"}
          </p>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 w-12 rounded-xl border flex items-center justify-center transition ${showFilters ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-200 text-green-600"}`}
          >
            <Filter size={18} />
          </button>
          {!isDashboardView && (
            <Link
              to="/orders/create"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              <Plus size={16} /> Create Order
            </Link>
          )}
        </div>

        {/* FILTER PANEL */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
            <div className="flex flex-wrap gap-2">
              {["", "CREATED", "PENDING", "DELIVERED", "CANCELLED"].map((s) => (
                <button
                  key={s || "ALL"}
                  onClick={() => {
                    setPage(1);
                    const params = Object.fromEntries(searchParams.entries());
                    if (s) params.status = s; else delete params.status;
                    setSearchParams(params);
                    setShowFilters(false);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition ${status === s || (!s && !status) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT */}
        {initialLoading ? (
          <div className="py-16 text-center text-gray-500">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No orders found.</div>
        ) : (
          <>
            {fetching && <p className="text-xs text-center text-gray-400">Updating results…</p>}

            {/* MOBILE LIST */}
            <div className="space-y-3 md:hidden">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-4 transition hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900">
                      {order.clientSnapshot?.name}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="h-px bg-gray-100 my-3" />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Delivery</p>
                      <p className="text-sm font-medium text-gray-800">{formatDate(order.deliveryDate)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Total</p>
                      <p className="text-sm font-medium text-gray-800">{formatCurrency(order.financial?.total)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Remaining</p>
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(order.payment?.remainingAmount)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left">Customer</th>
                    <th className="px-6 py-4 text-left">Delivery Date</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-right">Remaining</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">{order.clientSnapshot?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(order.deliveryDate)}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(order.financial?.total)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">{formatCurrency(order.payment?.remainingAmount)}</td>
                      <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-4 text-center">
                        <Link to={`/orders/${order._id}`} className="text-green-600 font-medium hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-4 pt-6">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-lg border disabled:opacity-50">Prev</button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-lg border disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {!isDashboardView && (
        <Link to="/orders/create" className="fixed bottom-20 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg md:hidden">
          <Plus size={24} />
        </Link>
      )}
    </div>
  );
}