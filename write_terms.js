const fs = require('fs');
const path = require('path');

const termsContent = `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | EMBORG ERP',
  description: 'EMBORG ERP Terms of Service — your agreement with us when using the platform.',
  robots: 'noindex',
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', fontFamily: 'sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>Last updated: July 1, 2025</p>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Acceptance</h2>
        <p>By creating an account or using EMBORG ERP ("Service"), you agree to these Terms. If you are using EMBORG on behalf of a company, you represent that you have authority to bind that company.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. The Service</h2>
        <p>EMBORG is a cloud ERP SaaS platform providing CRM, Finance, Inventory, HR, Payroll, and related business modules. We reserve the right to modify, suspend, or discontinue any feature with reasonable notice.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. Your Account</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You must provide accurate information at signup.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>Notify us immediately at <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a> of any unauthorized access.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Acceptable Use</h2>
        <p>You may not use EMBORG to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Violate any applicable law or regulation</li>
          <li>Store or transmit malicious code</li>
          <li>Reverse engineer, copy, or resell the Service</li>
          <li>Upload content that infringes third-party rights</li>
        </ul>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Subscriptions & Payment</h2>
        <p>Subscriptions are billed monthly or annually via Razorpay. Your subscription auto-renews unless cancelled before the renewal date. All prices are in INR and inclusive of applicable taxes. See our <a href="/refund" style={{ color: '#4F46E5' }}>Refund Policy</a> for cancellation terms.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Your Data</h2>
        <p>You retain full ownership of the data you enter into EMBORG. We do not claim any intellectual property rights over your business data. See our <a href="/privacy" style={{ color: '#4F46E5' }}>Privacy Policy</a> for details on how we handle it.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Availability & SLA</h2>
        <p>We target 99.5% monthly uptime. Planned maintenance will be announced in advance. We are not liable for downtime caused by third-party services (Supabase, Vercel, Razorpay).</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, EMBORG shall not be liable for indirect, incidental, special, or consequential damages. Our total liability to you shall not exceed the amount paid by you in the three months preceding the claim.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>9. Termination</h2>
        <p>You may cancel your account at any time from Settings. We may suspend or terminate accounts that violate these Terms. On termination, you may export your data within 30 days before it is deleted.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>10. Governing Law</h2>
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.</p>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>11. Contact</h2>
        <p><a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a></p>
      </section>
    </main>
  )
}
`;

const refundContent = `import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | EMBORG ERP',
  description: 'EMBORG ERP cancellation and refund policy.',
  robots: 'noindex',
}

export default function RefundPage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', fontFamily: 'sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Refund & Cancellation Policy</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>Last updated: July 1, 2025</p>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>14-Day Free Trial</h2>
        <p>All plans include a 14-day free trial. No credit card is required to start. You will not be charged until the trial ends and you choose to subscribe.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Cancellation</h2>
        <p>You may cancel your subscription at any time from your account Settings page. Cancellation takes effect at the end of the current billing period — you retain access until then.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Refunds</h2>
        <p>We offer a <strong>7-day refund window</strong> from the date of your first paid charge. If you are not satisfied, email <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a> within 7 days of payment and we will issue a full refund — no questions asked.</p>
        <p style={{ marginTop: 12 }}>After 7 days, charges are non-refundable as the subscription period has been in use. Partial-month refunds are not issued.</p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Exceptions</h2>
        <p>Refunds will be granted outside the 7-day window only in cases of duplicate charges or billing errors on our part. Contact us with your Razorpay order ID.</p>
      </section>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Contact</h2>
        <p>Email: <a href="mailto:support@emborgerp.com" style={{ color: '#4F46E5' }}>support@emborgerp.com</a><br/>
        Response time: within 24 hours on business days.</p>
      </section>
    </main>
  )
}
`;

const termsDir = path.join('C:\\Users\\Danish\\emborg', 'app', 'terms');
if (!fs.existsSync(termsDir)) fs.mkdirSync(termsDir, { recursive: true });
fs.writeFileSync(path.join(termsDir, 'page.tsx'), termsContent, { encoding: 'utf8' });
console.log('✅ Written: app/terms/page.tsx');

const refundDir = path.join('C:\\Users\\Danish\\emborg', 'app', 'refund');
if (!fs.existsSync(refundDir)) fs.mkdirSync(refundDir, { recursive: true });
fs.writeFileSync(path.join(refundDir, 'page.tsx'), refundContent, { encoding: 'utf8' });
console.log('✅ Written: app/refund/page.tsx');
