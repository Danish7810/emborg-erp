"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Account = { id: string; name: string; account_type: string; };
type JELine = { id?: string; account_id: string; account_name: string; debit: number; credit: number; notes: string; };
type JournalEntry = { id: string; number: string; posting_date: string; entry_type: string; reference: string; remark: string; total_debit: number; total_credit: number; created_at: string; };

const TYPE_COLORS: Record<string, string> = { journal: "#6366F1", contra: "#8B5CF6", bank: "#3B82F6", cash: "#10B981" };
const ACCOUNT_TYPE_COLORS: Record<string, string> = { asset: "#3B82F6", liability: "#EF4444", equity: "#8B5CF6", income: "#10B981", expense: "#F59E0B" };

function emptyLine(): JELine { return { account_id: "", account_name: "", debit: 0, credit: 0, notes: "" }; }

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"entries" | "ledger" | "trial">("entries");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [ledgerAccountId, setLedgerAccountId] = useState("");
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ account: Account; debit: number; credit: number }[]>([]);

  const [postingDate, setPostingDate] = useState("");
  const [entryType, setEntryType] = useState("journal");
  const [reference, setReference] = useState("");
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<JELine[]>([emptyLine(), emptyLine()]);

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); }

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === "trial") computeTrialBalance(); }, [tab, entries]);
  useEffect(() => { if (tab === "ledger" && ledgerAccountId) loadLedger(ledgerAccountId); }, [tab, ledgerAccountId]);

  async function fetchAll() {
    const supabase = createClient();
    const [jeRes, acctRes] = await Promise.all([
      supabase.from("journal_entries").select("*").order("posting_date", { ascending: false }),
      supabase.from("chart_of_accounts").select("*").order("account_type"),
    ]);
    setEntries(jeRes.data || []);
    setAccounts(acctRes.data || []);
    if (acctRes.data && acctRes.data.length && !ledgerAccountId) setLedgerAccountId(acctRes.data[0].id);
    setLoading(false);
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01 && totalDebit > 0;

  function updateLine(idx: number, field: keyof JELine, value: any) {
    const next = [...lines];
    (next[idx] as any)[field] = value;
    if (field === "account_id") {
      const acc = accounts.find(a => a.id === value);
      if (acc) next[idx].account_name = acc.name;
    }
    setLines(next);
  }

  function openAdd() {
    setPostingDate(new Date().toISOString().split("T")[0]); setEntryType("journal"); setReference(""); setRemark("");
    setLines([emptyLine(), emptyLine()]);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isBalanced) { showToast("Debits must equal credits before saving", false); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) { setSaving(false); return; }

    const number = "JE-" + new Date().getFullYear() + "-" + String(entries.length + 1).padStart(4, "0");
    const { data: created, error } = await supabase.from("journal_entries").insert({
      number, posting_date: postingDate || null, entry_type: entryType, reference, remark,
      total_debit: totalDebit, total_credit: totalCredit, company_id: profile.company_id,
    }).select().single();

    if (error || !created) { showToast("Failed to save journal entry", false); setSaving(false); return; }

    const validLines = lines.filter(l => l.account_id && (l.debit > 0 || l.credit > 0));
    await supabase.from("journal_entry_lines").insert(
      validLines.map((l, i) => ({ journal_entry_id: created.id, account_id: l.account_id, account_name: l.account_name, debit: l.debit || 0, credit: l.credit || 0, notes: l.notes, sort_order: i }))
    );

    setShowForm(false); setSaving(false);
    showToast("Journal entry " + number + " posted", true);
    fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry? This affects your ledger balances.")) return;
    const supabase = createClient();
    await supabase.from("journal_entries").delete().eq("id", id);
    fetchAll();
  }

  async function loadLedger(accountId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("journal_entry_lines")
      .select("*, journal_entries(number, posting_date, remark)")
      .eq("account_id", accountId);
    const sorted = (data || []).sort((a: any, b: any) => new Date(a.journal_entries?.posting_date || 0).getTime() - new Date(b.journal_entries?.posting_date || 0).getTime());
    let running = 0;
    const withBalance = sorted.map((l: any) => {
      running += (l.debit || 0) - (l.credit || 0);
      return { ...l, running_balance: running };
    });
    setLedgerLines(withBalance.reverse());
  }

  async function computeTrialBalance() {
    const supabase = createClient();
    const { data } = await supabase.from("journal_entry_lines").select("account_id, debit, credit");
    const totals: Record<string, { debit: number; credit: number }> = {};
    (data || []).forEach((l: any) => {
      if (!totals[l.account_id]) totals[l.account_id] = { debit: 0, credit: 0 };
      totals[l.account_id].debit += l.debit || 0;
      totals[l.account_id].credit += l.credit || 0;
    });
    const rows = accounts.map(acc => ({ account: acc, debit: totals[acc.id]?.debit || 0, credit: totals[acc.id]?.credit || 0 })).filter(r => r.debit > 0 || r.credit > 0);
    setTrialBalance(rows);
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };
  const inputStyle = { padding: "9px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "13px" };

  const grandTotalDebit = trialBalance.reduce((s, r) => s + r.debit, 0);
  const grandTotalCredit = trialBalance.reduce((s, r) => s + r.credit, 0);

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Journal Entries</h1>
          <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>Double-entry bookkeeping and general ledger</p>
        </div>
        <button onClick={openAdd} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>+ New Journal Entry</button>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
        {(["entries", "ledger", "trial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, backgroundColor: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "white" : "var(--muted)" }}>
            {t === "entries" ? "Journal Entries" : t === "ledger" ? "General Ledger" : "Trial Balance"}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>New Journal Entry</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <input type="date" value={postingDate} onChange={e => setPostingDate(e.target.value)} style={inputStyle} />
            <select value={entryType} onChange={e => setEntryType(e.target.value)} style={inputStyle}>
              <option value="journal">Journal</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="contra">Contra</option>
            </select>
            <input placeholder="Reference (optional)" value={reference} onChange={e => setReference(e.target.value)} style={inputStyle} />
            <input placeholder="Remark" value={remark} onChange={e => setRemark(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 110px 110px 1.5fr 32px", gap: "8px", marginBottom: "6px", padding: "0 4px" }}>
              {["Account", "Debit", "Credit", "Notes", ""].map(h => <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{h}</span>)}
            </div>
            {lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 110px 110px 1.5fr 32px", gap: "8px", marginBottom: "8px" }}>
                <select value={l.account_id} onChange={e => updateLine(i, "account_id", e.target.value)} style={inputStyle}>
                  <option value="">Select account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>)}
                </select>
                <input type="number" min="0" step="any" placeholder="0" value={l.debit || ""} onChange={e => updateLine(i, "debit", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input type="number" min="0" step="any" placeholder="0" value={l.credit || ""} onChange={e => updateLine(i, "credit", parseFloat(e.target.value) || 0)} style={inputStyle} />
                <input placeholder="Notes" value={l.notes} onChange={e => updateLine(i, "notes", e.target.value)} style={inputStyle} />
                <button type="button" onClick={() => setLines(lines.length > 2 ? lines.filter((_, x) => x !== i) : lines)} style={{ border: "none", backgroundColor: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}>x</button>
              </div>
            ))}
            <button type="button" onClick={() => setLines([...lines, emptyLine()])} style={{ padding: "7px 14px", backgroundColor: "transparent", color: "var(--accent)", border: "1px dashed var(--accent)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>+ Add Line</button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <div style={{ width: "300px", padding: "14px 16px", borderRadius: "10px", backgroundColor: isBalanced ? "#10B98111" : "#EF444411", border: "1px solid " + (isBalanced ? "#10B98144" : "#EF444444") }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span style={{ color: "var(--muted)" }}>Total Debit</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>INR {totalDebit.toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}><span style={{ color: "var(--muted)" }}>Total Credit</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>INR {totalCredit.toLocaleString()}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, borderTop: "1px solid var(--line)", paddingTop: "6px" }}>
                <span style={{ color: isBalanced ? "#10B981" : "#EF4444" }}>{isBalanced ? "Balanced" : "Difference"}</span>
                <span style={{ color: isBalanced ? "#10B981" : "#EF4444" }}>INR {Math.abs(difference).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={saving || !isBalanced} style={{ flex: 1, padding: "11px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: (saving || !isBalanced) ? 0.5 : 1 }}>{saving ? "Posting..." : "Post Journal Entry"}</button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "11px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      {tab === "entries" && (loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : entries.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "48px" }}><p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No journal entries yet.</p></div>
      ) : (
        <div style={cardStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Entry #", "Date", "Type", "Reference", "Debit", "Credit", "Remark", ""].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {entries.map(je => (
                <tr key={je.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{je.number}</td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{je.posting_date ? new Date(je.posting_date).toLocaleDateString() : "-"}</td>
                  <td style={{ padding: "12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (TYPE_COLORS[je.entry_type] || "#6B7280") + "22", color: TYPE_COLORS[je.entry_type] || "#6B7280" }}>{je.entry_type}</span></td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{je.reference || "-"}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>INR {je.total_debit.toLocaleString()}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>INR {je.total_credit.toLocaleString()}</td>
                  <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{je.remark || "-"}</td>
                  <td style={{ padding: "12px" }}><button onClick={() => handleDelete(je.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "11px", fontWeight: 600 }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === "ledger" && (
        <div>
          <select value={ledgerAccountId} onChange={e => setLedgerAccountId(e.target.value)} style={{ ...inputStyle, width: "280px", marginBottom: "16px" }}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>)}
          </select>
          <div style={cardStyle}>
            {ledgerLines.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>No transactions for this account yet.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Date", "Entry #", "Remark", "Debit", "Credit", "Running Balance"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {ledgerLines.map((l: any, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", color: "var(--muted)" }}>{l.journal_entries?.posting_date ? new Date(l.journal_entries.posting_date).toLocaleDateString() : "-"}</td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{l.journal_entries?.number || "-"}</td>
                      <td style={{ padding: "12px", color: "var(--muted)", fontSize: "12px" }}>{l.journal_entries?.remark || l.notes || "-"}</td>
                      <td style={{ padding: "12px", color: "#10B981" }}>{l.debit > 0 ? "INR " + l.debit.toLocaleString() : "-"}</td>
                      <td style={{ padding: "12px", color: "#EF4444" }}>{l.credit > 0 ? "INR " + l.credit.toLocaleString() : "-"}</td>
                      <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {l.running_balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "trial" && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Trial Balance</h3>
          {trialBalance.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>No journal entries posted yet.</p> : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead><tr style={{ borderBottom: "1px solid var(--line)" }}>{["Account", "Type", "Debit", "Credit"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {trialBalance.map(row => (
                    <tr key={row.account.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "var(--ink)" }}>{row.account.name}</td>
                      <td style={{ padding: "12px" }}><span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: (ACCOUNT_TYPE_COLORS[row.account.account_type] || "#6B7280") + "22", color: ACCOUNT_TYPE_COLORS[row.account.account_type] || "#6B7280" }}>{row.account.account_type}</span></td>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{row.debit > 0 ? "INR " + row.debit.toLocaleString() : "-"}</td>
                      <td style={{ padding: "12px", color: "var(--ink)" }}>{row.credit > 0 ? "INR " + row.credit.toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "var(--bg)" }}>
                    <td colSpan={2} style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>Total</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {grandTotalDebit.toLocaleString()}</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "var(--ink)" }}>INR {grandTotalCredit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: "12px", padding: "10px 16px", borderRadius: "8px", backgroundColor: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01 ? "#10B98111" : "#EF444411" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01 ? "#10B981" : "#EF4444" }}>
                  {Math.abs(grandTotalDebit - grandTotalCredit) < 0.01 ? "Books are balanced" : "Books are NOT balanced - check your entries"}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
