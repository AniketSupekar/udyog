import React, { useRef } from "react";
import BillPreview from "../BillPreview.jsx";
import { useReactToPrint } from "react-to-print";

export default function BillModal({ order, onClose }) {
  const billRef = useRef(null);

  if (!order) return null;

  const handlePrint = useReactToPrint({
  contentRef: billRef,

  documentTitle: (() => {
    const rawName = order.customer.name || "Customer";

    // Sanitize name → safe for filenames
    const safeName = rawName
      .trim()
      .replace(/\s+/g, "_")          // spaces → _
      .replace(/[^a-zA-Z0-9_]/g, ""); // remove special chars

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    return `Invoice_${safeName}_${today}`;
  })(),
});


  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center overflow-auto p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl overflow-hidden">

        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Bill Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div ref={billRef}>
            <BillPreview order={order} />
          </div>
        </div>

        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Download PDF
          </button>

          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
