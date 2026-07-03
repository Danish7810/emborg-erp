"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import ChatWidget from "../components/ChatWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState("");
  const [path, setPath] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/auth/login"; return; }
      setUserEmail(data.user.email || "");
    });
    setPath(window.location.pathname);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const sections = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Getting Started", href: "/dashboard/onboarding" }, { label: "Import Data", href: "/dashboard/import" }] },
    { label: "CRM", items: [{ label: "Contacts", href: "/dashboard/contacts" }, { label: "Leads", href: "/dashboard/leads" }, { label: "Pipeline Analytics", href: "/dashboard/pipeline" }] },
    { label: "Operations", items: [{ label: "Inventory", href: "/dashboard/inventory" }, { label: "Finance", href: "/dashboard/finance" }, { label: "Reports", href: "/dashboard/reports" }, { label: "HR and Payroll", href: "/dashboard/hr" }, { label: "Team Settings", href: "/dashboard/settings" }] },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <aside style={{ width: "220px", borderRight: "1px solid var(--line)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: "0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 8px 20px" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="22" height="22" />
          <span className="tight" style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>

        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 4px 8px" }}>{section.label}</p>
            {section.items.map((item) => {
              const active = path === item.href || path.startsWith(item.href + "/");
              return (
                <a key={item.href} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: "10px", textDecoration: "none", color: active ? "var(--ink)" : "var(--muted)", fontSize: "14px", fontWeight: active ? 600 : 400, backgroundColor: active ? "var(--bg-alt)" : "transparent" }}
                  onMouseEnter={(e) => { if (!active) { (e.target as HTMLElement).style.backgroundColor = "var(--bg-alt)"; (e.target as HTMLElement).style.color = "var(--ink)"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.target as HTMLElement).style.backgroundColor = "transparent"; (e.target as HTMLElement).style.color = "var(--muted)"; } }}
                >{item.label}</a>
              );
            })}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 8px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          <a href="/" style={{ display: "block", padding: "9px 12px", borderRadius: "10px", textDecoration: "none", color: "var(--muted)", fontSize: "14px", marginBottom: "2px" }}>Back to site</a>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "none", backgroundColor: "transparent", color: "var(--muted)", fontSize: "14px", cursor: "pointer", textAlign: "left" }}>Sign out</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}






