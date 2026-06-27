"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Contact = { id: string; full_name: string; email: string; phone: string; company_name: string; };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchContacts() {
    const supabase = createClient();
    const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    setContacts(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchContacts(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }
    await supabase.from("contacts").insert({ full_name: fullName, email, phone, company_name: companyName, company_id: profile.company_id });
    setFullName(""); setEmail(""); setPhone(""); setCompanyName("");
    setShowForm(false);
    setSaving(false);
    fetchContacts();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("contacts").delete().eq("id", id);
    fetchContacts();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Contacts</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{contacts.length} total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ Add Contact"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving..." : "Save Contact"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : contacts.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No contacts yet. Add your first one above.</p>
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
              {contacts.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < contacts.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <td style={{ padding: "14px 16px", color: "var(--ink)", fontWeight: 500 }}>{c.full_name}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.company_name || "-"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.email || "-"}</td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{c.phone || "-"}</td>
                  <td style={{ padding: "14px 16px" }}>
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
