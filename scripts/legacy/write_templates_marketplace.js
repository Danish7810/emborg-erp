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
// 1. INDUSTRY TEMPLATE DATA — app/lib/industryTemplates.ts
// ═══════════════════════════════════════════════════════════════════
write('app/lib/industryTemplates.ts', `export type IndustryTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  inventoryCategories: string[];
  expenseCategories: string[];
  leadStages: string[];
  sampleContacts: { full_name: string; company_name: string; email: string; phone: string }[];
  sampleLeads: { title: string; value: number; status: string }[];
  sampleInventory: { name: string; sku: string; category: string; quantity: number; price: number; low_stock_alert: number; unit: string }[];
  tips: string[];
};

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "retail",
    name: "Retail & Trading",
    icon: "🛍️",
    description: "Perfect for shops, distributors, and trading companies managing products, suppliers, and customer orders.",
    color: "#3B82F6",
    inventoryCategories: ["Electronics", "Clothing & Apparel", "Food & Beverages", "Home & Kitchen", "Sports & Fitness", "Beauty & Personal Care", "Stationery", "Toys & Games"],
    expenseCategories: ["Rent & Utilities", "Staff Salaries", "Stock Purchase", "Transport & Delivery", "Marketing & Advertising", "Packaging Materials", "Equipment Maintenance", "Miscellaneous"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Rajesh Sharma", company_name: "Sharma Wholesale", email: "rajesh@sharmawholesale.com", phone: "9876543210" },
      { full_name: "Priya Mehta", company_name: "Mehta Distributors", email: "priya@mehtadist.com", phone: "9876543211" },
      { full_name: "Arun Kumar", company_name: "Kumar Retail Chain", email: "arun@kumarretail.com", phone: "9876543212" },
    ],
    sampleLeads: [
      { title: "Bulk order — Sharma Wholesale Q3", value: 250000, status: "qualified" },
      { title: "New distributor — South Zone", value: 180000, status: "contacted" },
      { title: "Festival season stock deal", value: 420000, status: "new" },
    ],
    sampleInventory: [
      { name: "Cotton T-Shirt (White, M)", sku: "CLT-001", category: "Clothing & Apparel", quantity: 150, price: 299, low_stock_alert: 20, unit: "pcs" },
      { name: "LED Bulb 9W", sku: "ELC-001", category: "Electronics", quantity: 300, price: 89, low_stock_alert: 50, unit: "pcs" },
      { name: "Stainless Steel Tiffin Box", sku: "HME-001", category: "Home & Kitchen", quantity: 80, price: 449, low_stock_alert: 15, unit: "pcs" },
    ],
    tips: [
      "Set low stock alerts for your fastest-moving products so you never run out during peak season",
      "Track each supplier as a Contact so you can log calls and follow up on delayed shipments",
      "Use the Finance module to track GST on purchases vs sales separately",
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    icon: "🏭",
    description: "For factories and production units managing raw materials, finished goods, B2B customers, and workforce.",
    color: "#F59E0B",
    inventoryCategories: ["Raw Materials", "Work in Progress", "Finished Goods", "Packaging Materials", "Spare Parts & Machinery", "Tools & Equipment", "Consumables", "Rejected/Scrap"],
    expenseCategories: ["Raw Material Purchase", "Labour & Contract", "Power & Fuel", "Machine Maintenance", "Factory Rent", "Quality Testing", "Logistics & Freight", "Admin & Overhead"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Suresh Patel", company_name: "Patel Industries Ltd", email: "suresh@patelindustries.com", phone: "9876543220" },
      { full_name: "Anita Singh", company_name: "Singh Manufacturing", email: "anita@singhmnfg.com", phone: "9876543221" },
      { full_name: "Vikram Joshi", company_name: "Joshi Components", email: "vikram@joshicomp.com", phone: "9876543222" },
    ],
    sampleLeads: [
      { title: "Annual supply contract — Patel Industries", value: 1500000, status: "qualified" },
      { title: "Export order — UAE buyer", value: 800000, status: "contacted" },
      { title: "OEM parts deal — Auto sector", value: 2200000, status: "new" },
    ],
    sampleInventory: [
      { name: "Steel Rods (12mm)", sku: "RM-STL-001", category: "Raw Materials", quantity: 5000, price: 65, low_stock_alert: 500, unit: "kg" },
      { name: "Industrial Lubricant 5L", sku: "CON-LUB-001", category: "Consumables", quantity: 40, price: 850, low_stock_alert: 10, unit: "can" },
      { name: "Finished Product Box A", sku: "FG-BOX-001", category: "Finished Goods", quantity: 200, price: 1200, low_stock_alert: 30, unit: "pcs" },
    ],
    tips: [
      "Separate raw materials and finished goods as inventory categories for accurate stock valuation",
      "Log every B2B inquiry as a lead — manufacturing deals have long cycles and need consistent follow-up",
      "Run payroll from the HR module and tag labour costs in Finance for accurate production cost tracking",
    ],
  },
  {
    id: "services",
    name: "Services & Agency",
    icon: "💼",
    description: "For consultancies, agencies, freelancers with a team, and professional services businesses.",
    color: "#8B5CF6",
    inventoryCategories: ["Software Licenses", "Hardware & Equipment", "Office Supplies", "Marketing Materials", "IT Assets", "Subscriptions"],
    expenseCategories: ["Salaries & Freelancers", "Office Rent", "Software & Tools", "Travel & Client Meetings", "Marketing & Ads", "Legal & Compliance", "Training & Development", "Miscellaneous"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Neha Gupta", company_name: "Gupta Consulting Group", email: "neha@guptaconsulting.com", phone: "9876543230" },
      { full_name: "Rohit Verma", company_name: "Verma Tech Solutions", email: "rohit@vermatech.com", phone: "9876543231" },
      { full_name: "Kavya Reddy", company_name: "Reddy Digital Agency", email: "kavya@reddydigital.com", phone: "9876543232" },
    ],
    sampleLeads: [
      { title: "Website redesign — Gupta Consulting", value: 85000, status: "qualified" },
      { title: "6-month retainer — Verma Tech", value: 240000, status: "contacted" },
      { title: "Brand identity project — Startup client", value: 45000, status: "new" },
    ],
    sampleInventory: [
      { name: "MacBook Pro 14\"", sku: "HW-MBP-001", category: "Hardware & Equipment", quantity: 5, price: 185000, low_stock_alert: 1, unit: "pcs" },
      { name: "Adobe Creative Cloud (Annual)", sku: "SW-ADO-001", category: "Software Licenses", quantity: 3, price: 54000, low_stock_alert: 1, unit: "license" },
      { name: "Notebook (Premium)", sku: "OFF-NB-001", category: "Office Supplies", quantity: 25, price: 120, low_stock_alert: 5, unit: "pcs" },
    ],
    tips: [
      "Track every proposal as a lead with the project value so you always know your pipeline revenue",
      "Create a contact for each client company AND the individual contact person — link them in notes",
      "Invoice immediately after project milestones rather than at month end to improve cash flow",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant & F&B",
    icon: "🍽️",
    description: "For restaurants, cafes, cloud kitchens, and food businesses managing ingredients, vendors, and operations.",
    color: "#EF4444",
    inventoryCategories: ["Vegetables & Produce", "Meat & Seafood", "Dairy & Eggs", "Dry Goods & Grains", "Beverages", "Cooking Oils & Condiments", "Packaging & Disposables", "Cleaning Supplies"],
    expenseCategories: ["Raw Ingredients", "Staff Wages", "Rent & Utilities", "Gas & Fuel", "Equipment Maintenance", "Packaging & Supplies", "Marketing & Zomato/Swiggy", "Licensing & Permits"],
    leadStages: ["new", "contacted", "qualified", "won", "lost"],
    sampleContacts: [
      { full_name: "Ramesh Yadav", company_name: "Yadav Fresh Supplies", email: "ramesh@yadavfresh.com", phone: "9876543240" },
      { full_name: "Sunita Agarwal", company_name: "Agarwal Dairy", email: "sunita@agarwaldairy.com", phone: "9876543241" },
      { full_name: "Harish Nair", company_name: "Corporate Catering Co", email: "harish@corporatecatering.com", phone: "9876543242" },
    ],
    sampleLeads: [
      { title: "Corporate lunch contract — Tech Park", value: 120000, status: "qualified" },
      { title: "Wedding catering — Dec booking", value: 85000, status: "contacted" },
      { title: "Cloud kitchen franchise inquiry", value: 500000, status: "new" },
    ],
    sampleInventory: [
      { name: "Basmati Rice (Premium)", sku: "DRY-RIC-001", category: "Dry Goods & Grains", quantity: 100, price: 85, low_stock_alert: 20, unit: "kg" },
      { name: "Chicken (Fresh)", sku: "MEA-CHK-001", category: "Meat & Seafood", quantity: 30, price: 280, low_stock_alert: 5, unit: "kg" },
      { name: "Sunflower Oil 15L", sku: "OIL-SNF-001", category: "Cooking Oils & Condiments", quantity: 8, price: 1800, low_stock_alert: 2, unit: "can" },
    ],
    tips: [
      "Set very tight low-stock alerts on perishables like meat and dairy — reorder daily for fresh items",
      "Log every catering inquiry as a lead with full event value to track your B2B revenue pipeline",
      "Track Zomato/Swiggy commission as a separate expense category to see true delivery margin",
    ],
  },
];
`);

