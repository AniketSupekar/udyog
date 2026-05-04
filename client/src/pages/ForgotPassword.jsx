// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.875rem", color: "var(--color-accent)", textDecoration: "none", marginBottom: 32, fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        {sent ? (
          <div style={{ textAlign: "center", background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "40px 24px" }}>
            <div style={{ width: 56, height: 56, background: "#F0FDF4", border: "2px solid #BBF7D0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckCircle size={26} color="var(--color-accent)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Check your email</h2>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: 8 }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>
              Forgot password?
            </h1>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: 28 }}>
              Enter your email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "28px 24px", boxShadow: "var(--shadow-sm)" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={{ marginBottom: 16 }}
              />
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}