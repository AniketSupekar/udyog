import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { ArrowLeft } from "lucide-react";

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
    <div className="auth-screen">
      <div className="auth-card animate-in">

        <Link
          to="/login"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--color-text-tertiary)", fontSize: "0.8125rem", textDecoration: "none", marginBottom: 24 }}
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        {sent ? (
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <div style={{ width: 44, height: 44, background: "var(--color-accent-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: 6 }}>
              Check your inbox
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
              If an account exists for <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{email}</strong>, a reset link is on its way.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-placeholder)", marginTop: 20 }}>
              Didn't get it?{" "}
              <button
                type="button"
                onClick={() => setSent(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent)", fontWeight: 500, fontSize: "0.75rem", fontFamily: "var(--font-sans)", padding: 0 }}
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <h1 className="auth-heading">Forgot password?</h1>
            <p className="auth-sub">Enter your email and we'll send a reset link.</p>

            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 6 }}>
                {loading ? "Sending…" : "Send reset link →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}