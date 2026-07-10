const fs = require("fs");

const page = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Invoice = { id: string; number: string; client: string; amount: number; status: string; };
type Payment = { id: string; invoice_id: string; invoice_number: string; amount: number; payment_method: string; reference_number: string; payment_date: string; notes: string; created_at: string; };

const METHOD_LABELS: Record<string, string> = { razorpay: "Razorpay", cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque" };
const METHOD_COLORS: Record<string, string> = { razorpay: "#6366F1", cash: "#10B981", bank_transfer: "#3B82F6", cheque: "#F59E0B" };

export default function PaymentEntriesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [payRes, invRes] = await Promise.all([
      supabase.from("payment_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("invoices").select("id, number, client, amount, status").neq("status", "draft").order("number"),
    ]);
    setPayments(payRes.data || []);
    setInvoices(invRes.data || []);
    setLoading(false);
  }

  function getPaidAmount(invoiceId: string) {
    return payments.filter(p => p.invoice_id === invoiceId).reduce((s, p) => s + p.amount, 0);
  }

  function getBalance(inv: Invoice) {
    return inv.amount - getPaidAmount(inv.id);
  }

  function openAdd() {
    setSelectedInvoiceId(""); setAmount(""); setMethod("bank_transfer"); setReference("");
    setPaymentDate(new Date().toISOString().split("T")[0]); setNotes("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const inv = invoices.find(i => i.id === selectedInvoiceId);
    if (!inv) return;
    const amt = parseFloat(amount) || 0;
    const balance = getBalance(inv);
    if (amt <= 0) { showToast("Enter a valid amount", false); return; }
    if (amt > balance) { showToast("Amount exceeds outstanding balance of INR " + balance.toLocaleString(), false); return; }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    await supabase.from("payment_entries").insert({
      company_id: profile.company_id, invoice_id: selectedInvoiceId, invoice_number: inv.number,
      amount: amt, payment_method: method, reference_number: reference || null,
      payment_date: paymentDate || null, notes: notes || null,
    });

    const newPaid = getPaidAmount(selectedInvoiceId) + amt;
    if (newPaid >= inv.amount) {
      await supabase.from("invoices").update({ status: "paid" }).eq("id", selectedInvoiceId);
    }

    setShowForm(false); setSaving(false);
    showToast("Payment recorded successfully", true);
    fetchAll();
  }

  async function handleDelete(id: string, invoiceId: string) {
    if (!confirm("Delete this payment entry? This may affect the invoice's paid status.")) return;
    const supabase = createClient();
    await supabase.from("payment_entries").delete().eq("id", id);
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      const remainingPaid = payments.filter(p => p.invoice_id === invoiceId && p.id !== id).reduce((s, p) => s + p.amount, 0);
      if (remainingPaid < inv.amount) {
        await supabase.from("invoices").update({ status: "pending" }).eq("id", invoiceId);
      }
    }
    fetchAll();
  }

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const outstandingInvoices = invoices.filter(inv => getBalance(inv) > 0);
  const totalOutstanding = outstandingInvoices.reduce((s, inv) => s + getBalance(inv), 0);

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" };

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Payment Entries</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Record full or partial payments against invoices</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Record Payment</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Collected", value: "INR " + totalCollected.toLocaleString(), color: "#10B981" },
          { label: "Outstanding Balance", value: "INR " + totalOutstanding.toLocaleString(), color: "#F59E0B" },
          { label: "Invoices with Balance", value: String(outstandingInvoices.length), color: "#EF4444" },
        ].map(k => (
          <div key={k.label} style={cardStyle}><p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p><p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p></div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Record Payment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <select value={selectedInvoiceId} onChange={e => setSelectedInvoiceId(e.target.value)} required style={inputStyle}>
              <option value="">Select invoice</option>
              {invoices.filter(inv => getBalance(inv) > 0).map(inv => (
                <option key={inv.id} value={inv.id}>{inv.number} - {inv.client} (balance: INR {getBalance(inv).toLocaleString()})</option>
              ))}
            </select>
            <input type="number" min="0" step="any" placeholder="Amount (INR)" value={amount} onChange={e => setAmount(e.target.value)} required style={inputStyle} />
            <select value={method} onChange={e => setMethod(e.target.value)} style={inputStyle}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="razorpay">Razorpay</option>
            </select>
            <input placeholder="Reference / Transaction ID" value={reference} onChange={e => setReference(e.target.value)} style={inputStyle} />
            <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={inputStyle} />
            <input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} />
          </div>
          {selectedInvoice && (
            <div style={{ padding: "12px 16px", backgroundColor: "var(--bg)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", color: "var(--muted)" }}>
              Invoice total: <strong style={{ color: "var(--ink)" }}>INR {selectedInvoice.amount.toLocaleString()}</strong> &middot;
              Already paid: <strong style={{ color: "#10B981" }}> INR {getPaidAmount(selectedInvoice.id).toLocaleString()}</strong> &middot;
              Balance: <strong style={{ color: "#F59E0B" }}> INR {getBalance(selectedInvoice).toLocaleString()}</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Record Payment"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Outstanding invoices summary */}
      {outstandingInvoices.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 14px 0" }}>Invoices with Outstanding Balance</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {outstandingInvoices.map(inv => {
              const paid = getPaidAmount(inv.id);
              const balance = getBalance(inv);
              const pct = Math.round((paid / inv.amount) * 100);
              return (
                <div key={inv.id} style={{ padding: "12px 16px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{inv.number} - {inv.client}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{pct}% paid</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "var(--line)", borderRadius: "3px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", width: pct + "%", backgroundColor: "#10B981" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#10B981" }}>Paid: INR {paid.toLocaleString()}</span>
                    <span style={{ color: "#F59E0B", fontWeight: 600 }}>Balance: INR {balance.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : payments.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No payments recorded yet.</p></div>
      ) : (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 14px 0" }}>Payment History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Date", "Invoice", "Amount", "Method", "Reference", "Notes", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{p.invoice_number}</td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#10B981" }}>INR {p.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (METHOD_COLORS[p.payment_method] || "#6B7280") + "22", color: METHOD_COLORS[p.payment_method] || "#6B7280" }}>{METHOD_LABELS[p.payment_method] || p.payment_method}</span></td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{p.reference_number || "-"}</td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{p.notes || "-"}</td>
                  <td style={{ padding: "12px" }}><button onClick={() => handleDelete(p.id, p.invoice_id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
`;

fs.mkdirSync("app/dashboard/payments", { recursive: true });
fs.writeFileSync("app/dashboard/payments/page.tsx", page, "utf8");
console.log("Done:", fs.statSync("app/dashboard/payments/page.tsx").size, "bytes");
