import { Link } from "react-router-dom";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px" }}>
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>
          Last updated: June 2025
        </p>

        <Section title="1. Acceptance of Terms">
          By creating an account on Udyog, you agree to these Terms of Service.
          If you do not agree, do not use the platform. These terms form a binding
          agreement between you and Udyog.
        </Section>

        <Section title="2. What Udyog Provides">
          Udyog is a business management tool that lets you manage orders, clients,
          products, payments, and a public storefront. We provide the platform on an
          "as is" basis. Features may change, be added, or be removed over time.
        </Section>

        <Section title="3. Your Account">
          <ul>
            <li>You must provide accurate information when registering</li>
            <li>You are responsible for keeping your password secure</li>
            <li>You are responsible for all activity that occurs under your account</li>
            <li>One account corresponds to one business. Multi-business support is not currently available</li>
            <li>You must be at least 18 years old to create an account</li>
          </ul>
        </Section>

        <Section title="4. Your Data and Your Customers">
          You own all the data you enter into Udyog — your orders, clients, products,
          and payment records. By using Udyog, you grant us a limited license to store
          and process that data solely to operate the platform for you. You are
          responsible for ensuring you have the right to collect and store your
          customers' personal information under applicable Indian law, including the
          DPDP Act 2023.
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use Udyog to:</p>
          <ul>
            <li>Conduct any illegal business activity</li>
            <li>Enter false or misleading information</li>
            <li>Attempt to access another user's account or data</li>
            <li>Reverse engineer, scrape, or attack the platform</li>
            <li>Use the storefront feature to sell prohibited or illegal goods</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms
            without prior notice.
          </p>
        </Section>

        <Section title="6. Pricing and Payments">
          Udyog is currently free to use. We may introduce paid plans in the future.
          If we do, we will give you advance notice and you will not be charged without
          your explicit consent. Free features will remain available to existing users
          for a reasonable transition period.
        </Section>

        <Section title="7. Storefront">
          Your Udyog storefront is publicly accessible at your store URL. You are
          responsible for the products, prices, and information displayed on your
          storefront. Udyog is not responsible for disputes between you and your
          customers arising from storefront orders.
        </Section>

        <Section title="8. Uptime and Availability">
          We aim to keep Udyog available at all times but do not guarantee uninterrupted
          access. Maintenance, updates, or infrastructure issues may cause temporary
          downtime. We are not liable for any losses arising from platform unavailability.
        </Section>

        <Section title="9. Limitation of Liability">
          Udyog is not liable for any indirect, incidental, or consequential damages
          arising from your use of the platform, including loss of business data, revenue,
          or profits. Our total liability to you for any claim shall not exceed the amount
          you have paid us in the 3 months prior to the claim.
        </Section>

        <Section title="10. Account Deletion">
          You can delete your account at any time from Settings. Deletion permanently
          removes all your business data. This action is irreversible. We are not
          responsible for any loss of data following account deletion.
        </Section>

        <Section title="11. Governing Law">
          These terms are governed by the laws of India. Any disputes shall be subject
          to the exclusive jurisdiction of the courts in India.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these terms as the platform evolves. We will notify you of
          material changes via email. Continued use of Udyog after changes means
          you accept the updated terms.
        </Section>

        <Section title="13. Contact">
          For any questions about these terms, write to us at{" "}
          <a href="mailto:legal@udyog.in" style={{ color: "var(--color-accent)" }}>
            legal@udyog.in
          </a>
          .
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