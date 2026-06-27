"use client";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/auth/login"; return; }
      setUserEmail(data.user.email || "");
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Contacts", href: "/dashboard/contacts" },
    { label: "Leads", href: "/dashboard/leads" },
    { label: "Inventory", href: "/dashboard/inventory" },
    { label: "Finance", href: "/dashboard/finance" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
      <aside style={{ width: "220px", borderRight: "1px solid var(--line)", padding: "24px 12px", display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 8px 24px" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="22" height="22" />
          <span className="tight" style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>

        {navItems.map((item) => (
          <a key={item.href} href={item.href} style={{ padding: "10px 12px", borderRadius: "10px", textDecoration: "none", color: "var(--muted)", fontSize: "14px", fontWeight: 500 }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = "var(--bg-alt)"; (e.target as HTMLElement).style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = "transparent"; (e.target as HTMLElement).style.color = "var(--muted)"; }}
          >{item.label}</a>
        ))}

        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 8px 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          <a href="/" style={{ display: "block", padding: "10px 12px", borderRadius: "10px", textDecoration: "none", color: "var(--muted)", fontSize: "14px", marginBottom: "4px" }}>Back to site</a>
          <button onClick={handleSignOut} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "none", backgroundColor: "transparent", color: "var(--muted)", fontSize: "14px", cursor: "pointer", textAlign: "left" }}>Sign out</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

