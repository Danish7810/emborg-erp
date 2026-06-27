"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

type Stats = { contacts: number; leads: number; won: number; pipeline: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ contacts: 0, leads: 0, won: 0, pipeline: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const [{ count: contacts }, { count: leads }, { data: wonLeads }, { data: pipelineLeads }] = await Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("value").eq("status", "won"),
        supabase.from("leads").select("value").neq("status", "won").neq("status", "lost"),
      ]);
      setStats({
        contacts: contacts || 0,
        leads: leads || 0,
        won: wonLeads?.reduce((sum, l) => sum + (l.value || 0), 0) || 0,
        pipeline: pipelineLeads?.reduce((sum, l) => sum + (l.value || 0), 0) || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Contacts", value: stats.contacts, prefix: "" },
    { label: "Total Leads", value: stats.leads, prefix: "" },
    { label: "Won Revenue", value: stats.won, prefix: "$" },
    { label: "Pipeline Value", value: stats.pipeline, prefix: "$" },
  ];

  return (
    <div>
      <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>Dashboard</h1>
      <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 32px 0" }}>Your CRM at a glance.</p>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          {cards.map((card, i) => (
            <div key={i} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px 0" }}>{card.label}</p>
              <p className="tight" style={{ fontSize: "32px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>{card.prefix}{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <a href="/dashboard/contacts" className="card-interactive" style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg)", textDecoration: "none", display: "block" }}>
          <h3 style={{ color: "var(--ink)", margin: "0 0 6px 0", fontSize: "16px" }}>Contacts</h3>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>Manage your customers and prospects.</p>
        </a>
        <a href="/dashboard/leads" className="card-interactive" style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg)", textDecoration: "none", display: "block" }}>
          <h3 style={{ color: "var(--ink)", margin: "0 0 6px 0", fontSize: "16px" }}>Leads</h3>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>Track deals through your pipeline.</p>
        </a>
      </div>
    </div>
  );
}
