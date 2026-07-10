const fs = require("fs");

// ── 1. PRICING PAGE ──────────────────────────────────────────────
const pricing = `"use client";
import { useEffect } from "react";

const PLANS = [
  {
    name: "Starter",
    price: 999,
    priceLabel: "₹999",
    period: "/month",
    description: "Perfect for freelancers and micro businesses",
    color: "#3B82F6",
    features: ["Up to 100 contacts", "CRM & Leads", "Basic Inventory", "Finance tracking", "Email support"],
    popular: false,
  },
  {
    name: "Pro",
    price: 2499,
    priceLabel: "₹2,499",
    period: "/month",
    description: "For growing SMEs that need more power",
    color: "#6366F1",
    features: ["Unlimited contacts", "Full CRM + Pipeline Analytics", "Advanced Inventory", "Invoicing + Expenses", "HR & Payroll", "AI Assistant", "Priority support"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 5999,
    priceLabel: "₹5,999",
    period: "/month",
    description: "For established businesses at scale",
    color: "#10B981",
    features: ["Everything in Pro", "Multiple users", "Custom integrations", "Dedicated account manager", "SLA guarantee", "Custom reports", "API access"],
    popular: false,
  },
];

declare global {
  interface Window { Razorpay: any; }
}

export default function PricingPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  function handleSubscribe(plan: typeof PLANS[0]) {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: plan.price * 100,
      currency: "INR",
      name: "EMBORG",
      description: plan.name + " Plan - Monthly Subscription",
      image: "/brand/logo.svg",
      handler: function(response: any) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id + ". Welcome to EMBORG " + plan.name + "!");
      },
      prefill: { name: "", email: "", contact: "" },
      notes: { plan: plan.name },
      theme: { color: plan.color },
      modal: { ondismiss: function() { console.log("Payment dismissed"); } }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)", padding: "60px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", backgroundColor: "#6366F122", borderRadius: "20px", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "#6366F1", fontWeight: 600 }}>Simple, transparent pricing</span>
          </div>
          <h1 className="tight" style={{ fontSize: "48px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0" }}>Choose your plan</h1>
          <p style={{ fontSize: "18px", color: "var(--muted)", maxWidth: "500px", margin: "0 auto" }}>Start free, scale as you grow. No hidden fees.</p>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "start" }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              backgroundColor: "var(--bg-alt)", borderRadius: "20px", padding: "32px",
              border: plan.popular ? \`2px solid \${plan.color}\` : "1px solid var(--line)",
              position: "relative", transform: plan.popular ? "scale(1.02)" : "scale(1)"
            }}>
              {plan.popular && (
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  backgroundColor: plan.color, color: "white", fontSize: "12px", fontWeight: 700,
                  padding: "4px 16px", borderRadius: "20px", whiteSpace: "nowrap"
                }}>MOST POPULAR</div>
              )}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: plan.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: plan.color }} />
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>{plan.name}</h2>
                <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{plan.description}</p>
              </div>
              <div style={{ marginBottom: "28px" }}>
                <span style={{ fontSize: "42px", fontWeight: 800, color: plan.color }}>{plan.priceLabel}</span>
                <span style={{ fontSize: "14px", color: "var(--muted)" }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "var(--ink)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                style={{
                  width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                  backgroundColor: plan.popular ? plan.color : "transparent",
                  color: plan.popular ? "white" : plan.color,
                  border: plan.popular ? "none" : \`2px solid \${plan.color}\`,
                  fontSize: "15px", fontWeight: 700, cursor: "pointer"
                }}
              >
                Get started with {plan.name}
              </button>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--muted)", marginTop: "40px" }}>
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </div>
  );
}
`;

// ── 2. FINANCE PAGE with Pay Now button ──────────────────────────
const finance = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Invoice = { id: string; number: string; client: string; amount: number; status: string; due_date: string; created_at: string; };
type Expense = { id: string; description: string; amount: number; category: string; date: string; };

