export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {children}
      </div>
    </div>
  );
}