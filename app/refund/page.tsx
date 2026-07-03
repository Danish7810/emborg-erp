import type { Metadata } from 'next'

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
