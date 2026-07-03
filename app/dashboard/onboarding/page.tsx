"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Step = {
  id: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  done: boolean;
};

export default function OnboardingPage() {
  const [steps, setSteps] = useState<Step[]>([
    { id: "contact",  title: "Add your first contact",  desc: "Your customers and prospects live in CRM. Add one to get started.", href: "/dashboard/contacts",  cta: "Add contact",  done: false },
    { id: "lead",     title: "Create your first lead",   desc: "Track a deal through your pipeline from first touch to close.",     href: "/dashboard/leads",     cta: "Add lead",     done: false },
    { id: "product",  title: "Add a product to inventory", desc: "Track stock levels and get low-stock alerts automatically.",     href: "/dashboard/inventory", cta: "Add product",  done: false },
    { id: "invoice",  title: "Raise your first invoice",  desc: "Create a GST-ready invoice and send it in under a minute.",       href: "/dashboard/finance",   cta: "Create invoice", done: false },
    { id: "employee", title: "Add your team in HR",       desc: "Employee profiles power payroll and leave management.",           href: "/dashboard/hr",        cta: "Add employee", done: false },
    { id: "invite",   title: "Invite a team member",      desc: "Give your co-founder or accountant their own secure login.",      href: "/dashboard/settings",  cta: "Invite",       done: false },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkProgress() {
      const supabase = createClient();
      // Each check is best-effort: if a table name differs, that step just stays not-done
      const checks: { id: string; table: string }[] = [
        { id: "contact",  table: "contacts" },
        { id: "lead",     table: "leads" },
        { id: "product",  table: "products" },
        { id: "invoice",  table: "invoices" },
        { id: "employee", table: "employees" },
      ];
      const results: Record<string, boolean> = {};
      for (const c of checks) {
        try {
          const { count, error } = await supabase.from(c.table).select("*", { count: "exact", head: true });
          results[c.id] = !error && (count ?? 0) > 0;
        } catch { results[c.id] = false; }
      }
      setSteps(prev => prev.map(s => ({ ...s, done: results[s.id] ?? s.done })));
      setLoading(false);
    }
    checkProgress();
  }, []);

  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>Welcome to EMBORG 👋</h1>
      <p style={{ fontSize: "15px", color: "var(--muted)", margin: "0 0 28px 0" }}>Complete these steps to get your business fully set up. Most teams finish in under 15 minutes.</p>

      {/* Progress bar */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{doneCount} of {steps.length} complete</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }}>{pct}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "8px", backgroundColor: "var(--bg-alt)", overflow: "hidden", border: "1px solid var(--line)" }}>
          <div style={{ height: "100%", width: pct + "%", backgroundColor: "var(--accent)", borderRadius: "8px", transition: "width 0.6s ease" }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--line)", backgroundColor: s.done ? "var(--bg-alt)" : "var(--bg)", opacity: loading ? 0.6 : 1 }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: s.done ? "#10B981" : "var(--bg-alt)", border: s.done ? "none" : "1px solid var(--line)", color: s.done ? "white" : "var(--muted)", fontSize: "14px", fontWeight: 700 }}>
              {s.done ? "✓" : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.title}</div>
              <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>{s.desc}</div>
            </div>
            {!s.done && (
              <a href={s.href} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "18px", backgroundColor: "var(--accent)", color: "white", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>{s.cta}</a>
            )}
          </div>
        ))}
      </div>

      {doneCount === steps.length && !loading && (
        <div style={{ marginTop: "28px", padding: "24px", borderRadius: "14px", backgroundColor: "var(--bg-alt)", border: "1px solid var(--line)", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>🎉</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>You're fully set up!</div>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>Head to your <a href="/dashboard" style={{ color: "var(--accent)" }}>dashboard</a> to see your business health score.</div>
        </div>
      )}
    </div>
  );
}
