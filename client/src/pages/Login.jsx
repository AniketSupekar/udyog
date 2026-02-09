import { useState } from "react";
import { login } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({ email, password });
      setUser(res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10 space-y-6"
      >
        {/* ===== Header ===== */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-gray-800">
            Admin Login
          </h2>
          <p className="text-sm text-gray-500">
            Login to access your admin dashboard
          </p>
        </div>

        {/* ===== Error ===== */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-center">
            {error}
          </div>
        )}

        {/* ===== Inputs ===== */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* ===== Action ===== */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* ===== Footer ===== */}
        <p className="text-xs text-center text-gray-400">
          Authorized personnel only
        </p>
      </form>
    </div>
  );
}
