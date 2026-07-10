const fs = require("fs");

// ── 1. SUPPLIERS PAGE ─────────────────────────────────────────────
const suppliers = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Supplier = { id: string; name: string; contact_person: string; email: string; phone: string; address: string; gstin: string; created_at: string; };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  useEffect(() => { fetchSuppliers(); }, []);

  async function fetchSuppliers() {
    const supabase = createClient();
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null); setName(""); setContactPerson(""); setEmail(""); setPhone(""); setAddress(""); setGstin("");
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s); setName(s.name); setContactPerson(s.contact_person || ""); setEmail(s.email || "");
    setPhone(s.phone || ""); setAddress(s.address || ""); setGstin(s.gstin || "");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    const payload = { name, contact_person: contactPerson, email, phone, address, gstin, company_id: profile.company_id };
    if (editing) await supabase.from("suppliers").update(payload).eq("id", editing.id);
    else await supabase.from("suppliers").insert(payload);

    setShowForm(false); setSaving(false); fetchSuppliers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    const supabase = createClient();
    await supabase.from("suppliers").delete().eq("id", id);
    fetchSuppliers();
  }

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Suppliers</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{suppliers.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, borderRadius: "20px", width: "200px" }} />
          <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Add Supplier</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Supplier / Company name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
          <input placeholder="Contact person" value={contactPerson} onChange={e => setContactPerson(e.target.value)} style={inputStyle} />
          <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          <input placeholder="GSTIN" value={gstin} onChange={e => setGstin(e.target.value)} style={inputStyle} />
          <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : editing ? "Update Supplier" : "Save Supplier"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No suppliers yet. Add your first vendor!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {filtered.map(s => (
            <div key={s.id} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#8B5CF622", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#8B5CF6" }}>{s.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>{s.name}</p>
                    {s.contact_person && <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{s.contact_person}</p>}
                  </div>
                </div>
              </div>
              {s.email && <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>{s.email}</p>}
              {s.phone && <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>{s.phone}</p>}
              {s.gstin && <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0" }}>GSTIN: {s.gstin}</p>}
              <div style={{ display: "flex", gap: "10px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}>Edit</button>
                <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

fs.mkdirSync("app/dashboard/suppliers", { recursive: true });
fs.writeFileSync("app/dashboard/suppliers/page.tsx", suppliers, "utf8");
console.log("Suppliers page:", fs.statSync("app/dashboard/suppliers/page.tsx").size, "bytes");

// ── 2. PURCHASE ORDERS PAGE ────────────────────────────────────────
const po = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Supplier = { id: string; name: string; };
type POItem = { id?: string; item_name: string; inventory_id: string; qty: number; received_qty: number; rate: number; amount: number; };
type PO = { id: string; number: string; supplier_id: string; supplier_name: string; order_date: string; expected_date: string; status: string; subtotal: number; tax_percent: number; total: number; created_at: string; };
type InvItem = { id: string; name: string; quantity: number; unit: string; };

const STATUS_COLORS: Record<string, string> = { draft: "#6B7280", ordered: "#3B82F6", partially_received: "#F59E0B", received: "#10B981", cancelled: "#EF4444" };

function emptyItem(): POItem { return { item_name: "", inventory_id: "", qty: 1, received_qty: 0, rate: 0, amount: 0 }; }

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PO | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [taxPercent, setTaxPercent] = useState("18");
  const [items, setItems] = useState<POItem[]>([emptyItem()]);

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [ordersRes, supRes, invRes] = await Promise.all([
      supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("inventory").select("id, name, quantity, unit").order("name"),
    ]);
    setOrders(ordersRes.data || []);
    setSuppliers(supRes.data || []);
    setInvItems(invRes.data || []);
    setLoading(false);
  }

  const subtotal = items.reduce((s, it) => s + (it.qty * it.rate), 0);
  const taxAmt = subtotal * (parseFloat(taxPercent) || 0) / 100;
  const grandTotal = subtotal + taxAmt;

  function updateItem(idx: number, field: keyof POItem, value: any) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    if (field === "inventory_id") {
      const inv = invItems.find(i => i.id === value);
      if (inv) next[idx].item_name = inv.name;
    }
    next[idx].amount = (next[idx].qty || 0) * (next[idx].rate || 0);
    setItems(next);
  }

  function openAdd() {
    setEditing(null); setSupplierId(""); setOrderDate(new Date().toISOString().split("T")[0]);
    const ed = new Date(); ed.setDate(ed.getDate() + 14);
    setExpectedDate(ed.toISOString().split("T")[0]);
    setStatus("draft"); setTaxPercent("18"); setItems([emptyItem()]);
    setShowForm(true);
  }

  async function openEdit(po: PO) {
    setEditing(po); setSupplierId(po.supplier_id || ""); setOrderDate(po.order_date || ""); setExpectedDate(po.expected_date || "");
    setStatus(po.status); setTaxPercent(String(po.tax_percent ?? 18));
    const supabase = createClient();
    const { data } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", po.id).order("sort_order");
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

    const supplier = suppliers.find(s => s.id === supplierId);
    const payload = {
      supplier_id: supplierId || null, supplier_name: supplier?.name || "Unknown", order_date: orderDate || null,
      expected_date: expectedDate || null, status, subtotal, tax_percent: parseFloat(taxPercent) || 0, total: grandTotal, company_id: profile.company_id,
    };

    let poId = editing?.id;
    if (editing) {
      await supabase.from("purchase_orders").update(payload).eq("id", editing.id);
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", editing.id);
    } else {
      const number = "PO-" + new Date().getFullYear() + "-" + String(orders.length + 1).padStart(4, "0");
      const { data: created, error } = await supabase.from("purchase_orders").insert({ ...payload, number }).select().single();
      if (error || !created) { showToast("Failed to save PO", false); setSaving(false); return; }
      poId = created.id;
    }

    const validItems = items.filter(it => it.item_name.trim());
    if (validItems.length && poId) {
      await supabase.from("purchase_order_items").insert(
        validItems.map((it, i) => ({
          purchase_order_id: poId, item_name: it.item_name, inventory_id: it.inventory_id || null,
          qty: it.qty, received_qty: it.received_qty || 0, rate: it.rate, amount: it.qty * it.rate, sort_order: i,
        }))
      );
    }

    setShowForm(false); setSaving(false);
    showToast(editing ? "Purchase order updated" : "Purchase order created", true);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase order?")) return;
    const supabase = createClient();
    await supabase.from("purchase_orders").delete().eq("id", id);
    fetchAll();
  }

  // --- Receive Stock (ERPNext Purchase Receipt concept, simplified) ---
  async function openReceive(po: PO) {
    const supabase = createClient();
    const { data } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", po.id);
    const qtys: Record<string, number> = {};
    (data || []).forEach((it: any) => { qtys[it.id] = it.qty - (it.received_qty || 0); });
    setReceiveQtys(qtys);
    setReceivingId(po.id);
  }

  async function confirmReceive(po: PO) {
    const supabase = createClient();
    const { data: poItems } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", po.id);
    if (!poItems) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user!.id).single();

    let allReceived = true;
    for (const item of poItems) {
      const receiveNow = receiveQtys[item.id] || 0;
      if (receiveNow <= 0) { if ((item.received_qty || 0) < item.qty) allReceived = false; continue; }

      const newReceivedQty = (item.received_qty || 0) + receiveNow;
      await supabase.from("purchase_order_items").update({ received_qty: newReceivedQty }).eq("id", item.id);
      if (newReceivedQty < item.qty) allReceived = false;

      if (item.inventory_id) {
        const { data: invItem } = await supabase.from("inventory").select("quantity").eq("id", item.inventory_id).single();
        const newBalance = (invItem?.quantity || 0) + receiveNow;
        await supabase.from("inventory").update({ quantity: newBalance }).eq("id", item.inventory_id);
        await supabase.from("stock_ledger_entries").insert({
          company_id: profile?.company_id, inventory_id: item.inventory_id, item_name: item.item_name,
          entry_type: "purchase_receipt", qty_change: receiveNow, balance_after: newBalance,
          reference_type: "purchase_order", reference_id: po.id, notes: "Received against " + po.number,
        });
      }
    }

    await supabase.from("purchase_orders").update({ status: allReceived ? "received" : "partially_received" }).eq("id", po.id);
    setReceivingId(null);
    showToast("Stock received and inventory updated!", true);
    fetchAll();
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" };

  const openValue = orders.filter(o => ["draft", "ordered"].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0);
  const receivedValue = orders.filter(o => o.status === "received").reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Purchase Orders</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{orders.length} total</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ New Purchase Order</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[{ label: "Open POs Value", value: "INR " + openValue.toLocaleString(), color: "#3B82F6" }, { label: "Received Value", value: "INR " + receivedValue.toLocaleString(), color: "#10B981" }].map(k => (
          <div key={k.label} style={cardStyle}><p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p><p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p></div>
        ))}
      </div>

      {suppliers.length === 0 && !showForm && (
        <div style={{ ...cardStyle, marginBottom: "20px", backgroundColor: "#F59E0B11", border: "1px solid #F59E0B44" }}>
          <p style={{ fontSize: "13px", color: "#F59E0B", margin: 0, fontWeight: 600 }}>No suppliers yet. <a href="/dashboard/suppliers" style={{ color: "#F59E0B", textDecoration: "underline" }}>Add a supplier first</a> before creating a purchase order.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>{editing ? "Edit " + editing.number : "New Purchase Order"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required style={inputStyle}>
              <option value="">Select supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={inputStyle} title="Order date" />
            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} style={inputStyle} title="Expected date" />
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              {["draft", "ordered", "cancelled"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "6px", padding: "0 4px" }}>
              {["Item (from Inventory)", "Qty", "Rate (INR)", "Amount", ""].map(h => <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</span>)}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 70px 110px 110px 32px", gap: "8px", marginBottom: "8px" }}>
                <select value={it.inventory_id} onChange={e => updateItem(i, "inventory_id", e.target.value)} style={inputStyle}>
                  <option value="">Select item...</option>
                  {invItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (current: {inv.quantity} {inv.unit})</option>)}
                </select>
                <input type="number" min="0" step="any" value={it.qty} onChange={e => updateItem(i, "qty", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" step="any" value={it.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input value={"INR " + (it.qty * it.rate).toLocaleString()} disabled style={{ ...inputStyle, backgroundColor: "var(--bg-alt)", color: "var(--muted)" }} />
                <button type="button" onClick={() => setItems(items.length > 1 ? items.filter((_, x) => x !== i) : [emptyItem()])} style={{ border: "none", backgroundColor: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}>x</button>
              </div>
            ))}
            <button type="button" onClick={() => setItems([...items, emptyItem()])} style={{ padding: "7px 14px", backgroundColor: "transparent", color: "var(--accent)", border: "1px dashed var(--accent)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Line Item</button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--muted)" }}><span>Subtotal</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>INR {subtotal.toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--muted)" }}><span>GST %</span><input type="number" min="0" max="100" value={taxPercent} onChange={e => setTaxPercent(e.target.value)} style={{ ...inputStyle, width: "80px", textAlign: "right" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 700, color: "var(--ink)", borderTop: "1px solid var(--line)", paddingTop: "8px" }}><span>Grand Total</span><span style={{ color: "var(--accent)" }}>INR {grandTotal.toLocaleString()}</span></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : editing ? "Update PO" : "Save Purchase Order"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : orders.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No purchase orders yet.</p></div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["PO #", "Supplier", "Order Date", "Expected", "Total", "Status", "Actions"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map(po => (
                <tr key={po.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{po.number}</td>
                  <td style={{ padding: "12px", color: "var(--ink)" }}>{po.supplier_name}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{po.order_date ? new Date(po.order_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {(po.total || 0).toLocaleString()}</td>
                  <td style={{ padding: "12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: (STATUS_COLORS[po.status] || "#6B7280") + "22", color: STATUS_COLORS[po.status] || "#6B7280" }}>{po.status.replace("_", " ").toUpperCase()}</span></td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(po)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      {["ordered", "partially_received"].includes(po.status) && <button onClick={() => openReceive(po)} style={{ padding: "5px 10px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Receive Stock</button>}
                      <button onClick={() => handleDelete(po.id)} style={{ padding: "5px 10px", backgroundColor: "transparent", color: "#EF4444", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Stock Modal */}
      {receivingId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}>
          <div style={{ ...cardStyle, width: "480px", maxWidth: "90vw" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Receive Stock</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>Enter quantities received. Inventory will update automatically.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {Object.keys(receiveQtys).map(itemId => (
                <div key={itemId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--ink)" }}>Item</span>
                  <input type="number" min="0" value={receiveQtys[itemId]} onChange={e => setReceiveQtys({ ...receiveQtys, [itemId]: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, width: "100px" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { const po = orders.find(o => o.id === receivingId); if (po) confirmReceive(po); }} style={{ flex: 1, padding: "11px", backgroundColor: "#10B981", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Confirm Receipt</button>
              <button onClick={() => setReceivingId(null)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.mkdirSync("app/dashboard/purchase-orders", { recursive: true });
fs.writeFileSync("app/dashboard/purchase-orders/page.tsx", po, "utf8");
console.log("Purchase Orders page:", fs.statSync("app/dashboard/purchase-orders/page.tsx").size, "bytes");
