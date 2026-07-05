import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marketplace | EMBORG ERP — Templates & Integrations",
  description: "Industry templates and integration guides for EMBORG ERP. Connect with Zapier, n8n, Google Sheets, WhatsApp, and more.",
  alternates: { canonical: "https://www.emborgerp.com/marketplace" },
};

const templates = [
  { id: "retail", icon: "🛍️", name: "Retail & Trading", desc: "Pre-built inventory categories, expense tracking, and supplier CRM for shops and distributors.", color: "#3B82F6", tags: ["Inventory", "CRM", "Finance"] },
  { id: "manufacturing", icon: "🏭", name: "Manufacturing", desc: "Raw materials, finished goods, B2B pipeline, and workforce management for production units.", color: "#F59E0B", tags: ["Inventory", "HR", "Finance"] },
  { id: "services", icon: "💼", name: "Services & Agency", desc: "Project pipeline, client CRM, and expense tracking for agencies and consultancies.", color: "#8B5CF6", tags: ["CRM", "Finance", "HR"] },
  { id: "restaurant", icon: "🍽️", name: "Restaurant & F&B", desc: "Ingredient inventory, vendor management, catering leads, and staff payroll.", color: "#EF4444", tags: ["Inventory", "HR", "CRM"] },
];

const integrations = [
  {
    icon: "⚡",
    name: "Zapier",
    desc: "Connect EMBORG to 6,000+ apps. Auto-create contacts from form submissions, trigger emails when leads are won, sync invoices to accounting tools.",
    color: "#FF4A00",
    badge: "Popular",
    steps: [
      'Go to zapier.com → Create Zap → "Webhook by Zapier" as trigger',
      "Copy the Zapier webhook URL into EMBORG → Settings → API & Webhooks → Add Endpoint",
      "Select events like contact.created or invoice.paid",
      "Map fields in Zapier and connect to your destination app",
    ],
    docsUrl: "https://zapier.com/apps/webhook/integrations",
  },
  {
    icon: "🔄",
    name: "n8n",
    desc: "Open-source automation. Build powerful workflows that connect EMBORG to your internal tools, databases, and custom APIs.",
    color: "#EA4B71",
    badge: "Open Source",
    steps: [
      "In n8n, add a Webhook node and copy the URL",
      "In EMBORG → Settings → API & Webhooks, register that URL",
      "Choose which events to send (contact.created, invoice.paid, etc.)",
      "Build your workflow in n8n — filter, transform, and route data",
    ],
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
  },
  {
    icon: "📊",
    name: "Google Sheets",
    desc: "Export EMBORG data to Google Sheets automatically. Build live dashboards, share data with your accountant, or run custom reports.",
    color: "#34A853",
    badge: "No-code",
    steps: [
      "Use Zapier or n8n to connect EMBORG webhooks to Google Sheets",
      "Or use the EMBORG Public API with Google Apps Script:",
      'In Google Sheets → Extensions → Apps Script → paste: fetch("https://www.emborgerp.com/api/v1/contacts", {headers: {Authorization: "Bearer emb_live_..."}}).then(r => r.json())',
      "Schedule the script to run daily for automatic data sync",
    ],
    docsUrl: "https://developers.google.com/apps-script",
  },
  {
    icon: "💬",
    name: "WhatsApp Business",
    desc: "Send invoice reminders, low stock alerts, and lead updates directly to WhatsApp. Works via Zapier + WhatsApp Business API.",
    color: "#25D366",
    badge: "Via Zapier",
    steps: [
      "Connect EMBORG to Zapier (see Zapier guide above)",
      "Add 'WhatsApp Business' as the Zapier action",
      "Trigger on invoice.overdue to auto-send payment reminders",
      "Trigger on inventory.low_stock to alert your purchase manager",
    ],
    docsUrl: "https://zapier.com/apps/whatsapp-business/integrations",
  },
  {
    icon: "📒",
    name: "Tally / Tally Prime",
    desc: "Export EMBORG invoices and expenses to Tally-compatible formats for your CA. Use the CSV export from Reports or the Public API.",
    color: "#1E40AF",
    badge: "Via CSV",
    steps: [
      "In EMBORG → Finance → export invoices/expenses as CSV",
      "Import the CSV into Tally Prime using the standard import function",
      "Or use the Public API (GET /api/v1/invoices) to build a custom sync script",
      "Contact support@emborgerp.com for a custom Tally integration if needed",
    ],
    docsUrl: "https://tallysolutions.com",
  },
  {
    icon: "🔗",
    name: "Custom API",
    desc: "Build your own integration using the EMBORG Public API. Available for contacts, leads, invoices, expenses, inventory, and employees.",
    color: "#6366F1",
    badge: "Developer",
    steps: [
      "Go to Dashboard → Settings → API & Webhooks → create an API key",
      "Base URL: https://www.emborgerp.com/api/v1",
      "Example: GET /api/v1/contacts with Authorization: Bearer emb_live_...",
      "Register webhook endpoints to receive real-time event notifications",
    ],
    docsUrl: "/dashboard/settings/api",
  },
];

