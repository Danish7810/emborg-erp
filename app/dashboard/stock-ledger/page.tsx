"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type LedgerEntry = {
  id: string; inventory_id: string; item_name: string; entry_type: string;
  qty_change: number; balance_after: number; reference_type: string; reference_id: string;
  notes: string; created_at: string;
};
type InvItem = { id: string; name: string; quantity: number; unit: string; };

const ENTRY_LABELS: Record<string, string> = {
  purchase_receipt: "Purchase Receipt", sale: "Sale", adjustment_in: "Adjustment (In)",
  adjustment_out: "Adjustment (Out)", opening: "Opening Stock",
};
const ENTRY_COLORS: Record<string, string> = {
  purchase_receipt: "#10B981", sale: "#3B82F6", adjustment_in: "#8B5CF6",
  adjustment_out: "#EF4444", opening: "#6B7280",
};

export default function StockLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterItem, setFilterItem] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [adjInventoryId, setAdjInventoryId] = useState("");
  const [adjDirection, setAdjDirection] = useState<"in" | "out">("in");
  const [adjQty, setAdjQty] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [entriesRes, invRes] = await Promise.all([
      supabase.from("stock_ledger_entries").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("inventory").select("id, name, quantity, unit").order("name"),
    ]);
    setEntries(entriesRes.data || []);
    setInvItems(invRes.data || []);
    setLoading(false);
  }

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjInventoryId || !adjQty || parseFloat(adjQty) <= 0) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    const item = invItems.find(i => i.id === adjInventoryId);
    if (!item) { setSaving(false); return; }

    const qtyNum = parseFloat(adjQty);
    const change = adjDirection === "in" ? qtyNum : -qtyNum;
    const newBalance = item.quantity + change;

    if (newBalance < 0) { showToast("Cannot reduce stock below zero.", false); setSaving(false); return; }

    await supabase.from("inventory").update({ quantity: newBalance }).eq("id", adjInventoryId);
    await supabase.from("stock_ledger_entries").insert({
      company_id: profile.company_id, inventory_id: adjInventoryId, item_name: item.name,
      entry_type: adjDirection === "in" ? "adjustment_in" : "adjustment_out",
      qty_change: change, balance_after: newBalance, reference_type: "manual", notes: adjNotes || null,
    });

    setShowForm(false); setSaving(false); setAdjInventoryId(""); setAdjQty(""); setAdjNotes(""); setAdjDirection("in");
    showToast("Stock adjustment recorded", true);
    fetchAll();
  }

  const filtered = filterItem ? entries.filter(e => e.inventory_id === filterItem) : entries;

  const totalIn = entries.filter(e => e.qty_change > 0).reduce((s, e) => s + e.qty_change, 0);
  const totalOut = entries.filter(e => e.qty_change < 0).reduce((s, e) => s + Math.abs(e.qty_change), 0);
  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" };

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Stock Ledger</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Full audit trail of every stock movement</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Manual Adjustment</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Stock In", value: totalIn.toLocaleString() + " units", color: "#10B981" },
          { label: "Total Stock Out", value: totalOut.toLocaleString() + " units", color: "#EF4444" },
          { label: "Total Movements", value: String(entries.length), color: "#6366F1" },
        ].map(k => (
          <div key={k.label} style={cardStyle}><p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0" }}>{k.label}</p><p style={{ fontSize: "20px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p></div>
        ))}
      </div>

      {/* Manual adjustment form */}
      {showForm && (
        <form onSubmit={handleAdjustment} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Manual Stock Adjustment</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>Use this for damages, corrections, stock counts, or opening balances.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <select value={adjInventoryId} onChange={e => setAdjInventoryId(e.target.value)} required style={inputStyle}>
              <option value="">Select item</option>
              {invItems.map(i => <option key={i.id} value={i.id}>{i.name} (current: {i.quantity} {i.unit})</option>)}
            </select>
            <select value={adjDirection} onChange={e => setAdjDirection(e.target.value as "in" | "out")} style={inputStyle}>
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (-)</option>
            </select>
            <input type="number" min="0" step="any" placeholder="Quantity" value={adjQty} onChange={e => setAdjQty(e.target.value)} required style={inputStyle} />
            <input placeholder="Reason / notes" value={adjNotes} onChange={e => setAdjNotes(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Record Adjustment"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div style={{ marginBottom: "16px" }}>
        <select value={filterItem} onChange={e => setFilterItem(e.target.value)} style={{ ...inputStyle, width: "260px" }}>
          <option value="">All items</option>
          {invItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No stock movements yet. Receive a purchase order or record a manual adjustment to see entries here.</p>
        </div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Date", "Item", "Type", "Qty Change", "Balance After", "Notes"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{new Date(e.created_at).toLocaleDateString()} <span style={{ fontSize: "11px" }}>{new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{e.item_name}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (ENTRY_COLORS[e.entry_type] || "#6B7280") + "22", color: ENTRY_COLORS[e.entry_type] || "#6B7280" }}>
                      {ENTRY_LABELS[e.entry_type] || e.entry_type}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: 700, color: e.qty_change > 0 ? "#10B981" : "#EF4444" }}>{e.qty_change > 0 ? "+" : ""}{e.qty_change}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{e.balance_after}</td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{e.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