// ═══════════════════════════════════════════════════════════════════
// 2. INDUSTRY SETUP WIZARD API — app/api/setup/apply-template/route.ts
// ═══════════════════════════════════════════════════════════════════
write('app/api/setup/apply-template/route.ts', `import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
import { createClient } from "@supabase/supabase-js";
import { INDUSTRY_TEMPLATES } from "../../../lib/industryTemplates";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { templateId, includeSampleData } = await req.json();
  const template = INDUSTRY_TEMPLATES.find(t => t.id === templateId);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const { data: companyId } = await supabase.rpc("get_my_company_id");
  if (!companyId) return NextResponse.json({ error: "Company not found" }, { status: 400 });

  const results: Record<string, number> = {};

  // ── Insert sample inventory ────────────────────────────────────
  if (template.sampleInventory.length > 0) {
    const { data, error } = await serviceClient.from("inventory").insert(
      template.sampleInventory.map(item => ({ ...item, company_id: companyId }))
    );
    results.inventory = template.sampleInventory.length;
    if (error) console.error("Inventory insert error:", error.message);
  }

  // ── Insert sample contacts ─────────────────────────────────────
  if (includeSampleData && template.sampleContacts.length > 0) {
    const { error } = await serviceClient.from("contacts").insert(
      template.sampleContacts.map(c => ({ ...c, company_id: companyId }))
    );
    results.contacts = template.sampleContacts.length;
    if (error) console.error("Contacts insert error:", error.message);
  }

  // ── Insert sample leads ────────────────────────────────────────
  if (includeSampleData && template.sampleLeads.length > 0) {
    const { error } = await serviceClient.from("leads").insert(
      template.sampleLeads.map(l => ({ ...l, company_id: companyId }))
    );
    results.leads = template.sampleLeads.length;
    if (error) console.error("Leads insert error:", error.message);
  }

  // ── Update company name with industry tag ──────────────────────
  await serviceClient
    .from("companies")
    .update({ name: template.name })
    .eq("id", companyId);

  return NextResponse.json({
    success: true,
    template: template.name,
    created: results,
    tips: template.tips,
  });
}
`);

