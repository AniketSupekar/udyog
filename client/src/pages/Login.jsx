import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { setUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      const user = res.data.data;
      setUser(user);
      navigate(user.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card animate-in">

        <h1 className="auth-heading" style={{ textAlign: "center" }}>Welcome back</h1>
        <p className="auth-sub" style={{ textAlign: "center" }}>Sign in to your workspace</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label className="auth-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="input"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-placeholder)", display: "flex", alignItems: "center", padding: 0 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 6 }}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="auth-footer">
          No account?{" "}
          <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}