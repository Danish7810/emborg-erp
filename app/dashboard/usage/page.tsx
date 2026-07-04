"use client";
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
