"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Warehouse = { id: string; name: string; code: string; address: string; is_default: boolean; };
type Location = { id: string; warehouse_id: string; name: string; type: string; parent_id: string | null; };
type InvItem = { id: string; name: string; quantity: number; unit: string; };

const LOCATION_TYPES = ["internal", "view", "customer", "supplier", "transit"];
const TYPE_COLORS: Record<string, string> = {
  internal: "#10B981", view: "#6B7280", customer: "#3B82F6", supplier: "#F59E0B", transit: "#8B5CF6",
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [showWhForm, setShowWhForm] = useState(false);
  const [whSaving, setWhSaving] = useState(false);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  const [showLocForm, setShowLocForm] = useState(false);
  const [locSaving, setLocSaving] = useState(false);
  const [locWarehouseId, setLocWarehouseId] = useState("");
  const [locName, setLocName] = useState("");
  const [locType, setLocType] = useState("internal");
  const [locParentId, setLocParentId] = useState("");

  const [transferSaving, setTransferSaving] = useState(false);
  const [transferItemId, setTransferItemId] = useState("");
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const supabase = createClient();
    const [whRes, locRes, invRes] = await Promise.all([
      supabase.from("warehouses").select("*").order("is_default", { ascending: false }).order("name"),
      supabase.from("warehouse_locations").select("*").order("name"),
      supabase.from("inventory").select("id, name, quantity, unit").order("name"),
    ]);
    setWarehouses(whRes.data || []);
    setLocations(locRes.data || []);
    setInvItems(invRes.data || []);
    setLoading(false);
  }

  async function getCompanyId(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    return profile?.company_id || null;
  }

  function openAddWarehouse() {
    setWhName(""); setWhCode(""); setWhAddress(""); setShowWhForm(true);
  }

  async function handleSaveWarehouse(e: React.FormEvent) {
    e.preventDefault(); setWhSaving(true);
    const supabase = createClient();
    const companyId = await getCompanyId(supabase);
    if (!companyId) { setWhSaving(false); return; }
    const { error } = await supabase.from("warehouses").insert({
      company_id: companyId, name: whName, code: whCode, address: whAddress || null, is_default: warehouses.length === 0,
    });
    setWhSaving(false);
    if (error) { showToast("Failed to save warehouse: " + error.message, false); return; }
    setShowWhForm(false);
    showToast("Warehouse created", true);
    fetchAll();
  }

  async function handleDeleteWarehouse(id: string) {
    if (!confirm("Delete this warehouse? Its locations will be removed too.")) return;
    const supabase = createClient();
    await supabase.from("warehouses").delete().eq("id", id);
    fetchAll();
  }

  function openAddLocation(warehouseId?: string) {
    setLocWarehouseId(warehouseId || warehouses[0]?.id || "");
    setLocName(""); setLocType("internal"); setLocParentId("");
    setShowLocForm(true);
  }

  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault(); setLocSaving(true);
    const supabase = createClient();
    const companyId = await getCompanyId(supabase);
    if (!companyId) { setLocSaving(false); return; }
    const { error } = await supabase.from("warehouse_locations").insert({
      company_id: companyId, warehouse_id: locWarehouseId, name: locName, type: locType, parent_id: locParentId || null,
    });
    setLocSaving(false);
    if (error) { showToast("Failed to save location: " + error.message, false); return; }
    setShowLocForm(false);
    showToast("Location created", true);
    fetchAll();
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm("Delete this location? Any nested locations will be removed too.")) return;
    const supabase = createClient();
    await supabase.from("warehouse_locations").delete().eq("id", id);
    fetchAll();
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferItemId || !transferFromId || !transferToId || !transferQty || parseFloat(transferQty) <= 0) return;
    if (transferFromId === transferToId) { showToast("Source and destination locations must differ.", false); return; }
    setTransferSaving(true);
    const supabase = createClient();
    const companyId = await getCompanyId(supabase);
    if (!companyId) { setTransferSaving(false); return; }
    const item = invItems.find(i => i.id === transferItemId);
    if (!item) { setTransferSaving(false); return; }

    const { error } = await supabase.rpc("transfer_stock_between_locations", {
      p_inventory_id: transferItemId,
      p_source_location_id: transferFromId,
      p_destination_location_id: transferToId,
      p_qty: parseFloat(transferQty),
      p_company_id: companyId,
      p_item_name: item.name,
      p_notes: transferNotes || null,
    });

    setTransferSaving(false);
    if (error) { showToast("Transfer failed: " + error.message, false); return; }
    setTransferItemId(""); setTransferFromId(""); setTransferToId(""); setTransferQty(""); setTransferNotes("");
    showToast("Stock transferred", true);
    fetchAll();
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" };

  const locationsForParentSelect = locations.filter(l => l.warehouse_id === locWarehouseId);

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ marginBottom: "20px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Warehouses</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Warehouses, locations, and internal stock transfers</p>
      </div>

      {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : (
        <>
          {/* Warehouses */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Warehouses</h3>
            <button onClick={openAddWarehouse} style={{ padding: "8px 16px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>+ Add Warehouse</button>
          </div>

          {showWhForm && (
            <form onSubmit={handleSaveWarehouse} style={{ ...cardStyle, marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input placeholder="Warehouse name" value={whName} onChange={e => setWhName(e.target.value)} required style={inputStyle} />
              <input placeholder="Code (e.g. WH-2)" value={whCode} onChange={e => setWhCode(e.target.value)} required style={inputStyle} />
              <input placeholder="Address (optional)" value={whAddress} onChange={e => setWhAddress(e.target.value)} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                <button type="submit" disabled={whSaving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: whSaving ? 0.6 : 1 }}>{whSaving ? "Saving..." : "Save Warehouse"}</button>
                <button type="button" onClick={() => setShowWhForm(false)} style={{ padding: "10px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          )}

          {warehouses.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px", marginBottom: "24px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No warehouses yet. Add your first one.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px", marginBottom: "24px" }}>
              {warehouses.map(wh => (
                <div key={wh.id} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>{wh.name}</p>
                      <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0 0" }}>{wh.code}</p>
                    </div>
                    {wh.is_default && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, backgroundColor: "#10B98122", color: "#10B981" }}>DEFAULT</span>}
                  </div>
                  {wh.address && <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px 0" }}>{wh.address}</p>}
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 10px 0" }}>{locations.filter(l => l.warehouse_id === wh.id).length} location(s)</p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => openAddLocation(wh.id)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}>+ Add Location</button>
                    <button onClick={() => handleDeleteWarehouse(wh.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Locations */}
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Locations</h3>

          {showLocForm && (
            <form onSubmit={handleSaveLocation} style={{ ...cardStyle, marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <select value={locWarehouseId} onChange={e => { setLocWarehouseId(e.target.value); setLocParentId(""); }} required style={inputStyle}>
                <option value="">Select warehouse</option>
                {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
              <input placeholder="Location name (e.g. Rack 1, Bin A3)" value={locName} onChange={e => setLocName(e.target.value)} required style={inputStyle} />
              <select value={locType} onChange={e => setLocType(e.target.value)} style={inputStyle}>
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <select value={locParentId} onChange={e => setLocParentId(e.target.value)} style={inputStyle} title="Optional parent location, for nested Rack -> Shelf -> Bin setups">
                <option value="">No parent (top-level)</option>
                {locationsForParentSelect.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px" }}>
                <button type="submit" disabled={locSaving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: locSaving ? 0.6 : 1 }}>{locSaving ? "Saving..." : "Save Location"}</button>
                <button type="button" onClick={() => setShowLocForm(false)} style={{ padding: "10px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          )}

          {locations.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "32px", marginBottom: "24px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No locations yet.</p></div>
          ) : (
            <div style={{ ...cardStyle, marginBottom: "24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Location", "Warehouse", "Type", "Parent", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {locations.map(loc => (
                    <tr key={loc.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)" }}>{loc.name}</td>
                      <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{warehouses.find(w => w.id === loc.warehouse_id)?.name || "-"}</td>
                      <td style={{ padding: "10px 12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (TYPE_COLORS[loc.type] || "#6B7280") + "22", color: TYPE_COLORS[loc.type] || "#6B7280" }}>{loc.type}</span></td>
                      <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{locations.find(l => l.id === loc.parent_id)?.name || "-"}</td>
                      <td style={{ padding: "10px 12px" }}><button onClick={() => handleDeleteLocation(loc.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Internal Transfer */}
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Transfer Stock</h3>
          <form onSubmit={handleTransfer} style={cardStyle}>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 16px 0" }}>Move stock between two locations. This does not change total on-hand quantity.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <select value={transferItemId} onChange={e => setTransferItemId(e.target.value)} required style={inputStyle}>
                <option value="">Select item</option>
                {invItems.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (total: {inv.quantity} {inv.unit})</option>)}
              </select>
              <select value={transferFromId} onChange={e => setTransferFromId(e.target.value)} required style={inputStyle}>
                <option value="">From location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({warehouses.find(w => w.id === l.warehouse_id)?.name})</option>)}
              </select>
              <select value={transferToId} onChange={e => setTransferToId(e.target.value)} required style={inputStyle}>
                <option value="">To location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({warehouses.find(w => w.id === l.warehouse_id)?.name})</option>)}
              </select>
              <input type="number" min="0" step="any" placeholder="Quantity" value={transferQty} onChange={e => setTransferQty(e.target.value)} required style={inputStyle} />
              <input placeholder="Notes (optional)" value={transferNotes} onChange={e => setTransferNotes(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" disabled={transferSaving} style={{ padding: "10px 24px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: transferSaving ? 0.6 : 1 }}>{transferSaving ? "Transferring..." : "Transfer Stock"}</button>
          </form>
        </>
      )}
    </div>
  );
}
