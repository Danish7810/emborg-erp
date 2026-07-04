"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

type Lead = { id: string; title: string; value: number; status: string; probability: number; created_at: string; contact_id: string; };
type Contact = { id: string; full_name: string; company_name: string; created_at: string; };
type Activity = { id: string; title: string; type: string; completed: boolean; created_at: string; contact_id: string; };
type Invoice = { id: string; amount: number; status: string; };
type Employee = { id: string; status: string; };

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [qaName, setQaName] = useState("");
  const [qaCompany, setQaCompany] = useState("");
  const [qaEmail, setQaEmail] = useState("");
  const [qaTitle, setQaTitle] = useState("");
  const [qaValue, setQaValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserName(user.user_metadata?.full_name?.split(" ")[0] || "there");
      const [{ data: l }, { data: c }, { data: a }, { data: inv }, { data: emp }] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("contacts").select("*").order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("invoices").select("id, amount, status"),
        supabase.from("employees").select("id, status"),
      ]);
      setLeads(l || []);
      setContacts(c || []);
      setActivities(a || []);
      setInvoices(inv || []);
      setEmployees(emp || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (search.length > 1) {
      setSearchResults(contacts.filter((c) => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase())));
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  }, [search, contacts]);

  async function getCompanyId() {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_my_company_id");
    return data;
  }

  async function handleQuickContact(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const company_id = await getCompanyId();
    await supabase.from("contacts").insert({ full_name: qaName, company_name: qaCompany, email: qaEmail, company_id });
    setQaName(""); setQaCompany(""); setQaEmail("");
    setQuickAction(null); setSaving(false);
    window.location.reload();
  }

  async function handleQuickLead(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const supabase = createClient();
    const company_id = await getCompanyId();
    await supabase.from("leads").insert({ title: qaTitle, value: parseFloat(qaValue)||0, status: "new", company_id });
    setQaTitle(""); setQaValue("");
    setQuickAction(null); setSaving(false);
    window.location.reload();
  }

  const wonLeads = leads.filter((l) => l.status === "won");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const activeLeads = leads.filter((l) => !["won","lost"].includes(l.status));
  const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.value||0), 0);
  const totalPipeline = activeLeads.reduce((sum, l) => sum + (l.value||0), 0);
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const paidInvoices = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.amount||0), 0);
  const activeEmployees = employees.filter((e) => e.status === "active").length;

  const STAGES = ["new","contacted","qualified","won","lost"];
  const STAGE_LABELS: Record<string,string> = { new:"New", contacted:"Contacted", qualified:"Qualified", won:"Won", lost:"Lost" };
  const STAGE_COLORS: Record<string,string> = { new:"#3B82F6", contacted:"#8B5CF6", qualified:"#F59E0B", won:"#10B981", lost:"#EF4444" };
  const stageData = STAGES.map((s) => ({ stage: s, count: leads.filter((l) => l.status === s).length, value: leads.filter((l) => l.status === s).reduce((sum, l) => sum + (l.value||0), 0) }));
  const maxCount = Math.max(...stageData.map((s) => s.count), 1);

  function dealScore(lead: Lead) {
    const ageDays = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400000);
    const valueScore = Math.min(lead.value / 1000, 40);
    const probScore = (lead.probability || 20) * 0.4;
    const freshScore = Math.max(0, 20 - ageDays);
    return Math.min(Math.round(valueScore + probScore + freshScore), 100);
  }

  const businessHealth = Math.round(
    (conversionRate * 0.3) +
    (Math.min(contacts.length * 5, 25)) +
    (Math.min(totalRevenue / 1000, 25)) +
    (Math.min(activeLeads.length * 3, 20))
  );

  const followUpNeeded = contacts.filter((c) => {
    const lastActivity = activities.find((a) => a.contact_id === c.id);
    if (!lastActivity) return true;
    const daysSince = Math.floor((Date.now() - new Date(lastActivity.created_at).getTime()) / 86400000);
    return daysSince > 7;
  }).slice(0, 3);

  const topLeads = [...activeLeads].sort((a, b) => dealScore(b) - dealScore(a)).slice(0, 5);
  const recentActivity = activities.slice(0, 8);
  const healthColor = businessHealth >= 70 ? "#10B981" : businessHealth >= 40 ? "#F59E0B" : "#EF4444";

  if (loading) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Loading dashboard...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "26px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Good day, {userName}</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Here is your business at a glance.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", width: "100%", minWidth: "160px", maxWidth: "200px", boxSizing: "border-box" }} />
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--bg)", border: "1px solid var(--line)", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", zIndex: 100, marginTop: "4px" }}>
                {searchResults.slice(0, 5).map((c) => (
                  <a key={c.id} href={"/dashboard/contacts/"+c.id} style={{ display: "block", padding: "10px 14px", textDecoration: "none", color: "var(--ink)", fontSize: "13px", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontWeight: 600 }}>{c.full_name}</span>{c.company_name && <span style={{ color: "var(--muted)", marginLeft: "8px" }}>{c.company_name}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setQuickAction(quickAction === "contact" ? null : "contact")} style={{ padding: "9px 16px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Contact</button>
          <button onClick={() => setQuickAction(quickAction === "lead" ? null : "lead")} style={{ padding: "9px 16px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>+ Lead</button>
        </div>
      </div>

      {quickAction === "contact" && (
        <form onSubmit={handleQuickContact} style={{ padding: "20px", border: "1px solid var(--accent)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "150px" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Full Name</label><input value={qaName} onChange={(e) => setQaName(e.target.value)} required style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
          <div style={{ flex: 1, minWidth: "150px" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Company</label><input value={qaCompany} onChange={(e) => setQaCompany(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
          <div style={{ flex: 1, minWidth: "150px" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Email</label><input value={qaEmail} onChange={(e) => setQaEmail(e.target.value)} type="email" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
          <button type="submit" disabled={saving} style={{ padding: "9px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setQuickAction(null)} style={{ padding: "9px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        </form>
      )}

      {quickAction === "lead" && (
        <form onSubmit={handleQuickLead} style={{ padding: "20px", border: "1px solid var(--accent)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: "200px" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Lead Title</label><input value={qaTitle} onChange={(e) => setQaTitle(e.target.value)} required style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
          <div style={{ flex: 1, minWidth: "120px" }}><label style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "4px" }}>Value ($)</label><input value={qaValue} onChange={(e) => setQaValue(e.target.value)} type="number" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px", boxSizing: "border-box" }} /></div>
          <button type="submit" disabled={saving} style={{ padding: "9px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => setQuickAction(null)} style={{ padding: "9px 16px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {[
          { label: "Total Contacts", value: contacts.length, prefix: "", color: "#3B82F6", href: "/dashboard/contacts" },
          { label: "Active Leads", value: activeLeads.length, prefix: "", color: "#8B5CF6", href: "/dashboard/leads" },
          { label: "Pipeline Value", value: totalPipeline.toLocaleString(), prefix: "$", color: "#F59E0B", href: "/dashboard/leads" },
          { label: "Won Revenue", value: totalRevenue.toLocaleString(), prefix: "$", color: "#10B981", href: "/dashboard/finance" },
          { label: "Conversion Rate", value: conversionRate, prefix: "", suffix: "%", color: "#06B6D4", href: "/dashboard/leads" },
          { label: "Active Employees", value: activeEmployees, prefix: "", color: "#EC4899", href: "/dashboard/hr" },
        ].map((card, i) => (
          <a key={i} href={card.href} className="card-interactive" style={{ padding: "18px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", textDecoration: "none", display: "block" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>{card.label}</p>
            <p className="tight" style={{ fontSize: "28px", fontWeight: 700, color: card.color, margin: 0 }}>{card.prefix}{card.value}{(card as any).suffix || ""}</p>
          </a>
        ))}
      </div>

      <div className="grid-2-1">
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Pipeline by Stage</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stageData.map((s) => (
              <div key={s.stage}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>{STAGE_LABELS[s.stage]}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{s.count} leads {s.value > 0 ? "· $"+s.value.toLocaleString() : ""}</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "var(--line)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (s.count / maxCount * 100) + "%", backgroundColor: STAGE_COLORS[s.stage], borderRadius: "4px", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px", border: "2px solid " + healthColor, borderRadius: "14px", backgroundColor: "var(--bg-alt)", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px 0" }}>Business Health Score</p>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "6px solid " + healthColor, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontSize: "24px", fontWeight: 700, color: healthColor }}>{businessHealth}</span>
          </div>
          <p style={{ fontSize: "13px", color: healthColor, fontWeight: 600, margin: "0 0 8px 0" }}>{businessHealth >= 70 ? "Healthy" : businessHealth >= 40 ? "Growing" : "Early Stage"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "left" }}>
            {[
              { label: "Conversion", value: conversionRate + "%" },
              { label: "Contacts", value: contacts.length },
              { label: "Revenue", value: "$" + totalRevenue.toLocaleString() },
              { label: "Pipeline", value: activeLeads.length + " deals" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{item.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Top Deals</h3>
            <a href="/dashboard/leads" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>View all</a>
          </div>
          {topLeads.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No active leads yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topLeads.map((lead) => {
                const score = dealScore(lead);
                const scoreColor = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
                return (
                  <div key={lead.id} style={{ padding: "12px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: 0, flex: 1 }}>{lead.title}</p>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: scoreColor + "20", border: "2px solid " + scoreColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, color: scoreColor }}>{score}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 600 }}>${(lead.value||0).toLocaleString()}</span>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "8px", backgroundColor: STAGE_COLORS[lead.status] + "18", color: STAGE_COLORS[lead.status], fontWeight: 600 }}>{lead.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Follow-up Needed</h3>
            <a href="/dashboard/contacts" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>View all</a>
          </div>
          {followUpNeeded.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "24px", margin: "0 0 8px 0" }}>done</p>
              <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>All contacts followed up!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {followUpNeeded.map((c) => {
                const lastActivity = activities.find((a) => a.contact_id === c.id);
                const daysSince = lastActivity ? Math.floor((Date.now() - new Date(lastActivity.created_at).getTime()) / 86400000) : null;
                return (
                  <a key={c.id} href={"/dashboard/contacts/"+c.id} style={{ padding: "12px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid #F59E0B40", textDecoration: "none", display: "block" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F59E0B20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#F59E0B" }}>{c.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px 0" }}>{c.full_name}</p>
                        <p style={{ fontSize: "11px", color: "#F59E0B", margin: 0, fontWeight: 600 }}>{daysSince === null ? "Never contacted" : daysSince + " days ago"}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Recent Activity</h3>
          </div>
          {recentActivity.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No activity yet. Start logging calls and emails.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentActivity.map((act) => (
                <div key={act.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: act.completed ? "#10B98120" : "var(--bg)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", fontWeight: 700, color: act.completed ? "#10B981" : "var(--muted)" }}>
                    {act.type?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px 0" }}>{act.title}</p>
                    <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>{new Date(act.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>Quick Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Won Deals", value: wonLeads.length, color: "#10B981" },
              { label: "Lost Deals", value: lostLeads.length, color: "#EF4444" },
              { label: "Paid Invoices", value: "$"+paidInvoices.toLocaleString(), color: "#3B82F6" },
              { label: "Team Size", value: activeEmployees, color: "#8B5CF6" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)", textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 700, color: item.color, margin: "0 0 4px 0" }}>{item.value}</p>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>Recent Contacts</h3>
          {contacts.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>No contacts yet.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {contacts.slice(0, 5).map((c) => (
                <a key={c.id} href={"/dashboard/contacts/"+c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "8px", textDecoration: "none", backgroundColor: "var(--bg)", border: "1px solid var(--line)" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>{c.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{c.full_name}</p>
                    {c.company_name && <p style={{ fontSize: "11px", color: "var(--muted)", margin: 0 }}>{c.company_name}</p>}
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--muted)" }}>{new Date(c.created_at).toLocaleDateString()}</span>
                </a>
              ))}
              <a href="/dashboard/contacts" style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "none", textAlign: "center", marginTop: "4px" }}>View all contacts</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
