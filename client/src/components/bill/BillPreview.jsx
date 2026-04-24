// src/components/BillPreview.jsx
import { formatDate } from "../../utils/date.util";
import { formatCurrency } from "../../utils/currency.util";

const BillPreview = ({ order, business }) => {
  if (!order) return null;

  const businessName = business?.name || "Your Business";
  const businessPhone = business?.phone || "";
  const businessAddress = business?.address || "";

  return (
    <div className="bg-white text-gray-800 max-w-[800px] mx-auto p-6 sm:p-10">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
          {businessAddress && <p className="text-xs text-gray-500 mt-1">{businessAddress}</p>}
          {businessPhone && <p className="text-xs text-gray-500">📞 {businessPhone}</p>}
        </div>
        <div className="text-xs text-right space-y-1 text-gray-500">
          <p><span className="font-medium text-gray-700">Invoice No:</span> #{order._id?.slice(-6)}</p>
          <p><span className="font-medium text-gray-700">Order Date:</span> {formatDate(order.orderDate)}</p>
          <p><span className="font-medium text-gray-700">Delivery Date:</span> {formatDate(order.deliveryDate)}</p>
        </div>
      </div>

      {/* ── FROM / TO ── */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-400 mb-2 font-semibold">From</p>
          <p className="font-semibold text-gray-900">{businessName}</p>
          {businessPhone && <p className="text-gray-600 mt-1">📞 {businessPhone}</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs uppercase text-gray-400 mb-2 font-semibold">Bill To</p>
          <p className="font-semibold text-gray-900">{order.clientSnapshot?.name}</p>
          <p className="text-gray-600 mt-1">📞 {order.clientSnapshot?.phone}</p>
          {order.clientSnapshot?.address && (
            <p className="text-gray-600 mt-1">📍 {order.clientSnapshot?.address}</p>
          )}
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-600">
            <th className="py-2.5 px-3 text-left font-medium">Item</th>
            <th className="py-2.5 px-3 text-center font-medium">Qty</th>
            <th className="py-2.5 px-3 text-right font-medium">Unit Price</th>
            <th className="py-2.5 px-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3 px-3 text-gray-900">{item.productName}</td>
              <td className="py-3 px-3 text-center text-gray-600">{item.quantity} {item.unit}</td>
              <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
              <td className="py-3 px-3 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALS ── */}
      <div className="flex justify-end mb-10">
        <div className="w-full sm:w-72 text-sm space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.financial?.subtotal)}</span>
          </div>
          {order.financial?.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(order.financial?.discountAmount)}</span>
            </div>
          )}
          {order.financial?.taxAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax ({order.financial?.taxRate}%)</span>
              <span>{formatCurrency(order.financial?.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base border-t pt-2 text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(order.financial?.total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Amount Paid</span>
            <span className="text-green-600">{formatCurrency(order.payment?.totalPaid)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-red-600 border-t pt-2">
            <span>Balance Due</span>
            <span>{formatCurrency(order.payment?.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="text-center text-xs text-gray-400 border-t pt-4">
        <p>Thank you for your business 🙏</p>
        {businessPhone && (
          <p className="mt-1">For queries: <span className="font-medium text-gray-600">{businessPhone}</span></p>
        )}
      </div>
    </div>
  );
};

export default BillPreview;