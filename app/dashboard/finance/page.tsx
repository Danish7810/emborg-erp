"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Invoice = { id: string; invoice_number: string; client_name: string; amount: number; status: string; due_date: string; created_at: string; };
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
          invoiceNumber: inv.invoice_number,
          client: inv.client_name,
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

  async function handlePayNow(invoice: Invoice) {
    let order: { orderId: string; amount: number; currency: string; keyId: string; error?: string };
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      order = await orderRes.json();
      if (!orderRes.ok) { showToast(order.error || "Could not start payment", false); return; }
    } catch {
      showToast("Could not start payment. Please try again.", false);
      return;
    }

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "EMBORG",
      description: "Invoice " + invoice.invoice_number + " - " + invoice.client_name,
      image: "/brand/logo.svg",
      // Never trust this callback directly — it only tells us Razorpay's
      // checkout UI reported success. The actual invoice status update
      // happens server-side in /api/razorpay/verify-payment, which
      // recomputes and checks Razorpay's cryptographic signature before
      // touching the database.
      handler: async function(response: any) {
        try {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoiceId: invoice.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();
          if (verifyRes.ok && result.success) {
            showToast("Payment successful! ID: " + response.razorpay_payment_id, true);
          } else {
            showToast(result.error || "Payment could not be verified. Contact support if you were charged.", false);
          }
        } catch {
          showToast("Payment could not be verified. Contact support if you were charged.", false);
        }
        fetchData();
      },
      prefill: { name: invoice.client_name },
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
    await supabase.from("invoices").insert({ invoice_number: invNumber, client_name: invClient, amount: parseFloat(invAmount) || 0, status: invStatus, due_date: invDue || null, client_email: invEmail || null, company_id: profile.company_id });
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
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{inv.invoice_number}</td>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{inv.client_name}</td>
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
