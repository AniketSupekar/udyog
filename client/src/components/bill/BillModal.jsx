// src/components/bill/BillModal.jsx
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import BillPreview from "./BillPreview";
import { getBillUrl } from "../../utils/whatsapp.util";
import { MessageCircle, Printer, X } from "lucide-react";

export default function BillModal({ order, onClose, business }) {
  const billRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Invoice_${order.clientSnapshot?.name?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`,
  });

  const handleWhatsApp = () => {
    getBillUrl(order, business?.name || "My Business", business?.upiId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-start overflow-auto p-4 pb-24">
      <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl mt-4">

        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Bill Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Bill content */}
        <div className="p-4 overflow-auto max-h-[65vh]">
          <div ref={billRef}>
            <BillPreview order={order} business={business} />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t flex flex-wrap gap-3 justify-end bg-gray-50">
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <MessageCircle size={15} /> Send on WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Printer size={15} /> Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}