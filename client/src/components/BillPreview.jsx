const BillPreview = ({ order }) => {
  if (!order) return null;

  return (
    <div className="bg-white text-gray-800 max-w-[800px] mx-auto p-5 sm:p-8 rounded-md">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-8 sm:mb-10">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">
            Balaji Hightech Nursery
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Healthy plants for every Farm
          </p>
        </div>

        <div className="text-xs text-right space-y-1">
          <p>
            <span className="font-medium">Invoice No:</span>{" "}
            #{order._id.slice(-6)}
          </p>
          <p>
            <span className="font-medium">Invoice Date:</span>{" "}
            {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ================= FROM / TO (UPDATED ONLY) ================= */}
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-6 mb-10 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-500 mb-2">
            From
          </p>
          <p className="font-semibold">
            Balaji Hightech Nursery
          </p>
          <p className="text-gray-600 mt-1">
            📞 9876543210
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-500 mb-2">
            Bill To
          </p>
          <p className="font-semibold">
            {order.customer.name}
          </p>
          <p className="text-gray-600 mt-1">
            📞 {order.customer.phone}
          </p>
          <p className="text-gray-600 mt-1">
            📍 {order.customer.address}
          </p>
        </div>
      </div>

      {/* ================= ITEMS TABLE (UNCHANGED) ================= */}
      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-600">
            <th className="py-2 px-3 text-left font-medium">
              Description
            </th>
            <th className="py-2 px-3 text-center font-medium">
              Qty
            </th>
            <th className="py-2 px-3 text-right font-medium">
              Rate
            </th>
            <th className="py-2 px-3 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <td className="py-3 px-3">
              Plant Order
            </td>
            <td className="py-3 px-3 text-center">
              {order.quantity}
            </td>
            <td className="py-3 px-3 text-right">
              ₹{order.rate}
            </td>
            <td className="py-3 px-3 text-right font-medium">
              ₹{order.totalAmount}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ================= TOTALS (UNCHANGED) ================= */}
      <div className="flex justify-end mb-10">
        <div className="w-full sm:w-72 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Subtotal
            </span>
            <span>
              ₹{order.totalAmount}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">
              Advance Paid
            </span>
            <span>
              ₹{order.advancePaid}
            </span>
          </div>

          <div className="flex justify-between font-semibold text-base border-t pt-3 text-red-600">
            <span>Balance Due</span>
            <span>
              ₹{order.remainingAmount}
            </span>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>
          Thank you for choosing Balaji Hightech Nursery 🌱
        </p>
        <p className="mt-1">
          For queries, contact us at{" "}
          <span className="font-medium">
            9876543210
          </span>
        </p>
      </div>

    </div>
  );
};

export default BillPreview;
