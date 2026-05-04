// src/pages/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-danger)", fontWeight: 600 }}>Invalid or expired reset link.</p>
          <Link to="/forgot-password" style={{ color: "var(--color-accent)", marginTop: 12, display: "block" }}>Request a new one</Link>
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
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {done ? (
          <div style={{ textAlign: "center", background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "40px 24px" }}>
            <div style={{ width: 56, height: 56, background: "#F0FDF4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={26} color="var(--color-accent)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Password reset!</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: 8 }}>Redirecting to login…</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>Set new password</h1>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: 28 }}>Choose a strong password for your account.</p>
            <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "28px 24px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Lock size={14} /> New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Confirm Password</label>
                <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                {loading ? "Saving…" : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}