const fs = require("fs");

// ── 1. API ROUTE: /api/send-reminder ─────────────────────────────
fs.mkdirSync("app/api/send-reminder", { recursive: true });

const apiRoute = `import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { invoiceNumber, client, amount, dueDate, status, recipientEmail } = await req.json();

    const due = dueDate ? new Date(dueDate).toLocaleDateString("en-IN") : "N/A";
    const isOverdue = status === "overdue";
    const subject = isOverdue
      ? "OVERDUE: Invoice #" + invoiceNumber + " Payment Required"
      : "Payment Reminder: Invoice #" + invoiceNumber + " Due Soon";

    const html = \`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-1px;">EMBORG</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Cloud ERP for SMEs</p>
    </div>
    <div style="padding:40px;">
      <div style="display:inline-block;padding:6px 14px;background:\${isOverdue ? "#FEE2E2" : "#FEF3C7"};border-radius:20px;margin-bottom:24px;">
        <span style="font-size:12px;font-weight:700;color:\${isOverdue ? "#EF4444" : "#F59E0B"};">\${isOverdue ? "OVERDUE" : "PAYMENT DUE"}</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;">Hi \${client},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">
        \${isOverdue
          ? "This is a reminder that your payment is overdue. Please arrange payment at your earliest convenience."
          : "This is a friendly reminder that your invoice is due soon. Please arrange payment before the due date."}
      </p>
      <div style="background:#f8f8ff;border-radius:12px;padding:24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-size:13px;color:#888;">Invoice Number</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">#\${invoiceNumber}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Amount Due</td><td style="padding:8px 0;font-size:18px;font-weight:800;color:#6366F1;text-align:right;">INR \${Number(amount).toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Due Date</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:\${isOverdue ? "#EF4444" : "#1a1a2e"};text-align:right;">\${due}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Status</td><td style="padding:8px 0;text-align:right;"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:\${isOverdue ? "#FEE2E2" : "#FEF3C7"};color:\${isOverdue ? "#EF4444" : "#F59E0B"};">\${status.toUpperCase()}</span></td></tr>
        </table>
      </div>
      <p style="margin:0 0 32px;font-size:14px;color:#888;line-height:1.6;">If you have already made the payment, please disregard this message. For any queries, please reply to this email.</p>
      <div style="border-top:1px solid #eee;padding-top:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#6366F1;">EMBORG</strong> - Cloud ERP for SMEs</p>
        <p style="margin:4px 0 0;font-size:12px;color:#aaa;">emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>\`;

    const { data, error } = await resend.emails.send({
      from: "EMBORG <onboarding@resend.dev>",
      to: recipientEmail || "kazidanish.er@gmail.com",
      subject,
      html,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
`;

fs.writeFileSync("app/api/send-reminder/route.ts", apiRoute, "utf8");
console.log("API route:", fs.statSync("app/api/send-reminder/route.ts").size, "bytes");

// ── 2. UPDATED FINANCE PAGE with Send Reminder button ────────────
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
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [invNumber, setInvNumber] = useState("");
  const [invClient, setInvClient] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invStatus, setInvStatus] = useState("pending");
  const [invDue, setInvDue] = useState("");
  const [invEmail, setInvEmail] = useState("");

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

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

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

  async function handleSendReminder(inv: Invoice) {
    setSendingId(inv.id);
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: inv.number,
          client: inv.client,
          amount: inv.amount,
          dueDate: inv.due_date,
          status: inv.status,
          recipientEmail: "kazidanish.er@gmail.com",
        }),
      });
      const data = await res.json();
      if (data.success) showToast("Reminder sent successfully!", true);
      else showToast("Failed to send reminder.", false);
    } catch { showToast("Error sending reminder.", false); }
    setSendingId(null);
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
        showToast("Payment successful! ID: " + response.razorpay_payment_id, true);
        fetchData();
      },
      prefill: { name: invoice.client },
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
    await supabase.from("invoices").insert({ number: invNumber, client: invClient, amount: parseFloat(invAmount) || 0, status: invStatus, due_date: invDue || null, client_email: invEmail || null, company_id: profile.company_id });
    setShowForm(false); setSaving(false);
    setInvNumber(""); setInvClient(""); setInvAmount(""); setInvStatus("pending"); setInvDue(""); setInvEmail("");
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
    setShowForm(false); setSaving(false);
    setExpDesc(""); setExpAmount(""); setExpCat("office"); setExpDate("");
    fetchData();
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const overdueCount = invoices.filter(i => i.status === "overdue").length;
  const STATUS_COLORS: Record<string, string> = { paid: "#10B981", pending: "#F59E0B", overdue: "#EF4444", draft: "#6B7280" };
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Invoiced", value: "INR " + totalInvoiced.toLocaleString(), color: "#3B82F6" },
          { label: "Collected", value: "INR " + totalPaid.toLocaleString(), color: "#10B981" },
          { label: "Outstanding", value: "INR " + (totalInvoiced - totalPaid).toLocaleString(), color: "#F59E0B" },
          { label: "Total Expenses", value: "INR " + totalExpenses.toLocaleString(), color: "#EF4444" },
          { label: "Overdue", value: overdueCount + " invoice" + (overdueCount !== 1 ? "s" : ""), color: "#EF4444" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {(["invoices", "expenses"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, backgroundColor: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "white" : "var(--muted)" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice form */}
      {showForm && tab === "invoices" && (
        <form onSubmit={handleSaveInvoice} style={{ ...cardStyle, marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Invoice #" value={invNumber} onChange={e => setInvNumber(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Client name" value={invClient} onChange={e => setInvClient(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount (INR)" type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Client email (for reminders)" type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Due date" type="date" value={invDue} onChange={e => setInvDue(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={invStatus} onChange={e => setInvStatus(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {["draft","pending","paid","overdue"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
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
                    {["Invoice #", "Client", "Amount", "Due Date", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>No invoices yet. Create your first one!</td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{inv.number}</td>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{inv.client}</td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>INR {(inv.amount || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "var(--muted)" }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (STATUS_COLORS[inv.status] || "#6B7280") + "22", color: STATUS_COLORS[inv.status] || "#6B7280" }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {inv.status !== "paid" && (
                            <button onClick={() => handlePayNow(inv)} style={{ padding: "5px 12px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                              Pay Now
                            </button>
                          )}
                          {inv.status !== "paid" && (
                            <button onClick={() => handleSendReminder(inv)} disabled={sendingId === inv.id} style={{ padding: "5px 12px", backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: sendingId === inv.id ? 0.6 : 1 }}>
                              {sendingId === inv.id ? "Sending..." : "Send Reminder"}
                            </button>
                          )}
                          {inv.status === "paid" && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>Paid</span>}
                        </div>
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
                      <td style={{ padding: "12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "#6366F122", color: "#6366F1" }}>{exp.category}</span></td>
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

fs.writeFileSync("app/dashboard/finance/page.tsx", finance, "utf8");
console.log("Finance page:", fs.statSync("app/dashboard/finance/page.tsx").size, "bytes");
