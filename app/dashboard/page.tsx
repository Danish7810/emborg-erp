"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

type Stats = { contacts: number; leads: number; won: number; pipeline: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ contacts: 0, leads: 0, won: 0, pipeline: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserName(user.user_metadata?.full_name?.split(" ")[0] || "there");
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
    fetchData();
  }, []);

  const cards = [
    { label: "Total Contacts", value: stats.contacts, prefix: "" },
    { label: "Total Leads", value: stats.leads, prefix: "" },
    { label: "Won Revenue", value: stats.won, prefix: "$" },
    { label: "Pipeline Value", value: stats.pipeline, prefix: "$" },
  ];

  const steps = [
    { number: "1", title: "Add your first contact", desc: "Import a customer or prospect you are currently working with.", href: "/dashboard/contacts", cta: "Go to Contacts", done: stats.contacts > 0 },
    { number: "2", title: "Create your first lead", desc: "Track a deal through your pipeline from New to Won.", href: "/dashboard/leads", cta: "Go to Leads", done: stats.leads > 0 },
    { number: "3", title: "Book a demo with our team", desc: "We will walk you through EMBORG and help you get set up.", href: "https://calendly.com/kazidanish-er/30min", cta: "Book a call", done: false },
  ];

  const allDone = stats.contacts > 0 && stats.leads > 0;

  return (
    <div>
      <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>
        {loading ? "Dashboard" : `Welcome, ${userName}`}
      </h1>
      <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 32px 0" }}>Your CRM at a glance.</p>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
            {cards.map((card, i) => (
              <div key={i} style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px 0" }}>{card.label}</p>
                <p className="tight" style={{ fontSize: "32px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>{card.prefix}{card.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {!allDone && (
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>Get started with EMBORG</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", border: `1px solid ${step.done ? "#10B981" : "var(--line)"}`, borderRadius: "14px", backgroundColor: step.done ? "#F0FDF4" : "var(--bg)" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: step.done ? "#10B981" : "var(--bg-alt)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {step.done ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--muted)" }}>{step.number}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px 0", textDecoration: step.done ? "line-through" : "none", opacity: step.done ? 0.5 : 1 }}>{step.title}</p>
                      <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{step.desc}</p>
                    </div>
                    {!step.done && (
                      <a href={step.href} style={{ padding: "8px 16px", backgroundColor: "var(--accent)", color: "white", borderRadius: "16px", textDecoration: "none", fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap", flexShrink: 0 }}>{step.cta}</a>
                    )}
                  </div>
                ))}
              </div>
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
        </>
      )}
    </div>
  );
}
