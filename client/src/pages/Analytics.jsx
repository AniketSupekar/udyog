import BusinessSnapshot from "../components/dashboard/BusinessSnapshot";
import { Info } from "lucide-react";

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your nursery’s performance and delivery trends
        </p>
      </div>

      {/* Snapshot */}
      <BusinessSnapshot />

      {/* Info / Tip */}
      <div className="rounded-2xl border bg-gray-50 p-5 ">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-green-600">
            <Info size={18} />
          </div>

          <div className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-800">About Analytics :</span>{" "}
            This snapshot shows delivered orders for the selected month. 
            <br />
            <br />
            - Use the dropdown to navigate between months and track your business performance over time.
          </div>
        </div>
      </div>
    </div>
  );
}
