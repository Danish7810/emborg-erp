const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, { encoding: 'utf8' });
  console.log('✅ Written:', relPath);
}

// ═══════════════════════════════════════════════════════════════════
// 1. ABOUT PAGE — app/about/page.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/about/page.tsx', `"use client";
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
`);

// ═══════════════════════════════════════════════════════════════════
// 2. BLOG INDEX — app/blog/page.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/blog/page.tsx', `import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | EMBORG ERP — ERP Insights for Indian SMEs",
  description: "Guides, tips, and insights on running your business better — CRM, invoicing, inventory, HR, and cloud ERP for Indian small businesses.",
  alternates: { canonical: "https://www.emborgerp.com/blog" },
  openGraph: {
    title: "EMBORG ERP Blog",
    description: "Guides on cloud ERP, CRM, invoicing, and business operations for Indian SMEs.",
    url: "https://www.emborgerp.com/blog",
    siteName: "EMBORG ERP",
    type: "website",
  },
};

const posts = [
  {
    slug: "why-indian-smes-are-switching-to-cloud-erp",
    title: "Why Indian SMEs Are Ditching Spreadsheets for Cloud ERP in 2025",
    excerpt: "Over 73% of Indian SMEs still manage operations across disconnected tools. Here's the real cost — and how to fix it.",
    date: "July 2025",
    readTime: "12 min read",
    tag: "ERP Guide",
    tagColor: "#4F46E5",
  },
];

