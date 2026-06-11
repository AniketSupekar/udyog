import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, verifyEmail, resendOTP } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({ businessName: "", name: "", email: "", password: "" });

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
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

  if (step === 2) return <VerifyOTPStep email={registeredEmail} onBack={() => setStep(1)} />;

  const fields = [
    { id: "businessName", label: "Business name", placeholder: "e.g. Green Valley Nursery", type: "text", autoComplete: "organization" },
    { id: "name",         label: "Your name",      placeholder: "John Doe",                  type: "text", autoComplete: "name" },
    { id: "email",        label: "Email",           placeholder: "you@example.com",           type: "email", autoComplete: "email" },
  ];

  return (
    <div className="auth-screen">
      <div className="auth-card animate-in">
        <h1 className="auth-heading" style={{ textAlign: "center" }}>Create account</h1>
        <p className="auth-sub" style={{ textAlign: "center" }}>Start managing your business in minutes</p>

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <div className="auth-field" key={f.id}>
              <label className="auth-label" htmlFor={f.id}>{f.label}</label>
              <input
                id={f.id}
                className="input"
                type={f.type}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                value={form[f.id]}
                onChange={e => update(f.id, e.target.value)}
                required
                autoFocus={f.id === "businessName"}
              />
            </div>
          ))}

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer",
                  color: "var(--color-text-placeholder)",
                  display: "flex", alignItems: "center", padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Legal consent — required before account creation */}
          <p style={{
            fontSize: "12px",
            color: "var(--color-text-tertiary)",
            lineHeight: "1.6",
            margin: "12px 0 4px",
            textAlign: "center",
          }}>
            By creating an account you agree to our{" "}
            <Link
              to="/terms-of-service"
              target="_blank"
              style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy-policy"
              target="_blank"
              style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
            >
              Privacy Policy
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 10 }}
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function VerifyOTPStep({ email, onBack }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveToken, setUser } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputs.current[5]?.focus();
    }
  };

  const code = otp.join("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await verifyEmail({ email, otp: code });
      const { token, ...userData } = res.data.data;
      saveToken(token);
      setUser(userData);
      toast.success("Welcome to Udyog! 🎉");
      navigate(userData.onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOTP({ email });
      toast.success("New code sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card animate-in">
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--color-text-tertiary)", fontSize: "0.8125rem",
            padding: 0, marginBottom: 24, fontFamily: "var(--font-sans)",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{
          width: 44, height: 44,
          background: "var(--color-accent-light)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-accent)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h1 className="auth-heading" style={{ textAlign: "center" }}>Check your email</h1>
        <p className="auth-sub" style={{ marginBottom: 20 }}>
          We sent a 6-digit code to{" "}
          <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{email}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <div className="otp-grid" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? "Verifying…" : "Verify email →"}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 16 }}>
          Didn't get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-accent)", fontWeight: 500,
              fontSize: "0.8rem", fontFamily: "var(--font-sans)", padding: 0,
            }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}