"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase";

type Contact = { id: string; full_name: string; email: string; phone: string; company_name: string; website: string; address: string; notes: string; tags: string; };
type Lead = { id: string; title: string; value: number; status: string; source: string; close_date: string; probability: number; };
type Activity = { id: string; type: string; title: string; description: string; due_date: string; completed: boolean; created_at: string; };

const ACTIVITY_TYPES = ["note", "call", "email", "meeting", "task"];
const LEAD_SOURCES = ["Direct", "Website", "Referral", "Social Media", "Email Campaign", "Cold Call", "Event", "Other"];

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [actType, setActType] = useState("note");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actDue, setActDue] = useState("");
  const [leadTitle, setLeadTitle] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [leadSource, setLeadSource] = useState("Direct");
  const [leadCloseDate, setLeadCloseDate] = useState("");
  const [leadProbability, setLeadProbability] = useState("50");

  async function fetchData() {
    const supabase = createClient();
    const [{ data: c }, { data: l }, { data: a }] = await Promise.all([
      supabase.from("contacts").select("*").eq("id", id).single(),
      supabase.from("leads").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
      supabase.from("activities").select("*").eq("contact_id", id).order("created_at", { ascending: false }),
    ]);
    if (c) { setContact(c); setFullName(c.full_name||""); setEmail(c.email||""); setPhone(c.phone||""); setCompanyName(c.company_name||""); setWebsite(c.website||""); setAddress(c.address||""); setNotes(c.notes||""); setTags(c.tags||""); }
    setLeads(l || []);
    setActivities(a || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [id]);

  async function getCompanyId() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_my_company_id");
    return data;
  }

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    await supabase.from("contacts").update({ full_name: fullName, email, phone, company_name: companyName, website, address, notes, tags }).eq("id", id);
    setEditing(false); setSaving(false); fetchData();
  }

  async function handleSaveActivity(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const company_id = await getCompanyId();
    await supabase.from("activities").insert({ contact_id: id, type: actType, title: actTitle, description: actDesc, due_date: actDue||null, company_id });
    setActTitle(""); setActDesc(""); setActDue(""); setActType("note");
    setShowActivityForm(false); setSaving(false); fetchData();
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const company_id = await getCompanyId();
    await supabase.from("leads").insert({ contact_id: id, title: leadTitle, value: parseFloat(leadValue)||0, source: leadSource, close_date: leadCloseDate||null, probability: parseInt(leadProbability)||0, status: "new", company_id });
    setLeadTitle(""); setLeadValue(""); setLeadSource("Direct"); setLeadCloseDate(""); setLeadProbability("50");
    setShowLeadForm(false); setSaving(false); fetchData();
  }

  async function handleToggleActivity(actId: string, completed: boolean) {
    const supabase = createClient();
    await supabase.from("activities").update({ completed: !completed }).eq("id", actId);
    fetchData();
  }

  async function handleDeleteActivity(actId: string) {
    if (!confirm("Delete?")) return;
    const supabase = createClient();
    await supabase.from("activities").delete().eq("id", actId);
    fetchData();
  }

  if (loading) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Loading...</div>;
  if (!contact) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Contact not found.</div>;

  const totalPipeline = leads.reduce((sum, l) => sum + (l.value||0), 0);
  const wonLeads = leads.filter((l) => l.status === "won").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <a href="/dashboard/contacts" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "14px" }}>Contacts</a>
        <span style={{ color: "var(--muted)" }}>/</span>
        <span style={{ color: "var(--ink)", fontSize: "14px", fontWeight: 600 }}>{contact.full_name}</span>
        <button onClick={() => setEditing(!editing)} style={{ marginLeft: "auto", padding: "8px 16px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "transparent", color: "var(--ink)", fontSize: "13px", cursor: "pointer" }}>{editing ? "Cancel" : "Edit"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg-alt)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "white" }}>{contact.full_name.charAt(0).toUpperCase()}</span>
            </div>
            {editing ? (
              <form onSubmit={handleSaveContact} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={3} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", resize: "vertical" }} />
                <button type="submit" disabled={saving} style={{ padding: "9px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h2 className="tight" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>{contact.full_name}</h2>
                {contact.company_name && <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{contact.company_name}</p>}
                {contact.tags && <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>{contact.tags.split(",").map((tag, i) => (<span key={i} style={{ padding: "2px 10px", backgroundColor: "var(--bg)", border: "1px solid var(--line)", color: "var(--accent)", borderRadius: "10px", fontSize: "11px", fontWeight: 600 }}>{tag.trim()}</span>))}</div>}
                <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />
                {contact.email && <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Email: <a href={"mailto:"+contact.email} style={{ color: "var(--accent)", textDecoration: "none" }}>{contact.email}</a></p>}
                {contact.phone && <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Phone: {contact.phone}</p>}
                {contact.website && <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Website: <a href={contact.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>{contact.website}</a></p>}
                {contact.address && <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Address: {contact.address}</p>}
                {contact.notes && <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0, lineHeight: 1.5, marginTop: "8px" }}>{contact.notes}</p>}
              </div>
            )}
          </div>
          <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg-alt)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 12px 0" }}>Pipeline Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "13px", color: "var(--muted)" }}>Total leads</span><span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{leads.length}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "13px", color: "var(--muted)" }}>Pipeline value</span><span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>${totalPipeline.toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "13px", color: "var(--muted)" }}>Won deals</span><span style={{ fontSize: "13px", fontWeight: 600, color: "#10B981" }}>{wonLeads}</span></div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Leads</h3>
              <button onClick={() => setShowLeadForm(!showLeadForm)} style={{ padding: "6px 14px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Lead</button>
            </div>
            {showLeadForm && (
              <form onSubmit={handleSaveLead} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", padding: "16px", backgroundColor: "var(--bg-alt)", borderRadius: "12px" }}>
                <input placeholder="Lead title" value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} required style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <input placeholder="Value ($)" type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }}>
                  {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input placeholder="Expected close date" type="date" value={leadCloseDate} onChange={(e) => setLeadCloseDate(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontSize: "13px", color: "var(--muted)", flexShrink: 0 }}>Win probability: {leadProbability}%</label>
                  <input type="range" min="0" max="100" value={leadProbability} onChange={(e) => setLeadProbability(e.target.value)} style={{ flex: 1 }} />
                </div>
                <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "9px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Save Lead</button>
              </form>
            )}
            {leads.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No leads yet for this contact.</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {leads.map((lead) => (
                  <div key={lead.id} style={{ padding: "14px", backgroundColor: "var(--bg-alt)", borderRadius: "12px", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px 0" }}>{lead.title}</p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          {lead.value > 0 && <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>${lead.value.toLocaleString()}</span>}
                          {lead.source && <span style={{ fontSize: "12px", color: "var(--muted)" }}>via {lead.source}</span>}
                          {lead.close_date && <span style={{ fontSize: "12px", color: "var(--muted)" }}>closes {lead.close_date}</span>}
                          {lead.probability > 0 && <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>{lead.probability}% likely</span>}
                        </div>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, backgroundColor: "var(--bg)", border: "1px solid var(--line)", color: "var(--muted)" }}>{lead.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Activity Timeline</h3>
              <button onClick={() => setShowActivityForm(!showActivityForm)} style={{ padding: "6px 14px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Log Activity</button>
            </div>
            {showActivityForm && (
              <form onSubmit={handleSaveActivity} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", padding: "16px", backgroundColor: "var(--bg-alt)", borderRadius: "12px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {ACTIVITY_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => setActType(t)} style={{ padding: "6px 12px", borderRadius: "12px", border: "1px solid var(--line)", backgroundColor: actType === t ? "var(--accent)" : "var(--bg)", color: actType === t ? "white" : "var(--muted)", fontSize: "12px", cursor: "pointer" }}>{t}</button>
                  ))}
                </div>
                <input placeholder="Title" value={actTitle} onChange={(e) => setActTitle(e.target.value)} required style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <textarea placeholder="Description or notes" value={actDesc} onChange={(e) => setActDesc(e.target.value)} rows={2} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", resize: "vertical" }} />
                <input placeholder="Due date (optional)" type="datetime-local" value={actDue} onChange={(e) => setActDue(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
                <button type="submit" disabled={saving} style={{ padding: "9px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Log Activity</button>
              </form>
            )}
            {activities.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No activities yet.</p> : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activities.map((act) => (
                  <div key={act.id} style={{ display: "flex", gap: "12px", paddingBottom: "16px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: act.completed ? "#10B98120" : "var(--bg-alt)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", cursor: "pointer", fontWeight: 700, color: act.completed ? "#10B981" : "var(--muted)" }} onClick={() => handleToggleActivity(act.id, act.completed)}>{act.completed ? "done" : act.type.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: act.completed ? "var(--muted)" : "var(--ink)", margin: "0 0 2px 0", textDecoration: act.completed ? "line-through" : "none" }}>{act.title}</p>
                      {act.description && <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 2px 0", lineHeight: 1.4 }}>{act.description}</p>}
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>{new Date(act.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeleteActivity(act.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "14px", padding: "0 4px", alignSelf: "flex-start" }}>x</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
