"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Invoice = { id: string; number: string; client: string; amount: number; status: string; due_date: string; created_at: string; };
type Expense = { id: string; description: string; amount: number; category: string; date: string; created_at: string; };

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]).then(([inv, exp]) => {
      setInvoices(inv.data || []);
      setExpenses(exp.data || []);
      setLoading(false);
    });
  }, []);

  // --- CSV Export ---
  function exportCSV(type: "invoices" | "expenses") {
    if (type === "invoices") {
      const headers = ["Invoice #", "Client", "Amount (INR)", "Status", "Due Date", "Created"];
      const rows = invoices.map(i => [
        i.number, i.client, i.amount, i.status,
        i.due_date ? new Date(i.due_date).toLocaleDateString() : "",
        new Date(i.created_at).toLocaleDateString()
      ]);
      downloadCSV("emborg_invoices.csv", [headers, ...rows]);
    } else {
      const headers = ["Description", "Category", "Amount (INR)", "Date"];
      const rows = expenses.map(e => [e.description, e.category, e.amount, e.date ? new Date(e.date).toLocaleDateString() : ""]);
      downloadCSV("emborg_expenses.csv", [headers, ...rows]);
    }
  }

  function downloadCSV(filename: string, rows: any[][]) {
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // --- PDF Invoice ---
  function printInvoice(inv: Invoice) {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "N/A";
    const created = new Date(inv.created_at).toLocaleDateString();
    const statusColor = inv.status === "paid" ? "#10B981" : inv.status === "overdue" ? "#EF4444" : "#F59E0B";
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.number}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; padding: 48px; background: white; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
      .logo { font-size: 28px; font-weight: 800; color: #6366F1; letter-spacing: -1px; }
      .logo span { color: #1a1a2e; }
      .invoice-title { text-align: right; }
      .invoice-title h1 { font-size: 36px; font-weight: 800; color: #6366F1; }
      .invoice-title p { font-size: 14px; color: #888; margin-top: 4px; }
      .divider { height: 2px; background: linear-gradient(90deg, #6366F1, #8B5CF6); margin-bottom: 36px; border-radius: 2px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
      .meta-block h3 { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
      .meta-block p { font-size: 15px; color: #1a1a2e; font-weight: 500; }
      .meta-block .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: ${statusColor}22; color: ${statusColor}; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
      thead tr { background: #f8f8ff; }
      th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
      .total-row { background: #6366F1; color: white; }
      .total-row td { font-weight: 700; font-size: 16px; border: none; }
      .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
      @media print { body { padding: 24px; } }
    </style></head><body>
    <div class="header">
      <div class="logo">EM<span>BORG</span></div>
      <div class="invoice-title"><h1>INVOICE</h1><p># ${inv.number}</p></div>
    </div>
    <div class="divider"></div>
    <div class="meta">
      <div class="meta-block"><h3>Bill To</h3><p>${inv.client}</p></div>
      <div class="meta-block"><h3>Status</h3><span class="status">${inv.status.toUpperCase()}</span></div>
      <div class="meta-block"><h3>Invoice Date</h3><p>${created}</p></div>
      <div class="meta-block"><h3>Due Date</h3><p>${due}</p></div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Services - ${inv.client}</td><td>1</td><td>INR ${(inv.amount || 0).toLocaleString()}</td><td>INR ${(inv.amount || 0).toLocaleString()}</td></tr>
      </tbody>
      <tfoot>
        <tr><td colspan="2"></td><td style="padding:16px;font-size:13px;font-weight:600;color:#888;">Subtotal</td><td style="padding:16px;font-size:14px;">INR ${(inv.amount || 0).toLocaleString()}</td></tr>
        <tr class="total-row"><td colspan="2"></td><td style="padding:16px;">Total</td><td style="padding:16px;">INR ${(inv.amount || 0).toLocaleString()}</td></tr>
      </tfoot>
    </table>
    <div class="footer"><p>Generated by EMBORG - Cloud ERP for SMEs | emborgerp.com</p><p style="margin-top:4px;">Thank you for your business!</p></div>
    <script>window.onload = function() { window.print(); }<\/script>
    </body></html>`);
    win.document.close();
  }

  // --- Monthly P&L ---
  const now = new Date();
  const months: { label: string; income: number; expenses: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" }) + " " + d.getFullYear();
    const income = invoices.filter(inv => {
      const ld = new Date(inv.created_at);
      return inv.status === "paid" && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
    }).reduce((s, inv) => s + (inv.amount || 0), 0);
    const exp = expenses.filter(e => {
      const ed = new Date(e.date || e.created_at);
      return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
    }).reduce((s, e) => s + (e.amount || 0), 0);
    months.push({ label, income, expenses: exp, profit: income - exp });
  }

  const totalIncome = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Reports and Export</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>PDF invoices, CSV exports, and financial summary</p>
      </div>

      {/* Quick export buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Export Invoices CSV", icon: "I", color: "#3B82F6", action: () => exportCSV("invoices") },
          { label: "Export Expenses CSV", icon: "E", color: "#EF4444", action: () => exportCSV("expenses") },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", border: "1px solid var(--line)", textAlign: "left" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: btn.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: btn.color }}>{btn.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{btn.label}</p>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Download as .csv</p>
            </div>
          </button>
        ))}
      </div>

      {/* P&L Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Revenue", value: "INR " + totalIncome.toLocaleString(), color: "#10B981" },
          { label: "Total Expenses", value: "INR " + totalExp.toLocaleString(), color: "#EF4444" },
          { label: "Net Profit", value: "INR " + (totalIncome - totalExp).toLocaleString(), color: (totalIncome - totalExp) >= 0 ? "#6366F1" : "#EF4444" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly P&L table */}
      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Monthly P&L (Last 6 Months)</h3>
        {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Month", "Revenue (Paid)", "Expenses", "Net Profit"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(m => (
                <tr key={m.label} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 500, color: "var(--ink)" }}>{m.label}</td>
                  <td style={{ padding: "12px", color: "#10B981", fontWeight: 600 }}>INR {m.income.toLocaleString()}</td>
                  <td style={{ padding: "12px", color: "#EF4444", fontWeight: 600 }}>INR {m.expenses.toLocaleString()}</td>
                  <td style={{ padding: "12px", fontWeight: 700, color: m.profit >= 0 ? "#6366F1" : "#EF4444" }}>INR {m.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice PDF generator */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px 0" }}>Print Invoice as PDF</h3>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>Click any invoice to generate a printable PDF</p>
        {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : invoices.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>No invoices yet. Create some in the Finance module.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {invoices.map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#6366F122", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#6366F1" }}>PDF</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Invoice #{inv.number}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{inv.client} - INR {(inv.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: inv.status === "paid" ? "#10B98122" : "#F59E0B22", color: inv.status === "paid" ? "#10B981" : "#F59E0B" }}>{inv.status}</span>
                  <button onClick={() => printInvoice(inv)} style={{ padding: "7px 16px", backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    Print PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
