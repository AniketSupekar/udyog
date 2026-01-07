import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OrdersList from "./pages/OrdersList";
import CreateOrder from "./pages/CreateOrder";
import OrderDetails from "./pages/OrderDetails";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  // Wait until auth check completes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          {/* Nested routes */}
          <Route index element={<OrdersList />} />
          <Route path="create" element={<CreateOrder />} />
          <Route path="order/:id" element={<OrderDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