export default function BlogPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      <section style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 16 }}>EMBORG Blog</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
            Guides, tips, and insights on running your business better — ERP, CRM, invoicing, and operations for Indian SMEs.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gap: 28 }}>
          {posts.map((post) => (
            <Link key={post.slug} href={\`/blog/\${post.slug}\`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "36px 40px", cursor: "pointer", transition: "box-shadow 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                  <span style={{ background: post.tagColor + "15", color: post.tagColor, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{post.tag}</span>
                  <span style={{ color: "#aaa", fontSize: 13 }}>{post.date} · {post.readTime}</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, lineHeight: 1.3, color: "#1a1a1a" }}>{post.title}</h2>
                <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{post.excerpt}</p>
                <span style={{ color: "#4F46E5", fontWeight: 600, fontSize: 14 }}>Read article →</span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 64, background: "#F8F7FF", borderRadius: 14, padding: "40px 36px", textAlign: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>More articles coming soon</h3>
          <p style={{ color: "#555", marginBottom: 24 }}>We write about ERP, CRM, invoicing, payroll, and running a better business. Subscribe to get notified.</p>
          <Link href="/contact" style={{ background: "#4F46E5", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 600, textDecoration: "none", fontSize: 15 }}>Get in touch</Link>
        </div>
      </section>
    </main>
  );
}
`);

// ═══════════════════════════════════════════════════════════════════
// 3. BLOG POST PAGE — app/blog/[slug]/page.tsx
// ═══════════════════════════════════════════════════════════════════
const blogPostDir = path.join(ROOT, 'app', 'blog');
// Write using Node script to avoid PowerShell bracket issues with [slug]
const slugDir = path.join(blogPostDir, '[slug]');
fs.mkdirSync(slugDir, { recursive: true });

const blogPostContent = `import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; date: string; readTime: string; tag: string; content: string }> = {
  "why-indian-smes-are-switching-to-cloud-erp": {
    title: "Why Indian SMEs Are Ditching Spreadsheets for Cloud ERP in 2025",
    date: "July 2025",
    readTime: "12 min read",
    tag: "ERP Guide",
    content: \`
## The problem most Indian SMEs won't admit

If you're running a small or mid-sized business in India right now, there's a good chance your "system" looks something like this:

- Customer contacts in a WhatsApp group or Excel sheet
- Invoices generated in Tally or a Word template
- Inventory tracked in another spreadsheet
- Payroll calculated manually every month
- HR records split across email threads and a folder on someone's desktop

Sound familiar? You're not alone. Over 73% of Indian SMEs with fewer than 200 employees still manage core business operations across disconnected tools — most of which don't talk to each other.

The result: hours lost every week reconciling data, invoices going out late, inventory mismatches, payroll errors, and a business owner who can't get a clear picture of how the company is actually doing.

This is exactly the problem that cloud ERP was built to solve. And in 2025, it's finally accessible to businesses of every size.

---

## What ERP actually means for a small business

ERP stands for **Enterprise Resource Planning**. The name sounds intimidating, but the concept is simple: it's a single software system that connects all the departments of your business — finance, sales, inventory, HR, payroll — so data flows between them automatically and everyone works from the same source of truth.

When a sale is made, the inventory updates. When an invoice is raised, it flows into your financial reports. When an employee joins, their payroll profile is created automatically. No re-entry. No reconciliation. No missed steps.

For large enterprises, ERP has been standard for 20+ years. But systems like SAP and Oracle cost anywhere from ₹25 lakhs to several crores to implement, require months of setup, and need dedicated IT staff. For Indian SMEs, that's never been realistic — until cloud ERP changed the equation.

---

## The real cost of disconnected tools

Most business owners underestimate what fragmented tools actually cost them.

**Time cost:** Employees at SMEs spend an average of 2.5 hours per day switching between apps and re-entering the same data in different places. For a 10-person team, that's over 3 full-time equivalents doing nothing but data shuffling.

**Error cost:** Manual data entry has an average error rate of 1–3% per entry. In a business processing 500 invoices a month, that's up to 15 incorrect invoices — leading to disputes, delayed payments, and damaged supplier relationships.

**Decision cost:** When your sales data is in one place, financial data in another, and inventory in a third, you can never get a real-time picture of your business. Decisions get made on stale information.

**Growth ceiling:** At some point, every business that stays on Excel hits a wall. The spreadsheet breaks. The WhatsApp group becomes unmanageable. The business stops growing because operations can't support growth.

---

## What to look for in a cloud ERP for Indian businesses

Not all ERP systems are built the same. Here's what actually matters for an SME:

### All modules in one platform
The whole point of ERP is integration. A system that gives you CRM but charges separately for invoicing, and then again for payroll, is not an ERP — it's just another set of disconnected subscriptions.

### No implementation partner required
Traditional ERP vendors make most of their money on implementation consulting — the months-long engagement that often costs more than the software itself. For an SME, you need to sign up and be running in hours.

### Transparent, flat pricing
Per-user, per-module pricing models are designed for large organisations negotiating enterprise contracts. For an SME, you need to know exactly what you're paying every month.

### Built-in AI that's actually useful
Can you ask the system "which customers haven't paid in 60 days?" and get a real answer from your own data? That's the bar. Not a chatbot that gives generic advice.

### Indian compliance — GST, TDS, payroll
An ERP built for a US or European market won't handle GST invoicing correctly or generate payroll reports that match Indian statutory requirements.

---

## How EMBORG addresses each of these

EMBORG is a cloud ERP platform built specifically for Indian SMEs. Here's what each module does:

**CRM** — Contacts, leads pipeline, AI deal scoring, follow-up alerts, and win probability. Everything to convert more prospects into customers.

**Finance** — GST-compliant invoicing, expense tracking, Razorpay online payments, P&L reports, and cash flow visibility. Send payment reminders from within the platform.

**Inventory** — SKU tracking, low-stock alerts, stock valuation, and category-level movement analysis. Never run out of stock without warning again.

**HR** — Employee profiles, leave management with approvals, and full organisational visibility. No more leave records on spreadsheets.

**Payroll** — Monthly pay runs, automatic payslip generation, deductions, and payroll history. Accurate, auditable, and fast.

**Pipeline Analytics** — Conversion funnel, stage breakdown, monthly trends, and weighted revenue forecast. Data-driven decisions, not gut feel.

**AI Assistant** — Ask anything about your business in plain English. Powered by Google Gemini 2.5 Flash. Your data, instantly accessible.

**Team Management** — Role-based access (Admin/Member), email invite flow, and full audit trail. Bring your team in securely.

---

## Pricing — what does it actually cost?

EMBORG is built around simple, flat pricing. Every plan includes all 8 modules — there's no "CRM add-on" or "payroll upgrade."

All plans include a **14-day free trial with no credit card required.** If you're not satisfied within 7 days of your first payment, you get a full refund — no questions asked.

Visit [emborgerp.com/pricing](https://www.emborgerp.com/pricing) for current pricing details.

---

## Who EMBORG is built for

- Trading companies managing suppliers, inventory, and customer invoicing
- Service businesses — agencies, consultants, freelancers with a team
- Manufacturing SMEs managing raw materials and B2B sales
- Retail businesses tracking inventory and finances in one place
- Staffing and HR firms managing employees or contractors
- Early-stage startups building the right foundation from day one

---

## Common questions, answered honestly

**How long does it take to get started?**
Most businesses are fully set up in under an hour. Create your account, invite your team, import your contacts, and you're live.

**Is my data safe?**
EMBORG is hosted on Supabase (AWS ap-northeast-1), encrypted at rest with AES-256, and encrypted in transit with HTTPS. Compliant with India's Digital Personal Data Protection Act.

**Can I export my data if I want to leave?**
Yes, always. Export everything to CSV at any time from the Reports page. Your data belongs to you.

**Is there customer support?**
Email support at support@emborgerp.com. Response within 24 hours on business days. Founding customers get direct access to the product team.

---

## The bottom line

If you're still running your business on WhatsApp and Excel, you're not doing anything wrong — you're doing what works until it stops working. The question is whether you want to fix it before it breaks, or after.

Cloud ERP in 2025 is not a luxury. It's a practical tool for any business serious about growth — and it no longer requires a large IT budget or months of your time.

**Start your free 14-day trial at [emborgerp.com](https://www.emborgerp.com). No credit card. No setup fees. Your business, running smarter, starting today.**
\`,
  },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post Not Found | EMBORG ERP" };
  return {
    title: \`\${post.title} | EMBORG ERP Blog\`,
    description: post.content.slice(0, 160).replace(/[#*\\n]/g, " ").trim(),
    alternates: { canonical: \`https://www.emborgerp.com/blog/\${slug}\` },
    openGraph: { title: post.title, url: \`https://www.emborgerp.com/blog/\${slug}\`, siteName: "EMBORG ERP", type: "article" },
  };
}

function renderMarkdown(md: string) {
  const lines = md.split("\\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: 26, fontWeight: 700, marginTop: 48, marginBottom: 16, color: "#1a1a1a" }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} style={{ fontSize: 20, fontWeight: 700, marginTop: 32, marginBottom: 12, color: "#1a1a1a" }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={i} style={{ fontWeight: 700, marginBottom: 8, fontSize: 16, color: "#1a1a1a" }}>{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ")) {
      elements.push(<div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 16, color: "#333", lineHeight: 1.6 }}><span style={{ color: "#4F46E5", marginTop: 2 }}>•</span><span>{line.slice(2)}</span></div>);
    } else if (line === "---") {
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "40px 0" }} />);
    } else if (line.trim() !== "") {
      // Handle inline ** bold and links
      const formatted = line
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" style="color:#4F46E5;text-decoration:underline;">$1</a>');
      elements.push(<p key={i} style={{ fontSize: 16, color: "#333", lineHeight: 1.8, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: formatted }} />);
    }
    i++;
  }
  return elements;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", padding: "72px 24px 60px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link href="/blog" style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 20 }}>← Back to Blog</Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{post.tag}</span>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{post.date} · {post.readTime}</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 20 }}>{post.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>By EMBORG ERP Team</p>
        </div>
      </section>

      {/* Content */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        {renderMarkdown(post.content)}
      </section>

      {/* CTA */}
      <section style={{ background: "#F8F7FF", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 14 }}>Ready to try EMBORG?</h2>
          <p style={{ color: "#555", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>14-day free trial. All 8 modules. No credit card. Live in under an hour.</p>
          <Link href="/auth/signup" style={{ background: "#4F46E5", color: "#fff", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-block" }}>Start Free Trial →</Link>
        </div>
      </section>
    </main>
  );
}
`;

fs.writeFileSync(path.join(slugDir, 'page.tsx'), blogPostContent, { encoding: 'utf8' });
console.log('✅ Written: app/blog/[slug]/page.tsx');

// ═══════════════════════════════════════════════════════════════════
// 4. FIX FOOTER — update Blog + About dead links
// ═══════════════════════════════════════════════════════════════════
function findFilesContaining(dir, needle, results = []) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(f)) {
      findFilesContaining(fp, needle, results);
    } else if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.ts'))) {
      if (fs.readFileSync(fp, 'utf8').includes(needle)) results.push(fp);
    }
  }
  return results;
}

