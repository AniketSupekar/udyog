import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", padding: "0 0 60px 0" }}>
      {/* Header */}
      <div style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid #E5E7EB",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <Link
          to="/register"
          style={{
            display: "flex", alignItems: "center",
            color: "var(--color-cta)", textDecoration: "none",
            padding: "4px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-cta)", margin: 0 }}>
          Privacy Policy
        </h1>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px" }}>
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>
          Last updated: June 2025
        </p>

        <Section title="1. Who We Are">
          Udyog is a business management platform designed for Indian small businesses.
          We help you manage orders, clients, products, payments, and billing.
          For privacy-related questions, contact us at legal@udyog.in.
        </Section>

        <Section title="2. What We Collect">
          <p>We collect the following information when you use Udyog:</p>
          <ul>
            <li><strong>Account information</strong> — your name, email address, and password (stored as a secure hash)</li>
            <li><strong>Business information</strong> — business name, phone number, address, GST number, UPI ID</li>
            <li><strong>Customer data</strong> — names, phone numbers, and addresses of your clients that you enter into the platform</li>
            <li><strong>Order and payment data</strong> — orders, payment amounts, payment methods, and transaction history you record</li>
            <li><strong>Product data</strong> — product names, prices, images, and inventory information you upload</li>
            <li><strong>Usage data</strong> — pages visited, features used, and device/browser information</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul>
            <li>To provide and operate the Udyog platform</li>
            <li>To send you account-related emails (OTP verification, password reset)</li>
            <li>To display your business storefront to your customers</li>
            <li>To generate bills, invoices, and WhatsApp messages on your behalf</li>
            <li>To improve the platform based on how it is used</li>
          </ul>
          <p>We do not sell your data or your customers' data to any third party.</p>
        </Section>

        <Section title="4. Your Customers' Data">
          When you use Udyog, you enter data about your own customers (names, phone numbers,
          order details). You are the data controller for that information. We process it only
          on your behalf to operate the platform. You are responsible for having a lawful basis
          to collect and store your customers' data under applicable law, including the Digital
          Personal Data Protection Act, 2023 (DPDP Act).
        </Section>

        <Section title="5. Data Storage and Security">
          Your data is stored on secure cloud servers. We use industry-standard measures
          including encrypted connections (HTTPS), hashed passwords, HTTP-only authentication
          cookies, and tenant isolation so no business can access another's data.
          Images are stored on Cloudinary. No payment card data is stored on our servers.
        </Section>

        <Section title="6. Third-Party Services">
          <p>Udyog uses the following third-party services to operate:</p>
          <ul>
            <li><strong>Cloudinary</strong> — image storage and delivery</li>
            <li><strong>Brevo (Sendinblue)</strong> — transactional email delivery</li>
            <li><strong>MongoDB Atlas</strong> — database hosting</li>
            <li><strong>Railway</strong> — backend infrastructure</li>
            <li><strong>Vercel</strong> — frontend hosting</li>
          </ul>
          <p>Each of these services has its own privacy policy governing their data handling.</p>
        </Section>

        <Section title="7. Data Retention">
          We retain your data for as long as your account is active. If you delete your
          account, all your business data — including orders, clients, products, and
          payment history — is permanently deleted from our systems. This deletion is
          irreversible.
        </Section>

        <Section title="8. Your Rights">
          <p>Under the DPDP Act 2023 and IT Act 2000, you have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p>
            To exercise any of these rights, use the account deletion feature in Settings
            or contact us at legal@udyog.in.
          </p>
        </Section>

        <Section title="9. Cookies">
          Udyog uses a single authentication cookie to keep you logged in. This cookie is
          HTTP-only and does not track you across other websites. We do not use advertising
          or analytics cookies.
        </Section>

        <Section title="10. Children's Privacy">
          Udyog is intended for use by business owners and is not directed at anyone under
          the age of 18. We do not knowingly collect data from minors.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy as the platform evolves. We will notify you
          of significant changes via email or an in-app notice. Continued use of Udyog
          after changes means you accept the updated policy.
        </Section>

        <Section title="12. Contact">
          For any privacy-related concerns, write to us at{" "}
          <a href="mailto:legal@udyog.in" style={{ color: "var(--color-accent)" }}>
            legal@udyog.in
          </a>
          . We will respond within 72 hours.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-cta)", marginBottom: "10px" }}>
        {title}
      </h2>
      <div style={{ fontSize: "14px", color: "#374151", lineHeight: "1.7" }}>
        {children}
      </div>
    </div>
  );
}