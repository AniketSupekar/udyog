import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="auth-card animate-in" style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, background: "var(--color-danger-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>Invalid link</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", marginBottom: 20 }}>This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Request a new link →
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card animate-in">

        {!done && (
          <Link
            to="/login"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--color-text-tertiary)", fontSize: "0.8125rem", textDecoration: "none", marginBottom: 24 }}
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
        )}

        {done ? (
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <div style={{ width: 44, height: 44, background: "var(--color-accent-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>
              Password updated
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)" }}>
              Redirecting you to login…
            </p>
          </div>
        ) : (
          <>
            <h1 className="auth-heading">Set new password</h1>
            <p className="auth-sub">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    className="input"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
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

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirm">Confirm password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="confirm"
                    className="input"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-placeholder)", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 6 }}>
                {loading ? "Saving…" : "Reset password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}