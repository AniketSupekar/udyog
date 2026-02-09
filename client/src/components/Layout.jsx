import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="md:bg-white md:rounded-xl md:shadow-sm">
          <div className="p-0 md:p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
