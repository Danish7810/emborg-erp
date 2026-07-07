"use client";
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