const layoutFiles = findFilesContaining(path.join(ROOT, 'app'), 'Careers');
let footerFixed = false;
for (const lf of layoutFiles) {
  let lc = fs.readFileSync(lf, 'utf8');
  const orig = lc;
  // Fix Blog link
  lc = lc.replace(/href=["']\/["']([^>]*)>Blog</g, 'href="/blog"$1>Blog<');
  lc = lc.replace(/href=\{["']\/["']\}([^>]*)>Blog</g, 'href="/blog"$1>Blog<');
  // Fix About link
  lc = lc.replace(/href=["']\/["']([^>]*)>About</g, 'href="/about"$1>About<');
  lc = lc.replace(/href=\{["']\/["']\}([^>]*)>About</g, 'href="/about"$1>About<');
  // Fix Careers → Terms
  lc = lc.replace(/href=["']\/["']([^>]*)>Careers</g, 'href="/terms"$1>Terms<');
  lc = lc.replace(/href=\{["']\/["']\}([^>]*)>Careers</g, 'href="/terms"$1>Terms<');

  if (lc !== orig) {
    fs.writeFileSync(lf, lc, 'utf8');
    console.log('✅ Footer links fixed in:', lf);
    footerFixed = true;
  }
}
if (!footerFixed) {
  console.log('⚠ Footer link patterns not auto-matched. Check app/layout.tsx manually for href="/" before About/Blog/Careers.');
}

console.log('\n════ ALL DONE ════');
console.log('Run: npm run build');
