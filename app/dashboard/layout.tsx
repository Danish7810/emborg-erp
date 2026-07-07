"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "../lib/supabase";
import ChatWidget from "../components/ChatWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/auth/login"; return; }
      setUserEmail(data.user.email || "");
    });
  }, []);

  // Close the mobile drawer automatically whenever the route changes
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Usage tracking â€” fire-and-forget log of which page was visited.
  // Silently no-ops if it fails; never blocks the UI.
  useEffect(() => {
    async function logUsage() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data: companyId } = await supabase.rpc("get_my_company_id");
        if (!companyId) return;
        await supabase.from("usage_events").insert({
          company_id: companyId,
          user_id: userData.user.id,
          page: pathname,
        });
      } catch {
        // non-critical â€” ignore
      }
    }
    logUsage();
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  const sections = [
    { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Getting Started", href: "/dashboard/onboarding" }, { label: "Industry Setup", href: "/dashboard/setup" }, { label: "Import Data", href: "/dashboard/import" }, { label: "Usage Analytics", href: "/dashboard/usage" }] },
    { label: "CRM", items: [{ label: "Contacts", href: "/dashboard/contacts" }, { label: "Leads", href: "/dashboard/leads" }, { label: "Pipeline Analytics", href: "/dashboard/pipeline" }, { label: "Quotations", href: "/dashboard/quotations" }] },
    { label: "Operations", items: [{ label: "Inventory", href: "/dashboard/inventory" }, { label: "Finance", href: "/dashboard/finance" }, { label: "Reports", href: "/dashboard/reports" }, { label: "HR and Payroll", href: "/dashboard/hr" }, { label: "Team Settings", href: "/dashboard/settings" }] },
  ];

  const sidebarContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="22" height="22" />
          <span className="tight" style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>
        {/* Close button â€” mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="dashboard-mobile-close"
          aria-label="Close menu"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M6 18L18 6" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.label} style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 4px 8px" }}>{section.label}</p>
          {section.items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
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
    </>
  );

  return (
    <div className="dashboard-shell" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>

      {/* â”€â”€ Mobile top bar â€” only visible below 768px â”€â”€ */}
      <div className="dashboard-mobile-bar" style={{ display: "none" }}>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" style={{ background: "none", border: "none", cursor: "pointer", padding: "6px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 7H20M4 12H20M4 17H20" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="20" height="20" />
          <span className="tight" style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>
        <div style={{ width: "24px" }} />
      </div>

      {/* â”€â”€ Overlay backdrop â€” mobile only, shown when drawer is open â”€â”€ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="dashboard-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 998 }}
        />
      )}

      {/* â”€â”€ Sidebar â€” fixed on desktop, slide-in drawer on mobile â”€â”€ */}
      <aside className={mobileOpen ? "dashboard-sidebar open" : "dashboard-sidebar"} style={{ width: "220px", borderRight: "1px solid var(--line)", padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0, backgroundColor: "var(--bg)" }}>
        {sidebarContent}
      </aside>

      <main className="dashboard-main" style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}

