"use client";
import { useState } from "react";
import { INDUSTRY_TEMPLATES } from "../../lib/industryTemplates";

export default function SetupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [includeSample, setIncludeSample] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ template: string; created: Record<string, number>; tips: string[] } | null>(null);
  const [error, setError] = useState("");

  const template = INDUSTRY_TEMPLATES.find(t => t.id === selected);

  async function applyTemplate() {
    if (!selected) return;
    setApplying(true); setError("");
    const r = await fetch("/api/setup/apply-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selected, includeSampleData: includeSample }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Failed to apply template"); setApplying(false); return; }
    setResult(d);
    setStep(3);
    setApplying(false);
  }

  return (
    <div style={{ maxWidth: "780px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>Industry Setup</h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0 }}>Set up EMBORG for your specific business type in under 2 minutes.</p>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "36px" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, backgroundColor: step >= s ? "var(--accent)" : "var(--bg-alt)", color: step >= s ? "white" : "var(--muted)", border: step >= s ? "none" : "1px solid var(--line)" }}>{s}</div>
            <span style={{ fontSize: "13px", color: step === s ? "var(--ink)" : "var(--muted)", fontWeight: step === s ? 600 : 400 }}>{["Pick industry", "Confirm setup", "Done"][s - 1]}</span>
            {s < 3 && <div style={{ width: "32px", height: "1px", backgroundColor: step > s ? "var(--accent)" : "var(--line)" }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Pick Industry ── */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: "15px", color: "var(--muted)", marginBottom: "20px" }}>What kind of business do you run?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            {INDUSTRY_TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                style={{ padding: "20px", border: selected === t.id ? "2px solid " + t.color : "1px solid var(--line)", borderRadius: "14px", backgroundColor: selected === t.id ? t.color + "10" : "var(--bg)", textAlign: "left", cursor: "pointer", font: "inherit", transition: "all 0.15s" }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>{t.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)", marginBottom: "6px" }}>{t.name}</div>
                <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{t.description}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => selected && setStep(2)}
            disabled={!selected}
            className="btn-primary"
            style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: selected ? "pointer" : "not-allowed", opacity: selected ? 1 : 0.5 }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 2 && template && (
        <div>
          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "36px" }}>{template.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--ink)" }}>{template.name} Template</div>
                <div style={{ fontSize: "14px", color: "var(--muted)" }}>{template.description}</div>
              </div>
            </div>

            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>What gets set up:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>📦 INVENTORY CATEGORIES ({template.inventoryCategories.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.inventoryCategories.slice(0, 4).join(", ")}{template.inventoryCategories.length > 4 ? " +" + (template.inventoryCategories.length - 4) + " more" : ""}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>💰 EXPENSE CATEGORIES ({template.expenseCategories.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.expenseCategories.slice(0, 4).join(", ")}{template.expenseCategories.length > 4 ? " +" + (template.expenseCategories.length - 4) + " more" : ""}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>📦 SAMPLE PRODUCTS ({template.sampleInventory.length})</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.sampleInventory.map(i => i.name).join(", ")}</div>
              </div>
              <div style={{ padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", marginBottom: "6px" }}>👥 SAMPLE CONTACTS + LEADS</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>{template.sampleContacts.length} contacts · {template.sampleLeads.length} leads</div>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)", cursor: "pointer" }}>
              <input type="checkbox" checked={includeSample} onChange={e => setIncludeSample(e.target.checked)} style={{ marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Include sample contacts and leads</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>Adds realistic example data so you can explore EMBORG immediately. Delete them anytime.</div>
              </div>
            </label>
          </div>

          {error && <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={applyTemplate} disabled={applying} className="btn-primary" style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: applying ? 0.6 : 1 }}>
              {applying ? "Setting up..." : "Apply Template"}
            </button>
            <button onClick={() => setStep(1)} style={{ padding: "12px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "15px", cursor: "pointer" }}>Back</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && result && (
        <div>
          <div style={{ padding: "32px", border: "1px solid #10B981", borderRadius: "14px", backgroundColor: "#DCFCE7", marginBottom: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>{result.template} template applied!</h2>
            <p style={{ fontSize: "14px", color: "#166534", margin: "0 0 20px 0" }}>
              Created: {Object.entries(result.created).map(([k, v]) => v + " " + k).join(" · ")}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/dashboard" style={{ padding: "10px 20px", backgroundColor: "#16A34A", color: "white", borderRadius: "18px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Go to Dashboard</a>
              <a href="/dashboard/inventory" style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#166534", border: "1px solid #16A34A", borderRadius: "18px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>View Inventory</a>
            </div>
          </div>

          <div style={{ padding: "24px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0" }}>💡 Tips for your business type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {result.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
