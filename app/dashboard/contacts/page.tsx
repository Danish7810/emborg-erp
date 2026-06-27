"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Contact = { id: string; full_name: string; email: string; phone: string; company_name: string; };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchContacts() {
    const supabase = createClient();
    const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    setContacts(data || []);
    setFiltered(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchContacts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(contacts.filter((c) => c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q)));
  }, [search, contacts]);

  function openAdd() { setEditing(null); setFullName(""); setEmail(""); setPhone(""); setCompanyName(""); setShowForm(true); }
  function openEdit(c: Contact) { setEditing(c); setFullName(c.full_name); setEmail(c.email || ""); setPhone(c.phone || ""); setCompanyName(c.company_name || ""); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("contacts").update({ full_name: fullName, email, phone, company_name: companyName }).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) { setSaving(false); return; }
      await supabase.from("contacts").insert({ full_name: fullName, email, phone, company_name: companyName, company_id: profile.company_id });
    }
    setShowForm(false);
    setSaving(false);
    fetchContacts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    const supabase = createClient();
    await supabase.from("contacts").delete().eq("id", id);
    fetchContacts();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Contacts</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{contacts.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", width: "200px" }} />
          <button onClick={openAdd} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Add Contact</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : editing ? "Update Contact" : "Save Contact"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 16px 0" }}>{search ? "No contacts match your search." : "No contacts yet. Add your first one above."}</p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: "14px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-alt)", borderBottom: "1px solid var(--line)" }}>
                {["Name", "Company", "Email", "Phone", ""].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}><a href={`/dashboard/contacts/${c.id}`} style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 600 }}>{c.full_name}</a></td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.company_name || "-"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.email || "-"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.phone || "-"}</td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: "12px" }}>
                    <button onClick={() => openEdit(c)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "13px" }}>Edit</button>
                    <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "13px" }}>Delete</button>
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