// ═══════════════════════════════════════════════════════════════════
// 3. INDUSTRY SETUP WIZARD UI — app/dashboard/setup/page.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/setup/page.tsx', `"use client";
import { useState } from "react";
import { INDUSTRY_TEMPLATES } from "../../lib/industryTemplates";

export default function SetupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [includeSample, setIncludeSample] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ template: string; created: Record<string, number>; tips: string[] } | null>(null);
  const [error, setError] = useState("");

  const template = INDUSTRY_TEMPLATES.find(t => t.id === selected);

  async function applyTemplate() {
    if (!selected) return;
    setApplying(true); setError("");
    const r = await fetch("/api/setup/apply-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selected, includeSampleData: includeSample }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Failed to apply template"); setApplying(false); return; }
    setResult(d);
    setStep(3);
    setApplying(false);
  }

  return (
    <div style={{ maxWidth: "780px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>Industry Setup</h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0 }}>Set up EMBORG for your specific business type in under 2 minutes.</p>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "36px" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, backgroundColor: step >= s ? "var(--accent)" : "var(--bg-alt)", color: step >= s ? "white" : "var(--muted)", border: step >= s ? "none" : "1px solid var(--line)" }}>{s}</div>
            <span style={{ fontSize: "13px", color: step === s ? "var(--ink)" : "var(--muted)", fontWeight: step === s ? 600 : 400 }}>{["Pick industry", "Confirm setup", "Done"][s - 1]}</span>
            {s < 3 && <div style={{ width: "32px", height: "1px", backgroundColor: step > s ? "var(--accent)" : "var(--line)" }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Pick Industry ── */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: "15px", color: "var(--muted)", marginBottom: "20px" }}>What kind of business do you run?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            {INDUSTRY_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                style={{ padding: "20px", border: selected === t.id ? "2px solid " + t.color : "1px solid var(--line)", borderRadius: "14px", backgroundColor: selected === t.id ? t.color + "10" : "var(--bg)", textAlign: "left", cursor: "pointer", font: "inherit", transition: "all 0.15s" }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)", marginBottom: "6px" }}>{t.name}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{t.description}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => selected && setStep(2)}
            disabled={!selected}
            className="btn-primary"
            style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: selected ? "pointer" : "not-allowed", opacity: selected ? 1 : 0.5 }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 2 && template && (
        <div>
          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "36px" }}>{template.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--ink)" }}>{template.name} Template</div>
                <div style={{ fontSize: "14px", color: "var(--muted)" }}>{template.description}</div>
              </div>
            </div>

            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>What gets set up:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>📦 INVENTORY CATEGORIES ({template.inventoryCategories.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.inventoryCategories.slice(0, 4).join(", ")}{template.inventoryCategories.length > 4 ? " +" + (template.inventoryCategories.length - 4) + " more" : ""}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>💰 EXPENSE CATEGORIES ({template.expenseCategories.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.expenseCategories.slice(0, 4).join(", ")}{template.expenseCategories.length > 4 ? " +" + (template.expenseCategories.length - 4) + " more" : ""}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>📦 SAMPLE PRODUCTS ({template.sampleInventory.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.sampleInventory.map(i => i.name).join(", ")}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>👥 SAMPLE CONTACTS + LEADS</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.sampleContacts.length} contacts · {template.sampleLeads.length} leads</div>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)", cursor: "pointer" }}>
              <input type="checkbox" checked={includeSample} onChange={e => setIncludeSample(e.target.checked)} style={{ marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Include sample contacts and leads</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>Adds realistic example data so you can explore EMBORG immediately. Delete them anytime.</div>
              </div>
            </label>
          </div>

          {error && <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={applyTemplate} disabled={applying} className="btn-primary" style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: applying ? 0.6 : 1 }}>
              {applying ? "Setting up..." : "Apply Template"}
            </button>
            <button onClick={() => setStep(1)} style={{ padding: "12px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "15px", cursor: "pointer" }}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && result && (
        <div>
          <div style={{ padding: "32px", border: "1px solid #10B981", borderRadius: "14px", backgroundColor: "#DCFCE7", marginBottom: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>{result.template} template applied!</h2>
            <p style={{ fontSize: "14px", color: "#166534", margin: "0 0 20px 0" }}>
              Created: {Object.entries(result.created).map(([k, v]) => v + " " + k).join(" · ")}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/dashboard" style={{ padding: "10px 20px", backgroundColor: "#16A34A", color: "white", borderRadius: "18px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Go to Dashboard</a>
              <a href="/dashboard/inventory" style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#166534", border: "1px solid #16A34A", borderRadius: "18px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>View Inventory</a>
            </div>
          </div>

          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>💡 Tips for your business type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {result.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`);

// ═══════════════════════════════════════════════════════════════════
// 4. PUBLIC MARKETPLACE PAGE — app/marketplace/page.tsx
// ═══════════════════════════════════════════════════════════════════
write('app/marketplace/page.tsx', `import type { Metadata } from "next";
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
`);

// ── Add Setup + Marketplace to sidebar and footer ─────────────────
const layoutPath = path.join(ROOT, 'app', 'dashboard', 'layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');
if (!layout.includes('/dashboard/setup')) {
  layout = layout.replace(
    `{ label: "Getting Started", href: "/dashboard/onboarding" }`,
    `{ label: "Getting Started", href: "/dashboard/onboarding" }, { label: "Industry Setup", href: "/dashboard/setup" }`
  );
  fs.writeFileSync(layoutPath, layout, 'utf8');
  console.log('✅ Sidebar: added Industry Setup link');
}

const footerPath = path.join(ROOT, 'app', 'components', 'Footer.tsx');
let footer = fs.readFileSync(footerPath, 'utf8');
if (!footer.includes('/marketplace')) {
  footer = footer.replace(
    `<a href="/blog" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Blog</a>`,
    `<a href="/blog" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Blog</a>
            <a href="/marketplace" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Marketplace</a>`
  );
  fs.writeFileSync(footerPath, footer, 'utf8');
  console.log('✅ Footer: added Marketplace link');
}

console.log('\nRun: npm run build');