export default function MarketplacePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", color: "var(--ink)" }}>

      {/* Hero */}
      <section className="hero-glow" style={{ padding: "80px 40px 60px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ maxWidth: "700px" }} className="fade-up">
          <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>MARKETPLACE</p>
          <h1 className="tight" style={{ fontSize: "48px", fontWeight: 800, color: "var(--ink)", lineHeight: 1.05, margin: "0 0 20px 0" }}>Templates & Integrations</h1>
          <p style={{ fontSize: "18px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 32px 0" }}>Get set up faster with industry templates — or connect EMBORG to the tools your team already uses.</p>
          <Link href="/auth/signup" className="btn-primary" style={{ padding: "13px 26px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Start free — apply a template</Link>
        </div>
      </section>

      {/* Templates */}
      <section style={{ padding: "60px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ marginBottom: "40px" }} className="fade-up">
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 12px 0" }}>Industry Templates</p>
            <h2 className="tight" style={{ fontSize: "34px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Your industry, pre-configured.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {templates.map(t => (
              <div key={t.id} className="fade-up card-interactive" style={{ padding: "24px", backgroundColor: "var(--bg)", borderRadius: "14px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{t.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>{t.name}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0", lineHeight: 1.6 }}>{t.desc}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                  {t.tags.map(tag => <span key={tag} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: t.color + "15", color: t.color, fontWeight: 600 }}>{tag}</span>)}
                </div>
                <Link href="/auth/signup" style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>Use this template →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: "60px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "40px" }} className="fade-up">
          <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 12px 0" }}>Integrations</p>
          <h2 className="tight" style={{ fontSize: "34px", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Connect EMBORG to your stack.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {integrations.map((intg, i) => (
            <div key={i} className="fade-up" style={{ padding: "28px", backgroundColor: "var(--bg-alt)", borderRadius: "14px", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: intg.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{intg.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--ink)" }}>{intg.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", backgroundColor: intg.color + "20", color: intg.color }}>{intg.badge}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px 0", lineHeight: 1.6 }}>{intg.desc}</p>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>How to connect:</p>
                {intg.steps.map((step, si) => (
                  <div key={si} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                    <span style={{ color: intg.color, fontWeight: 700, flexShrink: 0 }}>{si + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <a href={intg.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>View docs →</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 40px", textAlign: "center", borderTop: "1px solid var(--line)" }} className="fade-up">
        <h2 className="tight" style={{ fontSize: "30px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>Need a custom integration?</h2>
        <p style={{ fontSize: "16px", color: "var(--muted)", margin: "0 0 28px 0" }}>The EMBORG Public API covers contacts, leads, invoices, expenses, inventory, and employees. Build anything.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard/settings/api" className="btn-primary" style={{ padding: "13px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>View API docs</Link>
          <Link href="/contact" className="btn-secondary" style={{ padding: "13px 28px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Contact us</Link>
        </div>
      </section>
    </main>
  );
}
