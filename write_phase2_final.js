const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, { encoding: 'utf8' });
  console.log('✅ Written:', relPath);
}

// ═══════════════════════════════════════════════════════════════════
// 1. DASHBOARD LAYOUT — mobile-responsive drawer + usage tracking
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/layout.tsx', `"use client";
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

  // Usage tracking — fire-and-forget log of which page was visited.
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
        // non-critical — ignore
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
    { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Getting Started", href: "/dashboard/onboarding" }, { label: "Import Data", href: "/dashboard/import" }, { label: "Usage Analytics", href: "/dashboard/usage" }] },
    { label: "CRM", items: [{ label: "Contacts", href: "/dashboard/contacts" }, { label: "Leads", href: "/dashboard/leads" }, { label: "Pipeline Analytics", href: "/dashboard/pipeline" }] },
    { label: "Operations", items: [{ label: "Inventory", href: "/dashboard/inventory" }, { label: "Finance", href: "/dashboard/finance" }, { label: "Reports", href: "/dashboard/reports" }, { label: "HR and Payroll", href: "/dashboard/hr" }, { label: "Team Settings", href: "/dashboard/settings" }] },
  ];

  const sidebarContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="22" height="22" />
          <span className="tight" style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>
        {/* Close button — mobile only */}
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg)" }}>

      {/* ── Mobile top bar — only visible below 768px ── */}
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

      {/* ── Overlay backdrop — mobile only, shown when drawer is open ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="dashboard-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 998 }}
        />
      )}

      {/* ── Sidebar — fixed on desktop, slide-in drawer on mobile ── */}
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
`);

// ═══════════════════════════════════════════════════════════════════
// 2. globals.css — add mobile dashboard drawer styles
// ═══════════════════════════════════════════════════════════════════
const cssPath = path.join(ROOT, 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('dashboard-sidebar')) {
  css += `
/* ── Dashboard mobile responsiveness ── */
.dashboard-mobile-bar {
  display: none;
}

.dashboard-overlay {
  display: none;
}

@media (max-width: 900px) {
  .dashboard-mobile-bar {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
  }

  .dashboard-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: 4px 0 24px rgba(0,0,0,0.12);
  }

  .dashboard-sidebar.open {
    transform: translateX(0);
  }

  .dashboard-mobile-close {
    display: block !important;
  }

  .dashboard-overlay {
    display: block !important;
  }

  .dashboard-main {
    padding: 20px !important;
    width: 100%;
  }

  /* Stack the whole dashboard flex container vertically so main content
     sits below the sticky mobile bar instead of beside a hidden sidebar */
  body:has(.dashboard-mobile-bar) {
    overflow-x: hidden;
  }
}
`;
  fs.writeFileSync(cssPath, css, { encoding: 'utf8' });
  console.log('✅ globals.css: mobile dashboard drawer styles added');
} else {
  console.log('⚠ globals.css already has dashboard-sidebar styles — skipping');
}

// ═══════════════════════════════════════════════════════════════════
// 3. USAGE ANALYTICS PAGE — /dashboard/usage
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/usage/page.tsx', `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type PageCount = { page: string; count: number };

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard Home",
  "/dashboard/contacts": "CRM — Contacts",
  "/dashboard/leads": "CRM — Leads",
  "/dashboard/pipeline": "Pipeline Analytics",
  "/dashboard/inventory": "Inventory",
  "/dashboard/finance": "Finance",
  "/dashboard/reports": "Reports",
  "/dashboard/hr": "HR and Payroll",
  "/dashboard/settings": "Team Settings",
  "/dashboard/import": "Data Import",
  "/dashboard/onboarding": "Getting Started",
};

function labelFor(page: string) {
  return PAGE_LABELS[page] || page;
}

export default function UsagePage() {
  const [counts, setCounts] = useState<PageCount[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("usage_events")
        .select("page, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (error || !data) { setLoading(false); return; }

      const byPage: Record<string, number> = {};
      const byDay = new Set<string>();
      for (const row of data) {
        byPage[row.page] = (byPage[row.page] || 0) + 1;
        byDay.add(new Date(row.created_at).toDateString());
      }

      const sorted = Object.entries(byPage)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count);

      setCounts(sorted);
      setTotalEvents(data.length);
      setActiveDays(byDay.size);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = counts[0]?.count || 1;

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>Usage Analytics</h1>
      <p style={{ fontSize: "15px", color: "var(--muted)", margin: "0 0 28px 0" }}>See which parts of EMBORG your team uses most — last 30 days.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>Total Page Views</p>
          <p className="tight" style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>{totalEvents}</p>
        </div>
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>Active Days</p>
          <p className="tight" style={{ fontSize: "26px", fontWeight: 700, color: "#10B981", margin: 0 }}>{activeDays} / 30</p>
        </div>
        <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>Modules Used</p>
          <p className="tight" style={{ fontSize: "26px", fontWeight: 700, color: "#F59E0B", margin: 0 }}>{counts.length}</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p>
      ) : counts.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--line)", borderRadius: "14px" }}>
          <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No usage data yet. Start using EMBORG and check back here in a few days.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {counts.map((c) => (
            <div key={c.page}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{labelFor(c.page)}</span>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{c.count} views</span>
              </div>
              <div style={{ height: "8px", borderRadius: "6px", backgroundColor: "var(--bg-alt)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (c.count / maxCount * 100) + "%", backgroundColor: "var(--accent)", borderRadius: "6px" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`);

console.log('\n════ DONE ════');
console.log('Next: run the SQL file (create_usage_events.sql) in Supabase FIRST');
console.log('Then: npm run build');
