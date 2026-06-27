"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function FinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"invoices" | "expenses">("invoices");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("General");
  const [expDate, setExpDate] = useState("");
  const [expNotes, setExpNotes] = useState("");

  async function fetchData() {
    const supabase = createClient();
    const [{ data: inv }, { data: exp }] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    ]);
    setInvoices(inv || []);
    setExpenses(exp || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function getCompanyId() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_my_company_id");
    return data;
  }

  async function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const company_id = await getCompanyId();
    if (!company_id) { setError("Could not get company ID"); setSaving(false); return; }
    const { error: err } = await supabase.from("invoices").insert({ client_name: clientName, client_email: clientEmail, amount: parseFloat(amount) || 0, status, due_date: dueDate || null, notes, invoice_number: invoiceNumber, company_id });
    if (err) { setError(err.message); setSaving(false); return; }
    setClientName(""); setClientEmail(""); setAmount(""); setStatus("draft"); setDueDate(""); setNotes(""); setInvoiceNumber("");
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const company_id = await getCompanyId();
    if (!company_id) { setError("Could not get company ID"); setSaving(false); return; }
    const { error: err } = await supabase.from("expenses").insert({ title: expTitle, amount: parseFloat(expAmount) || 0, category: expCategory, date: expDate || new Date().toISOString().split("T")[0], notes: expNotes, company_id });
    if (err) { setError(err.message); setSaving(false); return; }
    setExpTitle(""); setExpAmount(""); setExpCategory("General"); setExpDate(""); setExpNotes("");
    setShowForm(false);
    setSaving(false);
    fetchData();
  }

  async function handleDelete(table: string, id: string) {
    if (!confirm("Delete this item?")) return;
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient();
    await supabase.from("invoices").update({ status: newStatus }).eq("id", id);
    fetchData();
  }

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalOutstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const STATUS_COLORS: Record<string, string> = { draft: "#71717A", sent: "#3B82F6", paid: "#10B981", overdue: "#EF4444" };

  const EXPENSE_CATEGORIES = ["General", "Office", "Travel", "Software", "Marketing", "Salaries", "Utilities", "Other"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Finance</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Invoices, expenses, and financial overview.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); }} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
          {showForm ? "Cancel" : tab === "invoices" ? "+ New Invoice" : "+ New Expense"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Revenue", value: "$" + totalRevenue.toLocaleString(), color: "#10B981" },
          { label: "Outstanding", value: "$" + totalOutstanding.toLocaleString(), color: "#F59E0B" },
          { label: "Total Expenses", value: "$" + totalExpenses.toLocaleString(), color: "#EF4444" },
          { label: "Net Profit", value: "$" + netProfit.toLocaleString(), color: netProfit >= 0 ? "#10B981" : "#EF4444" },
        ].map((card, i) => (
          <div key={i} style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>{card.label}</p>
            <p className="tight" style={{ fontSize: "26px", fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {(["invoices", "expenses"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); }} style={{ padding: "8px 20px", borderRadius: "10px", border: "none", backgroundColor: tab === t ? "var(--bg)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontWeight: tab === t ? 600 : 400, fontSize: "14px", cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {showForm && tab === "invoices" && (
        <form onSubmit={handleSaveInvoice} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Invoice number (e.g. INV-001)" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Client email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount ($)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <input placeholder="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ gridColumn: "1 / -1", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          {error && <p style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </form>
      )}

      {showForm && tab === "expenses" && (
        <form onSubmit={handleSaveExpense} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Expense title" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Amount ($)" type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Date" type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Notes" value={expNotes} onChange={(e) => setExpNotes(e.target.value)} style={{ gridColumn: "1 / -1", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          {error && <p style={{ gridColumn: "1 / -1", fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Expense"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : tab === "invoices" ? (
        invoices.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No invoices yet. Create your first invoice above.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                  {["Invoice", "Client", "Amount", "Status", "Due Date", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{inv.invoice_number || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{inv.client_name}</td>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 600 }}>${(inv.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <select value={inv.status} onChange={(e) => handleStatusChange(inv.id, e.target.value)} style={{ padding: "4px 8px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: STATUS_COLORS[inv.status], fontSize: "12px", fontWeight: 600 }}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{inv.due_date || "-"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handleDelete("invoices", inv.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        expenses.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No expenses yet. Log your first expense above.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                  {["Title", "Category", "Amount", "Date", "Notes", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, i) => (
                  <tr key={exp.id} style={{ borderBottom: i < expenses.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{exp.title}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{exp.category}</td>
                    <td style={{ padding: "14px 16px", color: "#EF4444", fontWeight: 600 }}>${(exp.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{exp.date || "-"}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "13px" }}>{exp.notes || "-"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => handleDelete("expenses", exp.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
