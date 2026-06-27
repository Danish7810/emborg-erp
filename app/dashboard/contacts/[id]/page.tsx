"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase";

type Contact = { id: string; full_name: string; email: string; phone: string; company_name: string; website: string; address: string; notes: string; tags: string; };
type Lead = { id: string; title: string; value: number; status: string; source: string; close_date: string; probability: number; };
type Activity = { id: string; type: string; title: string; description: string; completed: boolean; created_at: string; };

const ACTIVITY_TYPES = ["Call", "Email", "Task", "Meeting", "Note"];
const LEAD_SOURCES = ["Direct", "Website", "Referral", "Social Media", "Email Campaign", "Cold Call", "Event", "Other"];
const STATUS_COLORS: Record<string, string> = { new: "#3B82F6", contacted: "#8B5CF6", qualified: "#F59E0B", won: "#10B981", lost: "#EF4444" };

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"details" | "related">("details");
  const [actType, setActType] = useState("Call");
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
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

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const company_id = await getCompanyId();
    await supabase.from("activities").insert({ contact_id: id, type: actType.toLowerCase(), title: actTitle || actType + " with " + (contact?.full_name || "contact"), description: actDesc, company_id });
    setActTitle(""); setActDesc(""); setActType("Call");
    setSaving(false); fetchData();
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

  if (loading) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Loading...</div>;
  if (!contact) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Contact not found.</div>;

  const totalPipeline = leads.reduce((sum, l) => sum + (l.value||0), 0);
  const wonLeads = leads.filter((l) => l.status === "won");
  const nextSteps = activities.filter((a) => !a.completed);
  const pastActivity = activities.filter((a) => a.completed);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <a href="/dashboard/contacts" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "13px" }}>Contacts</a>
        <span style={{ color: "var(--muted)", fontSize: "13px" }}>/</span>
        <span style={{ color: "var(--ink)", fontSize: "13px", fontWeight: 600 }}>{contact.full_name}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={() => setEditing(!editing)} style={{ padding: "7px 16px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "transparent", color: "var(--ink)", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}>{editing ? "Cancel" : "Edit"}</button>
          <button onClick={() => setShowLeadForm(!showLeadForm)} style={{ padding: "7px 16px", border: "none", borderRadius: "14px", backgroundColor: "var(--accent)", color: "white", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>+ New Lead</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", gap: "16px", alignItems: "start" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>{contact.full_name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>{contact.full_name}</h2>
                {contact.company_name && <p style={{ fontSize: "13px", color: "var(--accent)", margin: 0, cursor: "pointer", textDecoration: "underline" }}>{contact.company_name}</p>}
              </div>
            </div>
            {contact.tags && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                {contact.tags.split(",").map((tag, i) => (<span key={i} style={{ padding: "2px 8px", backgroundColor: "var(--bg)", border: "1px solid var(--line)", color: "var(--accent)", borderRadius: "8px", fontSize: "11px", fontWeight: 600 }}>{tag.trim()}</span>))}
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ textAlign: "center", flex: 1, padding: "8px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>{leads.length}</p>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>Leads</p>
              </div>
              <div style={{ textAlign: "center", flex: 1, padding: "8px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#10B981", margin: 0 }}>{wonLeads.length}</p>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>Won</p>
              </div>
              <div style={{ textAlign: "center", flex: 1, padding: "8px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>${totalPipeline.toLocaleString()}</p>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>Value</p>
              </div>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "0 0 12px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {contact.email && <div><p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</p><a href={"mailto:"+contact.email} style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none" }}>{contact.email}</a></div>}
              {contact.phone && <div><p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Phone</p><p style={{ fontSize: "13px", color: "var(--ink)", margin: 0 }}>{contact.phone}</p></div>}
              {contact.website && <div><p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Website</p><a href={contact.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none" }}>{contact.website}</a></div>}
              {contact.address && <div><p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Address</p><p style={{ fontSize: "13px", color: "var(--ink)", margin: 0 }}>{contact.address}</p></div>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "0", borderBottom: "2px solid var(--line)", marginBottom: "4px" }}>
            {(["details", "related"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", border: "none", backgroundColor: "transparent", color: tab === t ? "var(--accent)" : "var(--muted)", fontSize: "14px", fontWeight: tab === t ? 700 : 400, cursor: "pointer", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: "-2px" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "details" ? (
            editing ? (
              <form onSubmit={handleSaveContact} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Full Name</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Company</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Website</label><input value={website} onChange={(e) => setWebsite(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Tags (comma separated)</label><input value={tags} onChange={(e) => setTags(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }} /></div>
                <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "10px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{saving ? "Saving..." : "Save Changes"}</button>
              </form>
            ) : (
              <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {[["Full Name", contact.full_name], ["Company", contact.company_name], ["Email", contact.email], ["Phone", contact.phone], ["Website", contact.website], ["Address", contact.address], ["Tags", contact.tags], ["Notes", contact.notes]].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 3px 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                      <p style={{ fontSize: "13px", color: "var(--ink)", margin: 0, lineHeight: 1.4 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Leads ({leads.length})</h3>
                  <button onClick={() => setShowLeadForm(!showLeadForm)} style={{ padding: "5px 12px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add</button>
                </div>
                {showLeadForm && (
                  <form onSubmit={handleSaveLead} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px", padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px" }}>
                    <input placeholder="Lead title" value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} required style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "12px" }} />
                    <input placeholder="Value ($)" type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "12px" }} />
                    <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "12px" }}>
                      {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input placeholder="Close date" type="date" value={leadCloseDate} onChange={(e) => setLeadCloseDate(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--line)", borderRadius: "6px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "12px" }} />
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", flexShrink: 0 }}>Probability: {leadProbability}%</span>
                      <input type="range" min="0" max="100" value={leadProbability} onChange={(e) => setLeadProbability(e.target.value)} style={{ flex: 1 }} />
                    </div>
                    <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", padding: "8px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Save Lead</button>
                  </form>
                )}
                {leads.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No leads yet.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {leads.map((lead) => (
                      <div key={lead.id} style={{ padding: "12px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 4px 0" }}>{lead.title}</p>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              {lead.value > 0 && <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>${lead.value.toLocaleString()}</span>}
                              {lead.source && <span style={{ fontSize: "12px", color: "var(--muted)" }}>{lead.source}</span>}
                              {lead.close_date && <span style={{ fontSize: "12px", color: "var(--muted)" }}>closes {lead.close_date}</span>}
                            </div>
                          </div>
                          <span style={{ padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, color: STATUS_COLORS[lead.status] || "var(--muted)", backgroundColor: (STATUS_COLORS[lead.status] || "#999") + "18" }}>{lead.status}</span>
                        </div>
                        {lead.probability > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <div style={{ height: "4px", backgroundColor: "var(--line)", borderRadius: "2px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: lead.probability + "%", backgroundColor: "#10B981", borderRadius: "2px" }} />
                            </div>
                            <p style={{ fontSize: "11px", color: "var(--muted)", margin: "3px 0 0 0" }}>{lead.probability}% probability</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Log Activity</h3>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
              {ACTIVITY_TYPES.map((t) => (
                <button key={t} onClick={() => setActType(t)} style={{ padding: "6px 12px", borderRadius: "10px", border: "1px solid var(--line)", backgroundColor: actType === t ? "var(--accent)" : "var(--bg)", color: actType === t ? "white" : "var(--muted)", fontSize: "12px", cursor: "pointer", fontWeight: actType === t ? 600 : 400 }}>{t}</button>
              ))}
            </div>
            <form onSubmit={handleLogActivity} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input placeholder={"Subject"} value={actTitle} onChange={(e) => setActTitle(e.target.value)} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" }} />
              <textarea placeholder="Notes / Description" value={actDesc} onChange={(e) => setActDesc(e.target.value)} rows={3} style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", resize: "vertical" }} />
              <button type="submit" disabled={saving} style={{ padding: "9px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{saving ? "Logging..." : "Log " + actType}</button>
            </form>
          </div>

          {nextSteps.length > 0 && (
            <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Next Steps</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {nextSteps.map((act) => (
                  <div key={act.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div onClick={() => handleToggleActivity(act.id, act.completed)} style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--accent)", cursor: "pointer", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px 0" }}>{act.title}</p>
                      {act.description && <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{act.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastActivity.length > 0 && (
            <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Past Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pastActivity.slice(0, 5).map((act) => (
                  <div key={act.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                      <span style={{ color: "white", fontSize: "10px", fontWeight: 700 }}>done</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 2px 0", textDecoration: "line-through" }}>{act.title}</p>
                      <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>{new Date(act.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
