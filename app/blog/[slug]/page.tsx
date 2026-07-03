import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; date: string; readTime: string; tag: string; content: string }> = {
  "why-indian-smes-are-switching-to-cloud-erp": {
    title: "Why Indian SMEs Are Ditching Spreadsheets for Cloud ERP in 2025",
    date: "July 2025",
    readTime: "12 min read",
    tag: "ERP Guide",
    content: `
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
`,
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
    title: `${post.title} | EMBORG ERP Blog`,
    description: post.content.slice(0, 160).replace(/[#*\n]/g, " ").trim(),
    alternates: { canonical: `https://www.emborgerp.com/blog/${slug}` },
    openGraph: { title: post.title, url: `https://www.emborgerp.com/blog/${slug}`, siteName: "EMBORG ERP", type: "article" },
  };
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
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
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#4F46E5;text-decoration:underline;">$1</a>');
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
