"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Lead = { id: string; title: string; value: number; status: string; notes: string; };
const STAGES = ["new", "contacted", "qualified", "won", "lost"];
const STAGE_LABELS: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", won: "Won", lost: "Lost" };
const STAGE_COLORS: Record<string, string> = { new: "#3B82F6", contacted: "#8B5CF6", qualified: "#F59E0B", won: "#10B981", lost: "#EF4444" };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchLeads() {
    const supabase = createClient();
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchLeads(); }, []);

  const filtered = leads.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()) || l.notes?.toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setTitle(""); setValue(""); setStatus("new"); setNotes(""); setShowForm(true); }
  function openEdit(l: Lead) { setEditing(l); setTitle(l.title); setValue(String(l.value || "")); setStatus(l.status); setNotes(l.notes || ""); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("leads").update({ title, value: parseFloat(value) || 0, status, notes }).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) { setSaving(false); return; }
      await supabase.from("leads").insert({ title, value: parseFloat(value) || 0, status, notes, company_id: profile.company_id });
    }
    setShowForm(false);
    setSaving(false);
    fetchLeads();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient();
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    fetchLeads();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead?")) return;
    const supabase = createClient();
    await supabase.from("leads").delete().eq("id", id);
    fetchLeads();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Leads</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{leads.length} total</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", width: "200px" }} />
          <button onClick={openAdd} className="btn-primary" style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ Add Lead</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <input placeholder="Lead title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input placeholder="Value ($)" type="number" value={value} onChange={(e) => setValue(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : editing ? "Update Lead" : "Save Lead"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.status === stage);
            return (
              <div key={stage} style={{ backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STAGE_COLORS[stage] }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{STAGE_LABELS[stage]}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "auto" }}>{stageLeads.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stageLeads.map((lead) => (
                    <div key={lead.id} style={{ padding: "12px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px 0" }}>{lead.title}</p>
                      {lead.value > 0 && <p style={{ fontSize: "12px", color: "var(--accent)", margin: "0 0 4px 0", fontWeight: 600 }}>${lead.value.toLocaleString()}</p>}
                      {lead.notes && <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 8px 0", lineHeight: 1.4 }}>{lead.notes}</p>}
                      <select value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value)} style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: "var(--muted)", fontSize: "11px", marginBottom: "6px" }}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => openEdit(lead)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "11px", padding: 0 }}>Edit</button>
                        <button onClick={() => handleDelete(lead.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "11px", padding: 0 }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
