const fs = require("fs");

const page = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type QuotationItem = { id?: string; item_name: string; description: string; qty: number; rate: number; amount: number; };
type Quotation = {
  id: string; number: string; customer_name: string; quote_date: string; valid_till: string;
  status: string; subtotal: number; discount_percent: number; tax_percent: number; total: number;
  terms: string; created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280", sent: "#3B82F6", accepted: "#10B981",
  declined: "#EF4444", expired: "#F59E0B", converted: "#8B5CF6",
};

function emptyItem(): QuotationItem {
  return { item_name: "", description: "", qty: 1, rate: 0, amount: 0 };
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [validTill, setValidTill] = useState("");
  const [status, setStatus] = useState("draft");
  const [terms, setTerms] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxPercent, setTaxPercent] = useState("18");
  const [items, setItems] = useState<QuotationItem[]>([emptyItem()]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => { fetchQuotations(); }, []);

  async function fetchQuotations() {
    const supabase = createClient();
    const { data } = await supabase.from("quotations").select("*").order("created_at", { ascending: false });
    setQuotations(data || []);
    setLoading(false);
  }

  // --- Totals calculation (ERPNext style: subtotal -> discount -> tax) ---
  const subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  const discountAmt = subtotal * (parseFloat(discountPercent) || 0) / 100;
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (parseFloat(taxPercent) || 0) / 100;
  const grandTotal = taxable + taxAmt;

  function updateItem(idx: number, field: keyof QuotationItem, value: any) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    next[idx].amount = (next[idx].qty || 0) * (next[idx].rate || 0);
    setItems(next);
  }

  function openAdd() {
    setEditing(null);
    setCustomerName(""); setQuoteDate(new Date().toISOString().split("T")[0]);
    const vt = new Date(); vt.setDate(vt.getDate() + 30);
    setValidTill(vt.toISOString().split("T")[0]);
    setStatus("draft"); setTerms("Payment due within 15 days of acceptance."); setDiscountPercent("0"); setTaxPercent("18");
    setItems([emptyItem()]);
    setShowForm(true);
  }

  async function openEdit(q: Quotation) {
    setEditing(q);
    setCustomerName(q.customer_name); setQuoteDate(q.quote_date || ""); setValidTill(q.valid_till || "");
    setStatus(q.status); setTerms(q.terms || ""); setDiscountPercent(String(q.discount_percent || 0)); setTaxPercent(String(q.tax_percent ?? 18));
    const supabase = createClient();
    const { data } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");
    setItems(data && data.length ? data : [emptyItem()]);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    const payload = {
      customer_name: customerName, quote_date: quoteDate || null, valid_till: validTill || null,
      status, terms, subtotal, discount_percent: parseFloat(discountPercent) || 0,
      tax_percent: parseFloat(taxPercent) || 0, total: grandTotal, company_id: profile.company_id,
    };

    let quotationId = editing?.id;
    if (editing) {
      await supabase.from("quotations").update(payload).eq("id", editing.id);
      await supabase.from("quotation_items").delete().eq("quotation_id", editing.id);
    } else {
      const number = "QTN-" + new Date().getFullYear() + "-" + String(quotations.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("quotations").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save quotation", false); setSaving(false); return; }
      quotationId = created.id;
    }

    const validItems = items.filter(it => it.item_name.trim());
    if (validItems.length && quotationId) {
      await supabase.from("quotation_items").insert(
        validItems.map((it, i) => ({
          quotation_id: quotationId, item_name: it.item_name, description: it.description,
          qty: it.qty, rate: it.rate, amount: it.qty * it.rate, sort_order: i,
        }))
      );
    }

    setShowForm(false); setSaving(false);
    showToast(editing ? "Quotation updated" : "Quotation created", true);
    fetchQuotations();
  }

  // --- Convert to Invoice (ERPNext-style conversion with link) ---
  async function convertToInvoice(q: Quotation) {
    if (!confirm("Convert quotation " + q.number + " to an invoice?")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;

    const invNumber = q.number.replace("QTN", "INV");
    const { error } = await supabase.from("invoices").insert({
      number: invNumber, client: q.customer_name, amount: q.total,
      status: "pending", due_date: q.valid_till || null, company_id: profile.company_id,
    });
    if (error) { showToast("Failed to create invoice: " + error.message, false); return; }
    await supabase.from("quotations").update({ status: "converted" }).eq("id", q.id);
    showToast("Invoice " + invNumber + " created!", true);
    fetchQuotations();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quotation?")) return;
    const supabase = createClient();
    await supabase.from("quotations").delete().eq("id", id);
    fetchQuotations();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient();
    await supabase.from("quotations").update({ status: newStatus }).eq("id", id);
    fetchQuotations();
  }

  // --- PDF Print ---
  async function printQuotation(q: Quotation) {
    const supabase = createClient();
    const { data: qItems } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const rows = (qItems || []).map(it =>
      "<tr><td>" + it.item_name + (it.description ? "<br><span style='font-size:11px;color:#888;'>" + it.description + "</span>" : "") + "</td>" +
      "<td style='text-align:center;'>" + it.qty + "</td>" +
      "<td style='text-align:right;'>INR " + Number(it.rate).toLocaleString("en-IN") + "</td>" +
      "<td style='text-align:right;'>INR " + Number(it.amount).toLocaleString("en-IN") + "</td></tr>"
    ).join("");
    const discAmt = (q.subtotal || 0) * (q.discount_percent || 0) / 100;
    const taxableAmt = (q.subtotal || 0) - discAmt;
    const taxA = taxableAmt * (q.tax_percent || 0) / 100;
    const html = "<!DOCTYPE html><html><head><title>Quotation " + q.number + "</title><style>" +
      "*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;padding:48px;background:white}" +
      ".header{display:flex;justify-content:space-between;margin-bottom:40px}.logo{font-size:28px;font-weight:800;color:#6366F1;letter-spacing:-1px}.logo span{color:#1a1a2e}" +
      ".title{text-align:right}.title h1{font-size:32px;font-weight:800;color:#6366F1}.title p{font-size:13px;color:#888;margin-top:4px}" +
      ".divider{height:2px;background:linear-gradient(90deg,#6366F1,#8B5CF6);margin-bottom:32px;border-radius:2px}" +
      ".meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:36px}.meta h3{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.meta p{font-size:15px;font-weight:500}" +
      "table{width:100%;border-collapse:collapse;margin-bottom:24px}thead tr{background:#f8f8ff}th{padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#888;text-transform:uppercase}th:nth-child(2){text-align:center}th:nth-child(3),th:nth-child(4){text-align:right}" +
      "td{padding:14px 16px;font-size:14px;border-bottom:1px solid #f0f0f0}" +
      ".totals{margin-left:auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:8px 16px;font-size:13px}.totals .grand{background:#6366F1;color:white;font-weight:700;font-size:16px;border-radius:8px;padding:12px 16px;margin-top:8px}" +
      ".terms{margin-top:36px;padding:20px;background:#f8f8ff;border-radius:12px}.terms h3{font-size:12px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:8px}.terms p{font-size:13px;color:#555;line-height:1.6}" +
      ".footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#aaa}" +
      "@media print{body{padding:24px}}</style></head><body>" +
      "<div class='header'><div class='logo'>EM<span>BORG</span></div><div class='title'><h1>QUOTATION</h1><p># " + q.number + "</p></div></div>" +
      "<div class='divider'></div>" +
      "<div class='meta'>" +
      "<div><h3>Prepared For</h3><p>" + q.customer_name + "</p></div>" +
      "<div><h3>Status</h3><p style='color:" + (STATUS_COLORS[q.status] || "#888") + ";text-transform:capitalize;'>" + q.status + "</p></div>" +
      "<div><h3>Quote Date</h3><p>" + (q.quote_date ? new Date(q.quote_date).toLocaleDateString("en-IN") : "-") + "</p></div>" +
      "<div><h3>Valid Till</h3><p>" + (q.valid_till ? new Date(q.valid_till).toLocaleDateString("en-IN") : "-") + "</p></div>" +
      "</div>" +
      "<table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      "<div class='totals'>" +
      "<div><span>Subtotal</span><span>INR " + Number(q.subtotal || 0).toLocaleString("en-IN") + "</span></div>" +
      ((q.discount_percent || 0) > 0 ? "<div><span>Discount (" + q.discount_percent + "%)</span><span>- INR " + discAmt.toLocaleString("en-IN") + "</span></div>" : "") +
      "<div><span>GST (" + (q.tax_percent || 0) + "%)</span><span>INR " + taxA.toLocaleString("en-IN") + "</span></div>" +
      "<div class='grand'><span>Grand Total</span><span>INR " + Number(q.total || 0).toLocaleString("en-IN") + "</span></div>" +
      "</div>" +
      (q.terms ? "<div class='terms'><h3>Terms and Conditions</h3><p>" + q.terms + "</p></div>" : "") +
      "<div class='footer'><p>Generated by EMBORG - Cloud ERP for SMEs | emborgerp.com</p></div>" +
      "<scr" + "ipt>window.onload=function(){window.print();}</scr" + "ipt></body></html>";
    win.document.write(html);
    win.document.close();
  }

  const isExpired = (q: Quotation) => q.valid_till && new Date(q.valid_till) < new Date() && ["draft", "sent"].includes(q.status);
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" };

  // KPIs
  const openValue = quotations.filter(q => ["draft", "sent"].includes(q.status)).reduce((s, q) => s + (q.total || 0), 0);
  const acceptedValue = quotations.filter(q => ["accepted", "converted"].includes(q.status)).reduce((s, q) => s + (q.total || 0), 0);
  const winRate = quotations.length > 0 ? Math.round((quotations.filter(q => ["accepted", "converted"].includes(q.status)).length / quotations.length) * 100) : 0;

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Quotations</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{quotations.length} total</p>
        </div>
        <button onClick={openAdd} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ New Quotation</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Open Quotes Value", value: "INR " + openValue.toLocaleString(), color: "#3B82F6" },
          { label: "Won Value", value: "INR " + acceptedValue.toLocaleString(), color: "#10B981" },
          { label: "Quote Win Rate", value: winRate + "%", color: "#8B5CF6" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p>
            <p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>{editing ? "Edit " + editing.number : "New Quotation"}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={inputStyle} />
            <input type="date" value={quoteDate} onChange={e => setQuoteDate(e.target.value)} style={inputStyle} title="Quote date" />
            <input type="date" value={validTill} onChange={e => setValidTill(e.target.value)} style={inputStyle} title="Valid till" />
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              {["draft", "sent", "accepted", "declined", "expired"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {/* Line items - ERPNext style child table */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "6px", padding: "0 4px" }}>
              {["Item", "Description", "Qty", "Rate (INR)", "Amount", ""].map(h => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "8px" }}>
                <input placeholder="Item name" value={it.item_name} onChange={e => updateItem(i, "item_name", e.target.value)} style={inputStyle} />
                <input placeholder="Description" value={it.description} onChange={e => updateItem(i, "description", e.target.value)} style={inputStyle} />
                <input type="number" min="0" step="any" value={it.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" step="any" value={it.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input value={"INR " + (it.qty * it.rate).toLocaleString()} disabled style={{ ...inputStyle, backgroundColor: "var(--bg-alt)", color: "var(--muted)" }} />
                <button type="button" onClick={() => setItems(items.length > 1 ? items.filter((_, x) => x !== i) : [emptyItem()])} style={{ border: "none", backgroundColor: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}>x</button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, emptyItem()])} style={{ padding: "7px 14px", backgroundColor: "transparent", color: "var(--accent)", border: "1px dashed var(--accent)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Line Item</button>
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", marginBottom: "16px" }}>
            <textarea placeholder="Terms and conditions" value={terms} onChange={e => setTerms(e.target.value)} rows={3} style={{ ...inputStyle, flex: "1 1 300px", resize: "vertical" }} />
            <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted)" }}>
                <span>Subtotal</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>INR {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}>
                <span>Discount %</span>
                <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} style={{ ...inputStyle, width: "80px", textAlign: "right" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}>
                <span>GST %</span>
                <input type="number" min="0" max="100" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} style={{ ...inputStyle, width: "80px", textAlign: "right" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, color: "var(--ink)", borderTop: "1px solid var(--line)", paddingTop: "8px" }}>
                <span>Grand Total</span><span style={{ color: "var(--accent)" }}>INR {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : editing ? "Update Quotation" : "Save Quotation"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : quotations.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No quotations yet. Create your first quote and send it to a customer!</p>
        </div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Quote #", "Customer", "Date", "Valid Till", "Total", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{q.number}</td>
                  <td style={{ padding: "12px", color: "var(--ink)" }}>{q.customer_name}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{q.quote_date ? new Date(q.quote_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", color: isExpired(q) ? "#EF4444" : "var(--muted)", fontWeight: isExpired(q) ? 600 : 400 }}>
                    {q.valid_till ? new Date(q.valid_till).toLocaleDateString() : "-"}{isExpired(q) ? " (expired)" : ""}
                  </td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {(q.total || 0).toLocaleString()}</td>
                  <td style={{ padding: "12px" }}>
                    <select value={q.status} onChange={e => handleStatusChange(q.id, e.target.value)} disabled={q.status === "converted"}
                      style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "1px solid " + (STATUS_COLORS[q.status] || "#6B7280"), backgroundColor: (STATUS_COLORS[q.status] || "#6B7280") + "22", color: STATUS_COLORS[q.status] || "#6B7280", cursor: q.status === "converted" ? "default" : "pointer" }}>
                      {["draft", "sent", "accepted", "declined", "expired", "converted"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(q)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => printQuotation(q)} style={{ padding: "5px 10px", backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>PDF</button>
                      {["accepted", "sent", "draft"].includes(q.status) && (
                        <button onClick={() => convertToInvoice(q)} style={{ padding: "5px 10px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>To Invoice</button>
                      )}
                      <button onClick={() => handleDelete(q.id)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "#EF4444", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
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

fs.mkdirSync("app/dashboard/quotations", { recursive: true });
fs.writeFileSync("app/dashboard/quotations/page.tsx", page, "utf8");
console.log("Done:", fs.statSync("app/dashboard/quotations/page.tsx").size, "bytes");
