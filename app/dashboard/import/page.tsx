"use client";
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
      else if (ch === "\n" || ch === "\r") {
        if (field !== "" || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
        if (ch === "\r" && text[i + 1] === "\n") i++;
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
        if (errors.length < 5) errors.push(`Rows ${i + 1}–${i + batch.length}: ${error.message}`);
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
            {importing ? "Importing…" : `Import ${rows.length} contacts`}
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
