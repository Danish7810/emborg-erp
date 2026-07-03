"use client";
import Link from "next/link";

const modules = [
  { icon: "👥", name: "CRM", desc: "Contacts, leads pipeline, deal scoring, follow-up alerts, and win probability — everything to close more deals." },
  { icon: "💰", name: "Finance", desc: "GST-compliant invoicing, expense tracking, Razorpay payments, P&L reports, and cash flow visibility." },
  { icon: "📦", name: "Inventory", desc: "SKU tracking, low-stock alerts, stock valuation, and category-level movement analysis." },
  { icon: "👔", name: "HR", desc: "Employee profiles, leave management with approvals, and full organisational visibility." },
  { icon: "💵", name: "Payroll", desc: "Monthly pay runs, automatic payslip generation, deductions, and payroll history." },
  { icon: "📊", name: "Pipeline Analytics", desc: "Conversion funnel, stage breakdown, monthly trends, and weighted revenue forecast." },
  { icon: "🤖", name: "AI Assistant", desc: "Ask anything about your business in plain English. Powered by Google Gemini 2.5 Flash." },
  { icon: "👨‍👩‍👧", name: "Team Management", desc: "Role-based access (Admin/Member), email invite flow, and full audit trail." },
];

const values = [
  { icon: "🎯", title: "Built for SMEs, not enterprises", desc: "Every decision we make — pricing, features, UX — is made with a 10–50 person Indian business in mind. Not a Fortune 500." },
  { icon: "💡", title: "Honest over hyped", desc: "We show you real data about your business. We don't inflate numbers or make promises we can't keep." },
  { icon: "🔒", title: "Your data, always yours", desc: "Export everything, anytime. We encrypt all data at rest and in transit. We never sell your data." },
  { icon: "⚡", title: "Live the same day", desc: "No implementation consultants. No months of setup. Sign up, import your data, and you're running." },
];

const comparison = [
  ["Time to go live", "Same day", "Weeks to months"],
  ["All modules included", "Yes, every plan", "Separate licenses"],
  ["Built-in AI assistant", "Included", "Paid add-on"],
  ["Pricing model", "Flat & transparent", "Per-user, per-module"],
  ["Needs IT team", "No", "Usually"],
  ["Indian compliance (GST/TDS)", "Built in", "Requires config"],
  ["Implementation partner", "Not required", "Often mandatory"],
];

