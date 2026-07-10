"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type DNItem = { id?: string; item_name: string; inventory_id: string; qty: number; };
type DeliveryNote = {
  id: string; number: string; sales_order_id: string; customer_name: string; delivery_date: string;
  status: string; vehicle_number: string; driver_name: string; notes: string; created_at: string;
};
type SalesOrder = { id: string; number: string; customer_name: string; status: string; delivery_date: string; };
type InvItem = { id: string; name: string; quantity: number; unit: string; };

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280", dispatched: "#F59E0B", delivered: "#10B981", returned: "#EF4444", cancelled: "#EF4444",
};

function emptyItem(): DNItem { return { item_name: "", inventory_id: "", qty: 1 }; }

export default function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [fromSOId, setFromSOId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [items, setItems] = useState<DNItem[]>([emptyItem()]);

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [dnRes, soRes, invRes] = await Promise.all([
      supabase.from("delivery_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("sales_orders").select("id, number, customer_name, status, delivery_date").in("status", ["confirmed", "in_progress"]),
      supabase.from("inventory").select("id, name, quantity, unit").order("name"),
    ]);
    setNotes(dnRes.data || []);
    setSalesOrders(soRes.data || []);
    setInvItems(invRes.data || []);
    setLoading(false);
  }

  function updateItem(idx: number, field: keyof DNItem, value: any) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    if (field === "inventory_id") {
      const inv = invItems.find(i => i.id === value);
      if (inv) next[idx].item_name = inv.name;
    }
    setItems(next);
  }

  function openAdd() {
    setEditing(null); setFromSOId(""); setCustomerName(""); setDeliveryDate(new Date().toISOString().split("T")[0]);
    setStatus("draft"); setVehicleNumber(""); setDriverName(""); setNoteText(""); setItems([emptyItem()]);
    setShowForm(true);
  }

  async function loadFromSO(soId: string) {
    setFromSOId(soId);
    if (!soId) return;
    const so = salesOrders.find(s => s.id === soId);
    if (!so) return;
    setCustomerName(so.customer_name);
    if (so.delivery_date) setDeliveryDate(so.delivery_date);
    const supabase = createClient();
    const { data } = await supabase.from("sales_order_items").select("*").eq("sales_order_id", soId).order("sort_order");
    if (data && data.length) {
      setItems(data.map((it: any) => ({ item_name: it.item_name, inventory_id: it.inventory_id || "", qty: it.qty - (it.delivered_qty || 0) })).filter((it: DNItem) => it.qty > 0));
    }
  }

  async function openEdit(dn: DeliveryNote) {
    setEditing(dn); setFromSOId(dn.sales_order_id || ""); setCustomerName(dn.customer_name);
    setDeliveryDate(dn.delivery_date || ""); setStatus(dn.status); setVehicleNumber(dn.vehicle_number || "");
    setDriverName(dn.driver_name || ""); setNoteText(dn.notes || "");
    const supabase = createClient();
    const { data } = await supabase.from("delivery_note_items").select("*").eq("delivery_note_id", dn.id).order("sort_order");
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
      customer_name: customerName, sales_order_id: fromSOId || null, delivery_date: deliveryDate || null,
      status, vehicle_number: vehicleNumber, driver_name: driverName, notes: noteText, company_id: profile.company_id,
    };

    let dnId = editing?.id;
    if (editing) {
      await supabase.from("delivery_notes").update(payload).eq("id", editing.id);
      await supabase.from("delivery_note_items").delete().eq("delivery_note_id", editing.id);
    } else {
      const number = "DN-" + new Date().getFullYear() + "-" + String(notes.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("delivery_notes").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save delivery note", false); setSaving(false); return; }
      dnId = created.id;
    }

    const validItems = items.filter(it => it.item_name.trim());
    if (validItems.length && dnId) {
      await supabase.from("delivery_note_items").insert(
        validItems.map((it, i) => ({ delivery_note_id: dnId, item_name: it.item_name, inventory_id: it.inventory_id || null, qty: it.qty, sort_order: i }))
      );
    }

    setShowForm(false); setSaving(false);
    showToast(editing ? "Delivery note updated" : "Delivery note created", true);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this delivery note?")) return;
    const supabase = createClient();
    await supabase.from("delivery_notes").delete().eq("id", id);
    fetchAll();
  }

  async function handleDispatch(dn: DeliveryNote) {
    if (dispatchingId) return;
    if (!confirm("Dispatch " + dn.number + "? This will deduct stock from Inventory.")) return;
    setDispatchingId(dn.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user!.id).single();
    const { data: dnItems } = await supabase.from("delivery_note_items").select("*").eq("delivery_note_id", dn.id);
    if (!dnItems) { setDispatchingId(null); return; }

    for (const item of dnItems) {
      if (!item.inventory_id) continue;
      const { data: invItem } = await supabase.from("inventory").select("quantity").eq("id", item.inventory_id).single();
      const currentQty = invItem?.quantity || 0;
      if (item.qty > currentQty) {
        showToast("Warning: dispatching " + item.qty + " but only " + currentQty + " in stock for " + item.item_name, false);
      }
      // Deduct only what's actually available; the ledger must record the real delta so
      // balance_after stays reconciled with qty_change even when a dispatch is over-requested.
      const deductQty = Math.min(item.qty, currentQty);
      const newBalance = currentQty - deductQty;
      await supabase.from("inventory").update({ quantity: newBalance }).eq("id", item.inventory_id);
      await supabase.from("stock_ledger_entries").insert({
        company_id: profile?.company_id, inventory_id: item.inventory_id, item_name: item.item_name,
        entry_type: "sale", qty_change: -deductQty, balance_after: newBalance,
        reference_type: "delivery_note", reference_id: dn.id, notes: "Dispatched via " + dn.number,
      });
    }

    await supabase.from("delivery_notes").update({ status: "dispatched" }).eq("id", dn.id);
    setDispatchingId(null);
    showToast("Dispatched! Stock updated.", true);
    fetchAll();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    // "dispatched" carries a stock-deduction side effect that must go through handleDispatch's
    // logic (and its over-request warning) rather than a raw status write, or inventory silently
    // desyncs from what the document claims happened.
    if (newStatus === "dispatched") {
      const dn = notes.find(n => n.id === id);
      if (dn && dn.status === "draft") { handleDispatch(dn); return; }
    }
    const supabase = createClient();
    await supabase.from("delivery_notes").update({ status: newStatus }).eq("id", id);
    fetchAll();
  }

  async function printSlip(dn: DeliveryNote) {
    const supabase = createClient();
    const { data: dnItems } = await supabase.from("delivery_note_items").select("*").eq("delivery_note_id", dn.id).order("sort_order");
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const rows = (dnItems || []).map((it: any) => "<tr><td>" + it.item_name + "</td><td style='text-align:center;'>" + it.qty + "</td></tr>").join("");
    const html = "<!DOCTYPE html><html><head><title>Delivery Note " + dn.number + "</title><style>" +
      "*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;padding:48px;background:white}" +
      ".header{display:flex;justify-content:space-between;margin-bottom:40px}.logo{font-size:28px;font-weight:800;color:#6366F1;letter-spacing:-1px}.logo span{color:#1a1a2e}" +
      ".title{text-align:right}.title h1{font-size:30px;font-weight:800;color:#6366F1}.title p{font-size:13px;color:#888;margin-top:4px}" +
      ".divider{height:2px;background:linear-gradient(90deg,#6366F1,#8B5CF6);margin-bottom:32px;border-radius:2px}" +
      ".meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px}.meta h3{font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}.meta p{font-size:14px;font-weight:500}" +
      "table{width:100%;border-collapse:collapse;margin-bottom:48px}thead tr{background:#f8f8ff}th{padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#888;text-transform:uppercase}th:nth-child(2){text-align:center}td{padding:14px 16px;font-size:14px;border-bottom:1px solid #f0f0f0}" +
      ".signatures{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:60px}.sig-box{border-top:1px solid #ccc;padding-top:8px;font-size:12px;color:#888;text-align:center}" +
      ".footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:12px;color:#aaa}" +
      "@media print{body{padding:24px}}</style></head><body>" +
      "<div class='header'><div class='logo'>EM<span>BORG</span></div><div class='title'><h1>DELIVERY NOTE</h1><p># " + dn.number + "</p></div></div>" +
      "<div class='divider'></div>" +
      "<div class='meta'>" +
      "<div><h3>Delivered To</h3><p>" + dn.customer_name + "</p></div>" +
      "<div><h3>Delivery Date</h3><p>" + (dn.delivery_date ? new Date(dn.delivery_date).toLocaleDateString("en-IN") : "-") + "</p></div>" +
      "<div><h3>Vehicle Number</h3><p>" + (dn.vehicle_number || "-") + "</p></div>" +
      "<div><h3>Driver Name</h3><p>" + (dn.driver_name || "-") + "</p></div>" +
      "</div>" +
      "<table><thead><tr><th>Item</th><th>Quantity</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      "<div class='signatures'><div class='sig-box'>Dispatched By</div><div class='sig-box'>Received By (Customer Signature)</div></div>" +
      "<div class='footer'><p>Generated by EMBORG - Cloud ERP for SMEs | emborgerp.com</p></div>" +
      "<scr" + "ipt>window.onload=function(){window.print();}</scr" + "ipt></body></html>";
    win.document.write(html);
    win.document.close();
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" };

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Delivery Notes</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{notes.length} total &middot; Dispatch and proof of delivery</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ New Delivery Note</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>{editing ? "Edit " + editing.number : "New Delivery Note"}</h3>

          {!editing && salesOrders.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: "6px" }}>Create from Sales Order (optional)</label>
              <select value={fromSOId} onChange={e => loadFromSO(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="">Start from scratch</option>
                {salesOrders.map(so => <option key={so.id} value={so.id}>{so.number} - {so.customer_name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={inputStyle} />
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={inputStyle} title="Delivery date" />
            <input placeholder="Vehicle number" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} style={inputStyle} />
            <input placeholder="Driver name" value={driverName} onChange={e => setDriverName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 32px", gap: "8px", marginBottom: "6px", padding: "0 4px" }}>
              {["Item (from Inventory)", "Qty", ""].map(h => <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</span>)}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 100px 32px", gap: "8px", marginBottom: "8px" }}>
                <select value={it.inventory_id} onChange={e => updateItem(i, "inventory_id", e.target.value)} style={inputStyle}>
                  <option value="">Select item...</option>
                  {invItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (stock: {inv.quantity} {inv.unit})</option>)}
                </select>
                <input type="number" min="0" step="any" value={it.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <button type="button" onClick={() => setItems(items.length > 1 ? items.filter((_, x) => x !== i) : [emptyItem()])} style={{ border: "none", backgroundColor: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}>x</button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, emptyItem()])} style={{ padding: "7px 14px", backgroundColor: "transparent", color: "var(--accent)", border: "1px dashed var(--accent)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Line Item</button>
          </div>

          <textarea placeholder="Notes" value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} style={{ ...inputStyle, width: "100%", resize: "vertical", marginBottom: "16px" }} />

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : editing ? "Update" : "Save Delivery Note"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : notes.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No delivery notes yet.</p></div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["DN #", "Customer", "Delivery Date", "Vehicle", "Status", "Actions"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {notes.map(dn => (
                <tr key={dn.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{dn.number}</td>
                  <td style={{ padding: "12px", color: "var(--ink)" }}>{dn.customer_name}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{dn.delivery_date ? new Date(dn.delivery_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{dn.vehicle_number || "-"}</td>
                  <td style={{ padding: "12px" }}>
                    <select value={dn.status} onChange={e => handleStatusChange(dn.id, e.target.value)} disabled={dispatchingId === dn.id} style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, border: "1px solid " + (STATUS_COLORS[dn.status] || "#6B7280"), backgroundColor: (STATUS_COLORS[dn.status] || "#6B7280") + "22", color: STATUS_COLORS[dn.status] || "#6B7280" }}>
                      {["draft", "dispatched", "delivered", "returned", "cancelled"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(dn)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      {dn.status === "draft" && <button onClick={() => handleDispatch(dn)} disabled={dispatchingId === dn.id} style={{ padding: "5px 10px", backgroundColor: "#F59E0B", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", opacity: dispatchingId === dn.id ? 0.6 : 1 }}>{dispatchingId === dn.id ? "Dispatching..." : "Dispatch"}</button>}
                      <button onClick={() => printSlip(dn)} style={{ padding: "5px 10px", backgroundColor: "#6366F1", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Print Slip</button>
                      <button onClick={() => handleDelete(dn.id)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "#EF4444", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
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
