// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { Building2, User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1=form, 2=verify OTP
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    name: "",
    email: "",
    password: "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      setRegisteredEmail(form.email);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return <VerifyOTPStep email={registeredEmail} />;
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--color-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48,
            background: "var(--color-accent)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Building2 size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.03em" }}>
            Create your account
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: 6 }}>
            Start managing orders in minutes
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "28px 24px", boxShadow: "var(--shadow-sm)" }}>

          <Field label="Business Name" icon={Building2}>
            <input
              className="input"
              placeholder="e.g. Green Valley Nursery"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Your Name" icon={User}>
            <input
              className="input"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </Field>

          <Field label="Email Address" icon={Mail}>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </Field>

          <Field label="Password" icon={Lock}>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? "Creating account…" : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
        <Icon size={14} />
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── OTP Verification Step ────────────────────────────────────────────
function VerifyOTPStep({ email }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { verifyEmail } = await import("../services/auth.api");
      await verifyEmail({ email, otp });
      toast.success("Email verified! Welcome aboard 🎉");
      navigate("/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { resendOTP } = await import("../services/auth.api");
      await resendOTP({ email });
      toast.success("New code sent to your email");
    } catch {
      toast.error("Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "#F0FDF4", border: "2px solid #BBF7D0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Mail size={28} color="var(--color-accent)" />
        </div>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Check your email
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: 8, marginBottom: 32 }}>
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "28px 24px", boxShadow: "var(--shadow-sm)" }}>
          <input
            className="input"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            style={{ textAlign: "center", fontSize: "1.5rem", fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16 }}
          >
            {loading ? "Verifying…" : "Verify Email"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resending}
          style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 500 }}
        >
          {resending ? "Sending…" : "Didn't get it? Resend code"}
        </button>
      </div>
    </div>
  );
}