export default function AboutPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a", lineHeight: 1.7 }}>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: "0.05em" }}>ABOUT EMBORG</span>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.15 }}>
            Built for businesses that are done stitching tools together.
          </h1>
          <p style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", marginBottom: 40, lineHeight: 1.6 }}>
            EMBORG is a cloud ERP platform that gives every small and mid-sized business in India the operational power of a large enterprise — without the enterprise price tag, the implementation consultants, or the six-month setup.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/signup" style={{ background: "#fff", color: "#4F46E5", padding: "14px 28px", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>Start Free Trial</Link>
            <Link href="/contact" style={{ background: "transparent", color: "#fff", padding: "14px 28px", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "2px solid rgba(255,255,255,0.5)" }}>Book a Demo</Link>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: "80px 24px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, marginBottom: 24 }}>The problem we set out to fix</h2>
        <p style={{ fontSize: 17, marginBottom: 18, color: "#333" }}>
          Over 73% of Indian SMEs manage their core business operations across disconnected tools — WhatsApp, Excel, Tally, and a mix of SaaS apps that were never designed to work together. The result is hours lost every week reconciling data, invoices going out late, inventory mismatches, payroll errors, and business owners who can never get a clear picture of how their company is actually doing.
        </p>
        <p style={{ fontSize: 17, marginBottom: 18, color: "#333" }}>
          Enterprise ERP software exists — SAP, Oracle, Microsoft Dynamics. But these systems cost anywhere from ₹25 lakhs to several crores to implement, take months to go live, and need a dedicated IT team to maintain. For the vast majority of Indian businesses, that's never been an option.
        </p>
        <p style={{ fontSize: 17, color: "#333" }}>
          Cloud ERP changed the equation. And EMBORG was built to make that change real for businesses who've been left behind by software that was either too simple to be useful, or too complex to be practical.
        </p>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#F8F7FF", padding: "56px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center" }}>
          {[
            { num: "8", label: "ERP modules in one platform" },
            { num: "14 days", label: "Free trial, no card needed" },
            { num: "99.5%", label: "Uptime target" },
            { num: "< 1 hr", label: "Average setup time" },
            { num: "24h", label: "Support response time" },
            { num: "₹0", label: "Implementation cost" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#4F46E5" }}>{s.num}</div>
              <div style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUNDER STORY ── */}
      <section style={{ padding: "80px 24px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, marginBottom: 24 }}>Why we built this</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48, alignItems: "start" }}>
          <div style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍💻</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Danish Quazi</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Founder, EMBORG ERP</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Senior Platform Engineer · AWS Certified · 7+ years in cloud infrastructure</div>
          </div>
          <div>
            <p style={{ fontSize: 17, marginBottom: 18, color: "#333" }}>
              I'm a Senior DevOps and Platform Engineer with 7+ years of experience building cloud infrastructure for global companies — including real-time data pipelines, AI/ML platforms, and large-scale AWS deployments.
            </p>
            <p style={{ fontSize: 17, marginBottom: 18, color: "#333" }}>
              In that time, I kept noticing the same gap: large organisations had incredible operational systems. Their data was connected, their teams had visibility, their decisions were data-driven. Small businesses around me — family businesses, startups, growing agencies — were running on WhatsApp threads and spreadsheets.
            </p>
            <p style={{ fontSize: 17, marginBottom: 18, color: "#333" }}>
              The tools existed. They just weren't accessible — either too expensive, too complex, or not built for the Indian market. So I built EMBORG: a platform that brings the operational power of enterprise software to businesses that actually need it most.
            </p>
            <p style={{ fontSize: 17, color: "#333" }}>
              EMBORG is built by someone who understands cloud infrastructure at scale, who knows what "production-grade" actually means, and who also knows what it's like to build something from scratch with real constraints. That combination shapes every decision we make.
            </p>
          </div>
        </div>
      </section>

      {/* ── ALL 8 MODULES ── */}
      <section style={{ background: "#F8F7FF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, textAlign: "center", marginBottom: 12 }}>Everything your business needs. One platform.</h2>
          <p style={{ textAlign: "center", color: "#666", fontSize: 17, marginBottom: 52 }}>8 fully integrated modules — no add-ons, no extra licenses, included in every plan.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {modules.map((m, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{m.name}</div>
                <div style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, textAlign: "center", marginBottom: 12 }}>How EMBORG compares</h2>
        <p style={{ textAlign: "center", color: "#666", fontSize: 17, marginBottom: 48 }}>Enterprise power. SME simplicity. SME pricing.</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "14px 16px", fontWeight: 600, color: "#888" }}>Feature</th>
                <th style={{ textAlign: "center", padding: "14px 16px", color: "#4F46E5", fontWeight: 700, fontSize: 16 }}>EMBORG</th>
                <th style={{ textAlign: "center", padding: "14px 16px", color: "#888", fontWeight: 600 }}>Enterprise ERP suites</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 500 }}>{row[0]}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#16A34A", fontWeight: 600 }}>{row[1]}</td>
                  <td style={{ padding: "14px 16px", textAlign: "center", color: "#9ca3af" }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ background: "#F8F7FF", padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, textAlign: "center", marginBottom: 52 }}>What we believe</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
            {values.map((v, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{v.title}</div>
                <div style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section style={{ padding: "80px 24px", maxWidth: 860, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, marginBottom: 32 }}>Who EMBORG is built for</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#16A34A", marginBottom: 16 }}>✅ Great fit</h3>
            {[
              "Trading companies managing suppliers, inventory & invoicing",
              "Service businesses — agencies, consultants, freelancers with a team",
              "Manufacturing SMEs managing raw materials and B2B sales",
              "Retail businesses tracking inventory and finances",
              "Staffing and HR firms managing employees or contractors",
              "Early-stage startups building the right foundation from day one",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, fontSize: 15, color: "#333" }}>
                <span style={{ color: "#16A34A", marginTop: 2 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#DC2626", marginBottom: 16 }}>❌ Not the right fit</h3>
            {[
              "Large enterprises with complex multi-entity accounting",
              "Businesses needing deep ERP customisation or bespoke workflows",
              "Companies with 200+ users needing enterprise SLA and support",
              "Organisations that need on-premise hosting",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, fontSize: 15, color: "#666" }}>
                <span style={{ color: "#DC2626", marginTop: 2 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
            <p style={{ fontSize: 14, color: "#888", marginTop: 20, fontStyle: "italic" }}>
              If that's you — SAP or Oracle is the right answer. We'll be honest about that rather than oversell you.
            </p>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ background: "#1e1b4b", padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Built on production-grade infrastructure</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginBottom: 44, lineHeight: 1.6 }}>
            EMBORG is built by a cloud infrastructure engineer — using the same stack and standards used in large-scale enterprise systems.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, marginBottom: 48 }}>
            {[
              { name: "Next.js 16", desc: "Frontend" },
              { name: "Supabase", desc: "Database & Auth" },
              { name: "AWS", desc: "Cloud hosting" },
              { name: "Razorpay", desc: "Payments" },
              { name: "Gemini 2.5", desc: "AI assistant" },
              { name: "Resend", desc: "Email delivery" },
            ].map((t, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "16px 12px" }}>
                <div style={{ color: "#c7d2fe", fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>Privacy Policy</Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>Terms of Service</Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
            <Link href="/refund" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>Refund Policy</Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to run your business properly?</h2>
          <p style={{ fontSize: 18, color: "#555", marginBottom: 36, lineHeight: 1.6 }}>Start your free 14-day trial. No credit card. No setup fees. Be live in under an hour.</p>
          <Link href="/auth/signup" style={{ background: "#4F46E5", color: "#fff", padding: "16px 36px", borderRadius: 8, fontWeight: 700, fontSize: 17, textDecoration: "none", display: "inline-block" }}>Start Free — 14 Days</Link>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 16 }}>Cancel anytime · 7-day money-back guarantee</p>
        </div>
      </section>

    </main>
  );
}
