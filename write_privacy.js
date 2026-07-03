const fs = require('fs');
const path = require('path');

const privacyContent = `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | EMBORG ERP',
  description: 'EMBORG ERP Privacy Policy — how we collect, use, and protect your data.',
  robots: 'noindex',
}

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', fontFamily: 'sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>Last updated: July 1, 2025</p>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Who We Are</h2>
        <p>EMBORG ERP ("EMBORG", "we", "us") is a cloud-based ERP platform for small and mid-sized businesses, operated by Danish Quazi, Hyderabad, India. Contact: <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a></p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. Data We Collect</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Account data:</strong> email address, name, company name, password (hashed — we never see it)</li>
          <li><strong>Business data you enter:</strong> contacts, invoices, inventory, payroll, and other ERP records</li>
          <li><strong>Usage data:</strong> pages visited, features used, browser/device type, IP address</li>
          <li><strong>Payment data:</strong> processed by Razorpay — we store only order IDs and plan status, not card details</li>
        </ul>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. How We Use Your Data</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>To provide, operate, and improve the EMBORG platform</li>
          <li>To send transactional emails (invoices, reminders, team invitations)</li>
          <li>To process payments and manage subscriptions</li>
          <li>To respond to support requests</li>
          <li>To comply with applicable law</li>
        </ul>
        <p style={{ marginTop: 12 }}>We do <strong>not</strong> sell your data to third parties.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Data Storage & Security</h2>
        <p>Your data is stored on Supabase (hosted on AWS ap-northeast-1). We use HTTPS for all data in transit and AES-256 encryption at rest. Access is restricted to authenticated users only.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Data Retention</h2>
        <p>We retain your data for as long as your account is active. On account deletion, we will permanently delete your data within 30 days, except where retention is required by law.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Your Rights (DPDP Act, India)</h2>
        <p>Under India&apos;s Digital Personal Data Protection Act 2023, you have the right to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Erase your data ("right to be forgotten")</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p style={{ marginTop: 12 }}>To exercise any of these rights, email <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a>.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Cookies</h2>
        <p>We use essential cookies only — session tokens for authentication. We do not use advertising or tracking cookies.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>8. Third-Party Services</h2>
        <p>We use the following sub-processors: Supabase (database/auth), Razorpay (payments), Resend (transactional email), Vercel (hosting), Google (Gemini AI chat feature). Each has their own privacy policy.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>9. Changes to This Policy</h2>
        <p>We may update this policy. We will notify you of material changes by email or in-app notice. Continued use of EMBORG after the effective date constitutes acceptance.</p>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>10. Contact</h2>
        <p>Privacy questions: <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a></p>
      </section>
    </main>
  )
}
`;

const privacyDir = path.join('C:\\Users\\Danish\\emborg', 'app', 'privacy');
if (!fs.existsSync(privacyDir)) fs.mkdirSync(privacyDir, { recursive: true });
fs.writeFileSync(path.join(privacyDir, 'page.tsx'), privacyContent, { encoding: 'utf8' });
console.log('✅ Written: app/privacy/page.tsx');
