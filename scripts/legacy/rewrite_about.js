const fs = require('fs');
const path = require('path');

const aboutPage = `"use client";
import { useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import PageWrapper from "../components/PageWrapper";

const modules = [
  { icon: "CRM", color: "#3B82F6", title: "CRM & Sales", desc: "Contacts, lead pipeline, AI deal scoring, follow-up alerts, and win probability. Close more deals with full visibility." },
  { icon: "FIN", color: "#10B981", title: "Finance", desc: "GST-compliant invoicing, expenses, Razorpay payments, P&L reports. Your money, fully visible." },
  { icon: "INV", color: "#F59E0B", title: "Inventory", desc: "SKU tracking, low-stock alerts, stock valuation. Never run out without warning." },
  { icon: "HR", color: "#EF4444", title: "HR & Payroll", desc: "Employee profiles, leave approvals, monthly pay runs and payslips. All in one place." },
  { icon: "AI", color: "#6366F1", title: "AI Assistant", desc: "Ask anything about your business in plain English. Powered by Google Gemini 2.5 Flash." },
  { icon: "DATA", color: "#8B5CF6", title: "Pipeline Analytics", desc: "Conversion funnel, monthly trends, weighted revenue forecast. Data-driven decisions, not gut feel." },
  { icon: "RPT", color: "#EC4899", title: "Reports & Export", desc: "PDF invoices, CSV exports, monthly P&L summary. Your data, always yours." },
  { icon: "TEAM", color: "#14B8A6", title: "Team Management", desc: "Role-based access, email invite flow, audit trail. Bring your team in securely." },
];

const values = [
  { icon: "🎯", color: "#6366F1", title: "Built for SMEs, not enterprises", desc: "Every feature, every pricing decision, every UX choice — made with a 10–50 person Indian business in mind." },
  { icon: "💡", color: "#3B82F6", title: "Honest over hyped", desc: "We show you real data about your business. No inflated numbers, no promises we can't keep." },
  { icon: "🔒", color: "#10B981", title: "Your data, always yours", desc: "Export everything anytime. AES-256 encrypted at rest and in transit. We never sell your data." },
  { icon: "⚡", color: "#F59E0B", title: "Live the same day", desc: "No implementation consultants. No months of setup. Sign up, import, run." },
];

const comparison = [
  { feature: "Time to go live", emborg: "Same day", enterprise: "Weeks to months" },
  { feature: "All modules included", emborg: "Yes — every plan", enterprise: "Separate licenses" },
  { feature: "Built-in AI assistant", emborg: "Included", enterprise: "Paid add-on" },
  { feature: "Pricing model", emborg: "Flat & transparent", enterprise: "Per-user, per-module" },
  { feature: "Indian compliance (GST/TDS)", emborg: "Built in", enterprise: "Requires configuration" },
  { feature: "Implementation partner needed", emborg: "Not required", enterprise: "Often mandatory" },
];

const stack = [
  { name: "Next.js 16", desc: "Frontend" },
  { name: "Supabase", desc: "Database & Auth" },
  { name: "AWS", desc: "Cloud hosting" },
  { name: "Razorpay", desc: "Payments" },
  { name: "Gemini 2.5", desc: "AI assistant" },
  { name: "Resend", desc: "Email delivery" },
];

export default function AboutPage() {
  useScrollReveal();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredVal, setHoveredVal] = useState<number | null>(null);

  return (
    <PageWrapper>
      <main>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="hero-glow" style={{ padding: "100px 40px 60px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ maxWidth: "780px" }} className="fade-up">
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>About EMBORG</p>
            <h1 className="tight" style={{ fontSize: "52px", fontWeight: 800, color: "var(--ink)", lineHeight: 1.05, margin: "0 0 24px 0" }}>
              Built for businesses that are done stitching tools together.
            </h1>
            <p style={{ fontSize: "19px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "600px", margin: "0 0 36px 0" }}>
              EMBORG is a cloud ERP platform that gives every small and mid-sized business in India the operational power of a large enterprise — without the enterprise price tag, the consultants, or the six-month setup.
            </p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <a href="/auth/signup" className="btn-primary" style={{ padding: "13px 26px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Start free trial</a>
              <a href="/contact" className="btn-secondary" style={{ padding: "13px 26px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Book a demo</a>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────── */}
        <section style={{ padding: "48px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "32px", textAlign: "center" }} className="fade-up">
            {[
              { num: "8", label: "ERP modules included" },
              { num: "14 days", label: "Free trial, no card" },
              { num: "99.5%", label: "Uptime target" },
              { num: "< 1 hr", label: "Average setup time" },
              { num: "24h", label: "Support response" },
              { num: "₹0", label: "Implementation cost" },
            ].map((s, i) => (
              <div key={i}>
                <div className="tight" style={{ fontSize: "34px", fontWeight: 800, color: "var(--accent)" }}>{s.num}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE PROBLEM ──────────────────────────────────── */}
        <section style={{ padding: "80px 40px", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }} className="fade-up">
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>The Problem</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: "0 0 20px 0", lineHeight: 1.15 }}>73% of Indian SMEs run on disconnected tools.</h2>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                WhatsApp for customer conversations. Excel for inventory. Tally for invoices. A separate app for HR. Nothing talks to each other — and someone spends hours every week reconciling it all.
              </p>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                Enterprise ERP exists — but SAP and Oracle cost ₹25 lakhs to several crores to implement, take months, and need a full IT team. For the vast majority of Indian businesses, that has never been realistic.
              </p>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7 }}>
                EMBORG was built to close that gap — giving SMEs the same operational power, at a price and complexity level that actually makes sense.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { label: "Hours/day lost to data re-entry", value: "2.5 hrs", color: "#EF4444" },
                { label: "Invoice error rate (manual entry)", value: "1–3%", color: "#F59E0B" },
                { label: "Avg implementation cost — enterprise ERP", value: "₹25L+", color: "#EF4444" },
                { label: "Avg setup time with EMBORG", value: "< 1 hr", color: "#10B981" },
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" }}>
                  <div className="tight" style={{ fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px", lineHeight: 1.4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDER STORY ────────────────────────────────── */}
        <section style={{ padding: "80px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "60px", alignItems: "start" }} className="fade-up">
            <div>
              <div style={{ backgroundColor: "var(--bg)", borderRadius: "20px", padding: "32px 24px", border: "1px solid var(--line)", textAlign: "center" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>👨‍💻</div>
                <div className="tight" style={{ fontWeight: 700, fontSize: "17px", color: "var(--ink)" }}>Danish Quazi</div>
                <div style={{ fontSize: "13px", color: "var(--accent)", marginTop: "4px", fontWeight: 600 }}>Founder, EMBORG ERP</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "12px", lineHeight: 1.5 }}>Senior Platform Engineer<br />AWS Certified · 7+ years in cloud infrastructure</div>
                <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                  {["AWS", "Terraform", "Next.js", "Supabase"].map(tag => (
                    <span key={tag} style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", backgroundColor: "var(--accent)" + "15", color: "var(--accent)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>Our Story</p>
              <h2 className="tight" style={{ fontSize: "32px", fontWeight: 800, color: "var(--ink)", margin: "0 0 20px 0", lineHeight: 1.2 }}>Why we built this.</h2>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                I'm a Senior DevOps and Platform Engineer with 7+ years building cloud infrastructure for global companies — real-time data pipelines, AI/ML platforms, large-scale AWS deployments. I've seen how large organisations operate when everything is connected.
              </p>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, margin: "0 0 16px 0" }}>
                And I kept noticing the gap. Small businesses around me — family businesses, startups, growing agencies — were running on WhatsApp threads and spreadsheets. The tools existed to do better. They just weren't accessible.
              </p>
              <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, margin: "0 0 28px 0" }}>
                So I built EMBORG: a platform that brings the operational power of enterprise software to the businesses that need it most, at a price and complexity level that actually makes sense for them.
              </p>
              <a href="/contact" style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Talk to the founder →</a>
            </div>
          </div>
        </section>

        {/* ── 8 MODULES ────────────────────────────────────── */}
        <section style={{ padding: "80px 40px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "52px" }} className="fade-up">
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>The Platform</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.1 }}>Everything your business needs. One platform.</h2>
              <p style={{ fontSize: "17px", color: "var(--muted)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>8 fully integrated modules — no add-ons, no extra licenses, included in every plan.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {modules.map((m, i) => (
                <div
                  key={i}
                  className="fade-up card-interactive"
                  style={{ backgroundColor: "var(--bg)", borderRadius: "14px", padding: "24px", border: hoveredCard === i ? \`2px solid \${m.color}\` : "1px solid var(--line)", cursor: "default", transition: "box-shadow 0.2s, border 0.15s" }}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: m.color + "20", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: m.color, letterSpacing: "0.04em" }}>{m.icon}</span>
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>{m.title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ─────────────────────────────── */}
        <section style={{ padding: "80px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }} className="fade-up">
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>How We Compare</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0" }}>Enterprise power. SME simplicity.</h2>
              <p style={{ fontSize: "17px", color: "var(--muted)", margin: 0 }}>Everything a large company has. None of what makes it painful.</p>
            </div>
            <div style={{ backgroundColor: "var(--bg)", borderRadius: "16px", border: "1px solid var(--line)", overflow: "hidden" }} className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", borderBottom: "2px solid var(--line)", padding: "16px 24px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Feature</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent)", textAlign: "center" }}>EMBORG</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textAlign: "center" }}>Enterprise ERP</div>
              </div>
              {comparison.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "16px 24px", borderBottom: i < comparison.length - 1 ? "1px solid var(--line)" : "none", backgroundColor: i % 2 === 0 ? "transparent" : "var(--bg-alt)" }}>
                  <div style={{ fontSize: "14px", color: "var(--ink)", fontWeight: 500 }}>{row.feature}</div>
                  <div style={{ fontSize: "14px", color: "#16A34A", fontWeight: 700, textAlign: "center" }}>✓ {row.emborg}</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>{row.enterprise}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES ───────────────────────────────────────── */}
        <section style={{ padding: "80px 40px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "52px" }} className="fade-up">
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>What We Believe</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>Our principles.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {values.map((v, i) => (
                <div
                  key={i}
                  className="fade-up card-interactive"
                  style={{ backgroundColor: "var(--bg)", borderRadius: "14px", padding: "28px", border: "1px solid var(--line)", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: v.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>{v.icon}</div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>{v.title}</h3>
                  <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ─────────────────────────────────── */}
        <section style={{ padding: "80px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "52px" }} className="fade-up">
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>Who It's For</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Built for the right businesses.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="fade-up">
              <div style={{ backgroundColor: "var(--bg)", borderRadius: "16px", padding: "32px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#16A34A", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✅</span> Great fit
                </div>
                {[
                  "Trading companies managing suppliers, inventory & invoicing",
                  "Service businesses — agencies, consultants, freelancers with a team",
                  "Manufacturing SMEs managing raw materials and B2B sales",
                  "Retail businesses tracking inventory and finances",
                  "Staffing and HR firms managing employees or contractors",
                  "Early-stage startups building the right foundation from day one",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                    <span style={{ color: "#16A34A", flexShrink: 0, marginTop: "2px" }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: "var(--bg)", borderRadius: "16px", padding: "32px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#DC2626", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>❌</span> Not the right fit
                </div>
                {[
                  "Large enterprises with complex multi-entity accounting",
                  "Businesses needing deep ERP customisation or bespoke workflows",
                  "Companies with 200+ users needing enterprise SLA",
                  "Organisations that require on-premise hosting",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                    <span style={{ color: "#DC2626", flexShrink: 0, marginTop: "2px" }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "20px", fontStyle: "italic", lineHeight: 1.5 }}>If that's you — SAP or Oracle is the right answer. We'll be honest about that rather than oversell you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TECH STACK ───────────────────────────────────── */}
        <section style={{ padding: "80px 40px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }} className="fade-up">
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>Infrastructure</p>
              <h2 className="tight" style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0" }}>Built on production-grade infrastructure.</h2>
              <p style={{ fontSize: "17px", color: "var(--muted)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>Built by a cloud infrastructure engineer using the same stack and standards as large-scale enterprise systems.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }} className="fade-up">
              {stack.map((t, i) => (
                <div key={i} style={{ backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)", textAlign: "center" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <section style={{ padding: "80px 40px", textAlign: "center" }} className="fade-up">
          <div style={{ maxWidth: "680px", margin: "0 auto", backgroundColor: "var(--bg-alt)", borderRadius: "24px", padding: "60px 48px", border: "1px solid var(--line)" }}>
            <h2 className="tight" style={{ fontSize: "34px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.15 }}>Ready to run your business properly?</h2>
            <p style={{ fontSize: "17px", color: "var(--muted)", margin: "0 0 36px 0", lineHeight: 1.6 }}>Start your free 14-day trial. No credit card. No setup fees. Live in under an hour.</p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/auth/signup" className="btn-primary" style={{ padding: "13px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Start free trial</a>
              <a href="/contact" className="btn-secondary" style={{ padding: "13px 28px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Book a demo</a>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "16px" }}>Cancel anytime · 7-day money-back guarantee · Built in India 🇮🇳</p>
          </div>
        </section>

      </main>
    </PageWrapper>
  );
}
`;

const aboutPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'about', 'page.tsx');
fs.mkdirSync(path.dirname(aboutPath), { recursive: true });
fs.writeFileSync(aboutPath, aboutPage, { encoding: 'utf8' });
console.log('✅ app/about/page.tsx rewritten — matches homepage style exactly');
console.log('\nRun: npm run build');
