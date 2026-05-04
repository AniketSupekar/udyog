// src/pages/Onboarding.jsx
// 4-step onboarding after first registration
// Step 1: Business profile  Step 2: UPI ID  Step 3: Add Product  Step 4: Done

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateBusinessProfile } from "../services/business.api";
import { createProduct } from "../services/product.api";
import { completeOnboarding } from "../services/auth.api";
import { useToast } from "../context/ToastContext";
import { Building2, Smartphone, Package, CheckCircle, ArrowRight, Skip } from "lucide-react";

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Payment", icon: Smartphone },
  { id: 3, label: "Products", icon: Package },
  { id: 4, label: "Done",    icon: CheckCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [profile, setProfile] = useState({ phone: "", address: "" });
  const [upiId, setUpiId] = useState("");
  const [product, setProduct] = useState({ name: "", basePrice: "", unit: "piece" });

  const next = () => setStep((s) => s + 1);

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBusinessProfile({ phone: profile.phone, address: profile.address });
      next();
    } catch {
      toast.error("Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpi = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBusinessProfile({ upiId: upiId.trim() });
      next();
    } catch {
      toast.error("Failed to save UPI ID");
    } finally {
      setLoading(false);
    }
  };

  const handleProduct = async (e) => {
    e.preventDefault();
    if (!product.name.trim() || !product.basePrice) { next(); return; }
    setLoading(true);
    try {
      await createProduct({ name: product.name.trim(), basePrice: Number(product.basePrice), unit: product.unit });
      toast.success("Product added!");
      next();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          {STEPS.map((s) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: "50%",
                background: s.id < step ? "var(--color-accent)" : s.id === step ? "#F0FDF4" : "var(--color-bg)",
                border: `2px solid ${s.id <= step ? "var(--color-accent)" : "var(--color-border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                <s.icon size={16} color={s.id <= step ? (s.id < step ? "white" : "var(--color-accent)") : "var(--color-text-tertiary)"} />
              </div>
              <span style={{ fontSize: "0.625rem", fontWeight: 500, color: s.id === step ? "var(--color-accent)" : "var(--color-text-tertiary)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", padding: "32px 24px", boxShadow: "var(--shadow-sm)" }}>

          {step === 1 && (
            <>
              <StepHeader icon={Building2} title="Tell us about your business" subtitle="This appears on your invoices and bills" />
              <form onSubmit={handleProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="section-label">Phone Number</label>
                  <input className="input" placeholder="+91 98765 43210" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="section-label">Business Address</label>
                  <textarea className="input" rows={2} placeholder="Shop No. 5, MG Road, Pune" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={next}>Skip</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                    {loading ? "Saving…" : <><span>Continue</span><ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeader icon={Smartphone} title="Add UPI ID" subtitle="Customers can pay directly from WhatsApp messages" />
              <form onSubmit={handleUpi} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="section-label">Your UPI ID</label>
                  <input className="input" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} autoFocus />
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", marginTop: 6 }}>e.g. 9876543210@paytm, name@okicici</p>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={next}>Skip</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                    {loading ? "Saving…" : <><span>Continue</span><ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeader icon={Package} title="Add your first product" subtitle="Speed up order creation with saved products" />
              <form onSubmit={handleProduct} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="section-label">Product Name</label>
                  <input className="input" placeholder="e.g. Rose Plant, Soil Mix" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} autoFocus />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label className="section-label">Price (₹)</label>
                    <input className="input" type="number" min="0" placeholder="100" value={product.basePrice} onChange={(e) => setProduct({ ...product, basePrice: e.target.value })} />
                  </div>
                  <div>
                    <label className="section-label">Unit</label>
                    <select className="input" value={product.unit} onChange={(e) => setProduct({ ...product, unit: e.target.value })}>
                      {["piece","kg","liter","box","bundle"].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={next}>Skip</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                    {loading ? "Adding…" : <><span>Add Product</span><ArrowRight size={16} /></>}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, background: "#F0FDF4", border: "2px solid #BBF7D0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={30} color="var(--color-accent)" />
              </div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
                You're all set! 🎉
              </h2>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: 8, marginBottom: 28 }}>
                Your account is ready. Start creating orders and manage your business.
              </p>
              <button onClick={handleFinish} disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                {loading ? "Loading…" : "Go to Dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ width: 44, height: 44, background: "var(--color-accent-light)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon size={22} color="var(--color-accent)" />
      </div>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{subtitle}</p>
    </div>
  );
}