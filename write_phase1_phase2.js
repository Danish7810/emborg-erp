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
// PHASE 1 — API AUTH HELPER (app/lib/apiAuth.ts)
// Every /api route should call requireUser() first.
// ═══════════════════════════════════════════════════════════════════
write('app/lib/apiAuth.ts', `import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Call at the top of every API route handler.
 * Returns { user, supabase } if authenticated, or a 401 response.
 *
 * Usage in any /api route:
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth; // 401
 *   const { user, supabase } = auth;
 */
export async function requireUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* API routes don't need to set cookies */ },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
`);

// ═══════════════════════════════════════════════════════════════════
// PHASE 2 — ONBOARDING WIZARD (app/dashboard/onboarding/page.tsx)
// Checklist-style: detects real progress from the DB, links to pages.
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/onboarding/page.tsx', `"use client";
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
`);

// ═══════════════════════════════════════════════════════════════════
// PHASE 2 — CSV IMPORT (app/dashboard/import/page.tsx)
// Contacts import with column mapping + per-row error reporting.
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/import/page.tsx', `"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase";

const TARGET_FIELDS = [
  { key: "name",    label: "Name (required)" },
  { key: "email",   label: "Email" },
  { key: "phone",   label: "Phone" },
  { key: "company", label: "Company" },
  { key: "notes",   label: "Notes" },
];

function parseCSV(text: string): string[][] {
  // Minimal CSV parser handling quoted fields
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\\n" || ch === "\\r") {
        if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
        if (ch === "\\r" && text[i + 1] === "\\n") i++;
      } else field += ch;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}

export default function ImportPage() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result));
      if (parsed.length < 2) { alert("CSV needs a header row and at least one data row."); return; }
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      // Auto-map columns by name similarity
      const auto: Record<string, number> = {};
      parsed[0].forEach((h, idx) => {
        const l = h.toLowerCase().trim();
        if (l.includes("name") && auto.name === undefined) auto.name = idx;
        else if (l.includes("mail")) auto.email = idx;
        else if (l.includes("phone") || l.includes("mobile")) auto.phone = idx;
        else if (l.includes("compan") || l.includes("org")) auto.company = idx;
        else if (l.includes("note")) auto.notes = idx;
      });
      setMapping(auto);
    };
    reader.readAsText(file);
  }

  async function runImport() {
    if (mapping.name === undefined) { alert("Map the Name column — it's required."); return; }
    setImporting(true);
    const supabase = createClient();

    // Get company id via the security-definer function
    const { data: companyId, error: cidErr } = await supabase.rpc("get_my_company_id");
    if (cidErr || !companyId) {
      alert("Could not resolve your company. Are you signed in?");
      setImporting(false);
      return;
    }

    let ok = 0, failed = 0;
    const errors: string[] = [];
    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50).map(r => {
        const rec: Record<string, unknown> = { company_id: companyId };
        for (const f of TARGET_FIELDS) {
          const idx = mapping[f.key];
          if (idx !== undefined && r[idx] !== undefined && r[idx].trim() !== "") rec[f.key] = r[idx].trim();
        }
        return rec;
      }).filter(r => r.name);

      const { error } = await supabase.from("contacts").insert(batch);
      if (error) {
        failed += batch.length;
        if (errors.length < 5) errors.push(\`Rows \${i + 1}–\${i + batch.length}: \${error.message}\`);
      } else ok += batch.length;
    }
    setResult({ ok, failed, errors });
    setImporting(false);
  }

  return (
    <div style={{ maxWidth: "760px" }}>
      <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>Import contacts</h1>
      <p style={{ fontSize: "15px", color: "var(--muted)", margin: "0 0 28px 0" }}>Upload a CSV, map the columns, and bring your existing contacts into EMBORG in one go.</p>

      {/* Step 1: file */}
      <div style={{ padding: "24px", borderRadius: "14px", border: "1px dashed var(--line)", backgroundColor: "var(--bg-alt)", marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: "0 0 10px 0" }}>1. Choose your CSV file</p>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ fontSize: "14px", color: "var(--muted)" }} />
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "10px 0 0 0" }}>First row must be headers, e.g. Name, Email, Phone, Company</p>
      </div>

      {/* Step 2: mapping */}
      {headers.length > 0 && (
        <div style={{ padding: "24px", borderRadius: "14px", border: "1px solid var(--line)", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>2. Map your columns ({rows.length} rows found)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {TARGET_FIELDS.map(f => (
              <label key={f.key} style={{ fontSize: "13px", color: "var(--muted)" }}>
                {f.label}
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value === "" ? undefined as unknown as number : Number(e.target.value) }))}
                  style={{ display: "block", width: "100%", marginTop: "4px", padding: "9px", borderRadius: "10px", border: "1px solid var(--line)", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}
                >
                  <option value="">— skip —</option>
                  {headers.map((h, idx) => <option key={idx} value={idx}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>
          <button onClick={runImport} disabled={importing} className="btn-primary" style={{ marginTop: "20px", padding: "11px 24px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: importing ? 0.6 : 1 }}>
            {importing ? "Importing…" : \`Import \${rows.length} contacts\`}
          </button>
        </div>
      )}

      {/* Step 3: result */}
      {result && (
        <div style={{ padding: "20px 24px", borderRadius: "14px", border: "1px solid var(--line)", backgroundColor: "var(--bg-alt)" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: result.failed === 0 ? "#10B981" : "#F59E0B", margin: "0 0 6px 0" }}>
            {result.failed === 0 ? "✓ Import complete" : "Import finished with issues"}
          </p>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{result.ok} imported · {result.failed} failed</p>
          {result.errors.map((e, i) => <p key={i} style={{ fontSize: "12px", color: "#EF4444", margin: "6px 0 0 0" }}>{e}</p>)}
          {result.ok > 0 && <a href="/dashboard/contacts" style={{ display: "inline-block", marginTop: "14px", fontSize: "14px", fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>View contacts →</a>}
        </div>
      )}
    </div>
  );
}
`);

// ═══════════════════════════════════════════════════════════════════
// Add Onboarding + Import to the dashboard sidebar
// ═══════════════════════════════════════════════════════════════════
const dashLayoutPath = path.join(ROOT, 'app', 'dashboard', 'layout.tsx');
let dash = fs.readFileSync(dashLayoutPath, 'utf8');
if (!dash.includes('/dashboard/onboarding')) {
  dash = dash.replace(
    `{ label: "Overview", items: [{ label: "Dashboard", href: "/dashboard" }] },`,
    `{ label: "Overview", items: [{ label: "Dashboard", href: "/dashboard" }, { label: "Getting Started", href: "/dashboard/onboarding" }, { label: "Import Data", href: "/dashboard/import" }] },`
  );
  fs.writeFileSync(dashLayoutPath, dash, 'utf8');
  console.log('✅ Sidebar: added Getting Started + Import Data links');
} else {
  console.log('⚠ Sidebar already has onboarding link — skipping');
}

console.log('\\n════ DONE ════');
console.log('Run: npm run build');
