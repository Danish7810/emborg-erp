"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type SOItem = { id?: string; item_name: string; description: string; qty: number; delivered_qty: number; rate: number; amount: number; inventory_id: string; };
type SalesOrder = {
  id: string; number: string; quotation_id: string; customer_name: string; order_date: string;
  delivery_date: string; status: string; subtotal: number; discount_percent: number; tax_percent: number;
  total: number; po_reference: string; notes: string; invoiced: boolean; created_at: string;
};
type Quotation = { id: string; number: string; customer_name: string; status: string; subtotal: number; discount_percent: number; tax_percent: number; total: number; };
type InvItem = { id: string; name: string; quantity: number; unit: string; };

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280", confirmed: "#3B82F6", in_progress: "#F59E0B", completed: "#10B981", cancelled: "#EF4444",
};

function emptyItem(): SOItem { return { item_name: "", description: "", qty: 1, delivered_qty: 0, rate: 0, amount: 0, inventory_id: "" }; }

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState<Quotation[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [deliverQtys, setDeliverQtys] = useState<Record<string, number>>({});
  const [fulfillSaving, setFulfillSaving] = useState(false);

  const [fromQuotationId, setFromQuotationId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [poReference, setPoReference] = useState("");
  const [notes, setNotes] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxPercent, setTaxPercent] = useState("18");
  const [items, setItems] = useState<SOItem[]>([emptyItem()]);

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [ordersRes, quotesRes, invRes] = await Promise.all([
      supabase.from("sales_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("quotations").select("id, number, customer_name, status, subtotal, discount_percent, tax_percent, total").in("status", ["accepted", "sent"]),
      supabase.from("inventory").select("id, name, quantity, unit").order("name"),
    ]);
    setOrders(ordersRes.data || []);
    setAcceptedQuotes(quotesRes.data || []);
    setInvItems(invRes.data || []);
    setLoading(false);
  }

  const subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  const discountAmt = subtotal * (parseFloat(discountPercent) || 0) / 100;
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (parseFloat(taxPercent) || 0) / 100;
  const grandTotal = taxable + taxAmt;

  function updateItem(idx: number, field: keyof SOItem, value: any) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    if (field === "inventory_id" && value) {
      const inv = invItems.find(i => i.id === value);
      if (inv) next[idx].item_name = inv.name;
    }
    next[idx].amount = (next[idx].qty || 0) * (next[idx].rate || 0);
    setItems(next);
  }

  function openAdd() {
    setEditing(null); setFromQuotationId(""); setCustomerName(""); setOrderDate(new Date().toISOString().split("T")[0]);
    const dd = new Date(); dd.setDate(dd.getDate() + 7);
    setDeliveryDate(dd.toISOString().split("T")[0]);
    setStatus("draft"); setPoReference(""); setNotes(""); setDiscountPercent("0"); setTaxPercent("18");
    setItems([emptyItem()]);
    setShowForm(true);
  }

  async function loadFromQuotation(quotationId: string) {
    setFromQuotationId(quotationId);
    if (!quotationId) return;
    const q = acceptedQuotes.find(qq => qq.id === quotationId);
    if (!q) return;
    setCustomerName(q.customer_name);
    setDiscountPercent(String(q.discount_percent || 0));
    setTaxPercent(String(q.tax_percent ?? 18));
    const supabase = createClient();
    const { data } = await supabase.from("quotation_items").select("*").eq("quotation_id", quotationId).order("sort_order");
    if (data && data.length) {
      setItems(data.map((it: any) => ({ item_name: it.item_name, description: it.description || "", qty: it.qty, delivered_qty: 0, rate: it.rate, amount: it.amount, inventory_id: it.inventory_id || "" })));
    }
  }

  async function openEdit(so: SalesOrder) {
    setEditing(so); setFromQuotationId(so.quotation_id || ""); setCustomerName(so.customer_name);
    setOrderDate(so.order_date || ""); setDeliveryDate(so.delivery_date || ""); setStatus(so.status);
    setPoReference(so.po_reference || ""); setNotes(so.notes || "");
    setDiscountPercent(String(so.discount_percent || 0)); setTaxPercent(String(so.tax_percent ?? 18));
    const supabase = createClient();
    const { data } = await supabase.from("sales_order_items").select("*").eq("sales_order_id", so.id).order("sort_order");
    setItems(data && data.length ? data : [emptyItem()]);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    const payload = {
      customer_name: customerName, quotation_id: fromQuotationId || null, order_date: orderDate || null,
      delivery_date: deliveryDate || null, status, po_reference: poReference, notes,
      subtotal, discount_percent: parseFloat(discountPercent) || 0, tax_percent: parseFloat(taxPercent) || 0,
      total: grandTotal, company_id: profile.company_id,
    };

    let soId = editing?.id;
    if (editing) {
      await supabase.from("sales_orders").update(payload).eq("id", editing.id);
      await supabase.from("sales_order_items").delete().eq("sales_order_id", editing.id);
    } else {
      const number = "SO-" + new Date().getFullYear() + "-" + String(orders.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("sales_orders").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save sales order", false); setSaving(false); return; }
      soId = created.id;
      if (fromQuotationId) {
        await supabase.from("quotations").update({ status: "converted" }).eq("id", fromQuotationId);
      }
    }

    const validItems = items.filter(it => it.item_name.trim());
    if (validItems.length && soId) {
      await supabase.from("sales_order_items").insert(
        validItems.map((it, i) => ({
          sales_order_id: soId, item_name: it.item_name, description: it.description,
          qty: it.qty, delivered_qty: it.delivered_qty || 0, rate: it.rate, amount: it.qty * it.rate, sort_order: i,
          inventory_id: it.inventory_id || null,
        }))
      );
    }

    setShowForm(false); setSaving(false);
    showToast(editing ? "Sales order updated" : "Sales order created", true);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sales order?")) return;
    const supabase = createClient();
    await supabase.from("sales_orders").delete().eq("id", id);
    fetchAll();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient();
    await supabase.from("sales_orders").update({ status: newStatus }).eq("id", id);
    fetchAll();
  }

  async function openFulfill(so: SalesOrder) {
    const supabase = createClient();
    const { data } = await supabase.from("sales_order_items").select("*").eq("sales_order_id", so.id);
    const qtys: Record<string, number> = {};
    (data || []).forEach((it: any) => { qtys[it.id] = it.qty - (it.delivered_qty || 0); });
    setDeliverQtys(qtys);
    setFulfillingId(so.id);
  }

  async function confirmFulfill(so: SalesOrder) {
    if (fulfillSaving) return;
    setFulfillSaving(true);
    const supabase = createClient();
    const { data: soItems } = await supabase.from("sales_order_items").select("*").eq("sales_order_id", so.id);
    if (!soItems) { setFulfillSaving(false); return; }

    let allDelivered = true;
    for (const item of soItems) {
      const deliverNow = deliverQtys[item.id] || 0;
      const newDelivered = (item.delivered_qty || 0) + deliverNow;
      if (deliverNow > 0) await supabase.from("sales_order_items").update({ delivered_qty: newDelivered }).eq("id", item.id);
      if (newDelivered < item.qty) allDelivered = false;
    }

    await supabase.from("sales_orders").update({ status: allDelivered ? "completed" : "in_progress" }).eq("id", so.id);
    setFulfillingId(null);
    setFulfillSaving(false);
    showToast("Fulfillment updated!", true);
    fetchAll();
  }

  async function createInvoice(so: SalesOrder) {
    if (!confirm("Create invoice for " + so.number + "?")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) return;

    const invNumber = so.number.replace("SO", "INV");
    const { error } = await supabase.from("invoices").insert({
      invoice_number: invNumber, client_name: so.customer_name, amount: so.total,
      status: "sent", due_date: so.delivery_date || null, company_id: profile.company_id,
    });
    if (error) { showToast("Failed to create invoice: " + error.message, false); return; }
    await supabase.from("sales_orders").update({ invoiced: true }).eq("id", so.id);
    showToast("Invoice " + invNumber + " created!", true);
    fetchAll();
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" };

  const pendingValue = orders.filter(o => !o.invoiced && o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const completedCount = orders.filter(o => o.status === "completed").length;

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Sales Orders</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{orders.length} total &middot; Quotation &rarr; Sales Order &rarr; Invoice</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ New Sales Order</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[{ label: "Pending Value", value: "INR " + pendingValue.toLocaleString(), color: "#3B82F6" }, { label: "Completed Orders", value: String(completedCount), color: "#10B981" }].map(k => (
          <div key={k.label} style={cardStyle}><p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p><p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p></div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>{editing ? "Edit " + editing.number : "New Sales Order"}</h3>

          {!editing && acceptedQuotes.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>Convert from Quotation (optional)</label>
              <select value={fromQuotationId} onChange={e => loadFromQuotation(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="">Start from scratch</option>
                {acceptedQuotes.map(q => <option key={q.id} value={q.id}>{q.number} - {q.customer_name} (INR {q.total.toLocaleString()})</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={inputStyle} />
            <input placeholder="Customer PO # (optional)" value={poReference} onChange={e => setPoReference(e.target.value)} style={inputStyle} />
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={inputStyle} title="Order date" />
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={inputStyle} title="Expected delivery" />
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              {["draft", "confirmed", "cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 2fr 2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "6px", padding: "0 4px" }}>
              {["Catalog Link", "Item", "Description", "Qty", "Rate (INR)", "Amount", ""].map(h => <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</span>)}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 2fr 2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "8px" }}>
                <select value={it.inventory_id} onChange={e => updateItem(i, "inventory_id", e.target.value)} style={inputStyle} title="Optionally link to an inventory item">
                  <option value="">Custom item</option>
                  {invItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (stock: {inv.quantity} {inv.unit})</option>)}
                </select>
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

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", marginBottom: "16px" }}>
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, flex: "1 1 300px", resize: "vertical" }} />
            <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted)" }}><span>Subtotal</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>INR {subtotal.toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}><span>Discount %</span><input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} style={{ ...inputStyle, width: "80px", textAlign: "right" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}><span>GST %</span><input type="number" min="0" max="100" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} style={{ ...inputStyle, width: "80px", textAlign: "right" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, color: "var(--ink)", borderTop: "1px solid var(--line)", paddingTop: "8px" }}><span>Grand Total</span><span style={{ color: "var(--accent)" }}>INR {grandTotal.toLocaleString()}</span></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : editing ? "Update Order" : "Save Sales Order"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : orders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No sales orders yet. Convert an accepted quotation or create one from scratch.</p></div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Order #", "Customer", "Order Date", "Delivery", "Total", "Status", "Actions"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map(so => (
                <tr key={so.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{so.number}</td>
                  <td style={{ padding: "12px", color: "var(--ink)" }}>{so.customer_name}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{so.order_date ? new Date(so.order_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{so.delivery_date ? new Date(so.delivery_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {(so.total || 0).toLocaleString()}</td>
                  <td style={{ padding: "12px" }}>
                    <select value={so.status} onChange={e => handleStatusChange(so.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "1px solid " + (STATUS_COLORS[so.status] || "#6B7280"), backgroundColor: (STATUS_COLORS[so.status] || "#6B7280") + "22", color: STATUS_COLORS[so.status] || "#6B7280" }}>
                      {["draft", "confirmed", "in_progress", "completed", "cancelled"].map(s => <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(so)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      {["confirmed", "in_progress"].includes(so.status) && <button onClick={() => openFulfill(so)} style={{ padding: "5px 10px", backgroundColor: "#F59E0B", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Fulfill</button>}
                      {!so.invoiced && ["confirmed", "in_progress", "completed"].includes(so.status) && <button onClick={() => createInvoice(so)} style={{ padding: "5px 10px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Create Invoice</button>}
                      {so.invoiced && <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 600, padding: "5px 4px" }}>Invoiced</span>}
                      <button onClick={() => handleDelete(so.id)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "#EF4444", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fulfillingId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
          <div style={{ ...cardStyle, width: "480px", maxWidth: "90vw" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Update Fulfillment</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Enter quantities delivered/fulfilled to the customer.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {Object.keys(deliverQtys).map(itemId => (
                <div key={itemId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--ink)" }}>Item</span>
                  <input type="number" min="0" value={deliverQtys[itemId]} onChange={e => setDeliverQtys({ ...deliverQtys, [itemId]: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, width: "100px" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { const so = orders.find(o => o.id === fulfillingId); if (so) confirmFulfill(so); }} disabled={fulfillSaving} style={{ flex: 1, padding: "11px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: fulfillSaving ? 0.6 : 1 }}>{fulfillSaving ? "Updating..." : "Confirm Fulfillment"}</button>
              <button onClick={() => setFulfillingId(null)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