declare global { interface Window { Razorpay: any; } }

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<"invoices" | "expenses">("invoices");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invNumber, setInvNumber] = useState("");
  const [invClient, setInvClient] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invStatus, setInvStatus] = useState("pending");
  const [invDue, setInvDue] = useState("");

  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("office");
  const [expDate, setExpDate] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    fetchData();
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  async function fetchData() {
    const supabase = createClient();
    const [inv, exp] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);
    setInvoices(inv.data || []);
    setExpenses(exp.data || []);
    setLoading(false);
  }

  function handlePayNow(invoice: Invoice) {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: Math.round(invoice.amount * 100),
      currency: "INR",
      name: "EMBORG",
      description: "Invoice " + invoice.number + " - " + invoice.client,
      image: "/brand/logo.svg",
      handler: async function(response: any) {
        const supabase = createClient();
        await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
        alert("Payment successful! ID: " + response.razorpay_payment_id);
        fetchData();
      },
      prefill: { name: invoice.client },
      notes: { invoice_id: invoice.id, invoice_number: invoice.number },
      theme: { color: "#6366F1" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  async function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }
    await supabase.from("invoices").insert({ number: invNumber, client: invClient, amount: parseFloat(invAmount) || 0, status: invStatus, due_date: invDue || null, company_id: profile.company_id });
    setShowForm(false); setSaving(false); setInvNumber(""); setInvClient(""); setInvAmount(""); setInvStatus("pending"); setInvDue("");
    fetchData();
  }

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }
    await supabase.from("expenses").insert({ description: expDesc, amount: parseFloat(expAmount) || 0, category: expCat, date: expDate || new Date().toISOString().split("T")[0], company_id: profile.company_id });
    setShowForm(false); setSaving(false); setExpDesc(""); setExpAmount(""); setExpCat("office"); setExpDate("");
    fetchData();
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const STATUS_COLORS: Record<string, string> = { paid: "#10B981", pending: "#F59E0B", overdue: "#EF4444", draft: "#6B7280" };
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Finance</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Invoices and expenses</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
          + {tab === "invoices" ? "New Invoice" : "New Expense"}
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Invoiced", value: "INR " + totalInvoiced.toLocaleString(), color: "#3B82F6" },
          { label: "Collected", value: "INR " + totalPaid.toLocaleString(), color: "#10B981" },
          { label: "Outstanding", value: "INR " + (totalInvoiced - totalPaid).toLocaleString(), color: "#F59E0B" },
          { label: "Total Expenses", value: "INR " + totalExpenses.toLocaleString(), color: "#EF4444" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {(["invoices", "expenses"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600,
            backgroundColor: tab === t ? "var(--accent)" : "transparent",
            color: tab === t ? "white" : "var(--muted)"
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Invoice form */}
      {showForm && tab === "invoices" && (
        <form onSubmit={handleSaveInvoice} style={{ ...cardStyle, marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Invoice #" value={invNumber} onChange={e => setInvNumber(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Client name" value={invClient} onChange={e => setInvClient(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount (INR)" type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Due date" type="date" value={invDue} onChange={e => setInvDue(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={invStatus} onChange={e => setInvStatus(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {["draft","pending","paid","overdue"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : "Save Invoice"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Expense form */}
      {showForm && tab === "expenses" && (
        <form onSubmit={handleSaveExpense} style={{ ...cardStyle, marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Description" value={expDesc} onChange={e => setExpDesc(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount (INR)" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={expCat} onChange={e => setExpCat(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {["office","travel","software","marketing","utilities","other"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
          <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : "Save Expense"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : (
        <>
          {tab === "invoices" && (
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    {["Invoice #", "Client", "Amount", "Due Date", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No invoices yet. Create your first one!</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px" , fontWeight: 600, color: "var(--ink)" }}>{inv.number}</td>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{inv.client}</td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>INR {(inv.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "var(--muted)" }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (STATUS_COLORS[inv.status] || "#6B7280") + "22", color: STATUS_COLORS[inv.status] || "#6B7280" }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {inv.status !== "paid" && (
                          <button onClick={() => handlePayNow(inv)} style={{ padding: "6px 14px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                            Pay Now
                          </button>
                        )}
                        {inv.status === "paid" && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>Paid</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "expenses" && (
            <div style={cardStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    {["Description", "Category", "Amount", "Date"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No expenses yet.</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{exp.description}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "#6366F122", color: "#6366F1" }}>{exp.category}</span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#EF4444" }}>INR {(exp.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "var(--muted)" }}>{exp.date ? new Date(exp.date).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
`;

fs.writeFileSync("app/pricing/page.tsx", pricing, "utf8");
console.log("Pricing page:", fs.statSync("app/pricing/page.tsx").size, "bytes");

fs.writeFileSync("app/dashboard/finance/page.tsx", finance, "utf8");
console.log("Finance page:", fs.statSync("app/dashboard/finance/page.tsx").size, "bytes");
