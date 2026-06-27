"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Item = { id: string; name: string; sku: string; category: string; quantity: number; unit: string; price: number; low_stock_alert: number; };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("0");
  const [lowStock, setLowStock] = useState("10");
  const [saving, setSaving] = useState(false);

  async function fetchItems() {
    const supabase = createClient();
    const { data } = await supabase.from("inventory").select("*").order("name");
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase()));
  const lowStockItems = items.filter((i) => i.quantity <= i.low_stock_alert);

  function openAdd() { setEditing(null); setName(""); setSku(""); setCategory(""); setQuantity("0"); setUnit("pcs"); setPrice("0"); setLowStock("10"); setShowForm(true); }
  function openEdit(item: Item) { setEditing(item); setName(item.name); setSku(item.sku || ""); setCategory(item.category || ""); setQuantity(String(item.quantity)); setUnit(item.unit || "pcs"); setPrice(String(item.price)); setLowStock(String(item.low_stock_alert)); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = { name, sku, category, quantity: parseInt(quantity) || 0, unit, price: parseFloat(price) || 0, low_stock_alert: parseInt(lowStock) || 10 };
    if (editing) {
      await supabase.from("inventory").update(payload).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) { setSaving(false); return; }
      await supabase.from("inventory").insert({ ...payload, company_id: profile.company_id });
    }
    console.log("Save result:", JSON.stringify(payload)); setShowForm(false);
    setSaving(false);
    fetchItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const supabase = createClient();
    await supabase.from("inventory").delete().eq("id", id);
    fetchItems();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Inventory</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{items.length} items - {lowStockItems.length} low stock</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", width: "200px" }} />
          <button onClick={openAdd} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Add Item</button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ padding: "14px 18px", backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "12px", marginBottom: "20px", fontSize: "13px", color: "#92400E" }}>
          <strong>Low stock alert:</strong> {lowStockItems.map((i) => i.name + " (" + i.quantity + " " + i.unit + ")").join(", ")}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Unit (pcs, kg, L...)" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Price ($)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Low stock alert at" type="number" value={lowStock} onChange={(e) => setLowStock(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : editing ? "Update Item" : "Save Item"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>{search ? "No items match your search." : "No inventory items yet. Add your first product above."}</p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                {["Product", "SKU", "Category", "Stock", "Price", ""].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{item.sku || "-"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{item.category || "-"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ color: item.quantity <= item.low_stock_alert ? "#EF4444" : "var(--ink)", fontWeight: item.quantity <= item.low_stock_alert ? 600 : 400 }}>
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>${item.price.toLocaleString()}</td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: "12px" }}>
                    <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px" }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
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

