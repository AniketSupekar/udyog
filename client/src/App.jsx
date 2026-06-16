import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Storefront from "./pages/Storefront";
import StoreOrderConfirm from "./pages/StoreOrderConfirm";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import Dashboard from "./pages/Dashboard";
import OrdersList from "./pages/OrdersList";
import CreateOrder from "./pages/CreateOrder";
import OrderDetails from "./pages/OrderDetails";
import Outstanding from "./pages/Outstanding";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import Onboarding from "./pages/Onboarding";
import Expenses from "./pages/Expenses";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid var(--color-border)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/store/:slug" element={<Storefront />} />
        <Route path="/store/:slug/order/:orderId" element={<StoreOrderConfirm />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route path="/login"           element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register"        element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" replace />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="orders"        element={<OrdersList />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="orders/:id"    element={<OrderDetails />} />
          <Route path="outstanding"   element={<Outstanding />} />
          <Route path="clients"       element={<Clients />} />
          <Route path="clients/:id"   element={<ClientDetails />} />
          <Route path="analytics"     element={<Analytics />} />
          <Route path="settings"      element={<Settings />} />
          <Route path="products"      element={<Products />} />
          <Route path="expenses"      element={<Expenses />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;