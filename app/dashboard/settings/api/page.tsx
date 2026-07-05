"use client";
import { useEffect, useState } from "react";

const ALL_PERMISSIONS = [
  { key: "read:crm", label: "Read CRM", desc: "Read contacts and leads" },
  { key: "write:crm", label: "Write CRM", desc: "Create contacts and leads" },
  { key: "read:finance", label: "Read Finance", desc: "Read invoices and expenses" },
  { key: "write:finance", label: "Write Finance", desc: "Create invoices" },
  { key: "read:inventory", label: "Read Inventory", desc: "Read products and stock" },
  { key: "write:inventory", label: "Write Inventory", desc: "Update stock levels" },
  { key: "read:hr", label: "Read HR", desc: "Read employee list" },
];

const ALL_EVENTS = [
  { key: "contact.created", label: "Contact created" },
  { key: "lead.created", label: "Lead created" },
  { key: "lead.won", label: "Lead won" },
  { key: "lead.lost", label: "Lead lost" },
  { key: "invoice.created", label: "Invoice created" },
  { key: "invoice.paid", label: "Invoice paid" },
  { key: "invoice.overdue", label: "Invoice overdue" },
  { key: "inventory.low_stock", label: "Inventory low stock" },
  { key: "leave.approved", label: "Leave approved" },
  { key: "leave.rejected", label: "Leave rejected" },
];

type ApiKey = { id: string; name: string; key_prefix: string; permissions: string[]; is_active: boolean; last_used_at: string | null; created_at: string };
type Webhook = { id: string; name: string; url: string; events: string[]; is_active: boolean; last_triggered_at: string | null; failure_count: number; created_at: string; secret?: string };

export default function ApiSettingsPage() {
  const [tab, setTab] = useState<"keys" | "webhooks">("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPerms, setKeyPerms] = useState<string[]>([]);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    const r = await fetch("/api/keys"); const d = await r.json();
    setKeys(d.keys || []);
  }
  async function loadWebhooks() {
    const r = await fetch("/api/webhooks"); const d = await r.json();
    setWebhooks(d.webhooks || []);
  }

  useEffect(() => { loadKeys(); loadWebhooks(); }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: keyName, permissions: keyPerms }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setNewKey(d.key); setKeyName(""); setKeyPerms([]); setShowKeyForm(false); setSaving(false); loadKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key? Any app using it will immediately lose access.")) return;
    await fetch("/api/keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadKeys();
  }

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: webhookName, url: webhookUrl, events: webhookEvents }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setNewWebhookSecret(d.webhook.secret); setWebhookName(""); setWebhookUrl(""); setWebhookEvents([]);
    setShowWebhookForm(false); setSaving(false); loadWebhooks();
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    await fetch("/api/webhooks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadWebhooks();
  }

  function togglePerm(p: string) { setKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); }
  function toggleEvent(e: string) { setWebhookEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]); }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const cardStyle = { padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" };
  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", boxSizing: "border-box" as const };
  const btnPrimary = { padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "13px", cursor: "pointer" };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>API & Webhooks</h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0 }}>Connect EMBORG to external tools, automate workflows, and build integrations.</p>
      </div>

      {/* Base URL banner */}
      <div style={{ ...cardStyle, marginBottom: "24px", backgroundColor: "var(--bg)" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>API Base URL</p>
        <code style={{ fontSize: "14px", color: "var(--accent)", fontFamily: "monospace" }}>https://www.emborgerp.com/api/v1</code>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 0 0" }}>All requests require: <code style={{ fontFamily: "monospace" }}>Authorization: Bearer emb_live_...</code></p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {(["keys", "webhooks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: tab === t ? "var(--bg)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontWeight: tab === t ? 600 : 400, fontSize: "13px", cursor: "pointer" }}>
            {t === "keys" ? "API Keys" : "Webhooks"}
          </button>
        ))}
      </div>

      {/* ── Revealed new key ── */}
      {newKey && (
        <div style={{ ...cardStyle, marginBottom: "20px", border: "1px solid #10B981", backgroundColor: "#DCFCE7" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>✓ API key created — copy it now. You will never see it again.</p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <code style={{ flex: 1, fontSize: "13px", backgroundColor: "white", padding: "10px 12px", borderRadius: "8px", border: "1px solid #BBF7D0", fontFamily: "monospace", wordBreak: "break-all" }}>{newKey}</code>
            <button onClick={() => copyToClipboard(newKey)} style={{ ...btnPrimary, backgroundColor: "#16A34A", flexShrink: 0 }}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <button onClick={() => setNewKey(null)} style={{ marginTop: "12px", fontSize: "12px", color: "#166534", background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
        </div>
      )}

      {/* ── Revealed webhook secret ── */}
      {newWebhookSecret && (
        <div style={{ ...cardStyle, marginBottom: "20px", border: "1px solid #10B981", backgroundColor: "#DCFCE7" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>✓ Webhook created — save the signing secret. You will not see it again.</p>
          <code style={{ fontSize: "12px", backgroundColor: "white", padding: "10px 12px", borderRadius: "8px", border: "1px solid #BBF7D0", fontFamily: "monospace", wordBreak: "break-all", display: "block" }}>{newWebhookSecret}</code>
          <p style={{ fontSize: "12px", color: "#166534", margin: "8px 0 0 0" }}>Use this to verify the <code>X-EMBORG-Signature</code> header on incoming requests.</p>
          <button onClick={() => setNewWebhookSecret(null)} style={{ marginTop: "8px", fontSize: "12px", color: "#166534", background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
        </div>
      )}

      {error && <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>{error}</p>}

      {tab === "keys" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>API Keys ({keys.length})</h2>
            <button onClick={() => setShowKeyForm(!showKeyForm)} style={btnPrimary}>+ New Key</button>
          </div>

          {showKeyForm && (
            <form onSubmit={createKey} style={{ ...cardStyle, marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>Key Name</label>
                  <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder='e.g. "Zapier integration"' required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "10px" }}>Permissions</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer", backgroundColor: keyPerms.includes(p.key) ? "var(--accent)" + "10" : "var(--bg)", borderColor: keyPerms.includes(p.key) ? "var(--accent)" : "var(--line)" }}>
                        <input type="checkbox" checked={keyPerms.includes(p.key)} onChange={() => togglePerm(p.key)} style={{ marginTop: "2px" }} />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{p.label}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={saving || keyPerms.length === 0} style={{ ...btnPrimary, opacity: saving || keyPerms.length === 0 ? 0.6 : 1 }}>{saving ? "Creating..." : "Create Key"}</button>
                  <button type="button" onClick={() => setShowKeyForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {keys.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No API keys yet. Create one to start integrating EMBORG with external tools.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {keys.map(k => (
                <div key={k.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", marginBottom: "4px" }}>{k.name}</div>
                    <code style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>{k.key_prefix}••••••••••••</code>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {k.permissions.map(p => <span key={p} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "var(--accent)" + "15", color: "var(--accent)", fontWeight: 600 }}>{p}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</div>
                    <button onClick={() => revokeKey(k.id)} style={{ padding: "6px 14px", backgroundColor: "transparent", color: "#DC2626", border: "1px solid #DC262640", borderRadius: "16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "webhooks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Webhooks ({webhooks.length})</h2>
            <button onClick={() => setShowWebhookForm(!showWebhookForm)} style={btnPrimary}>+ Add Endpoint</button>
          </div>

          {showWebhookForm && (
            <form onSubmit={createWebhook} style={{ ...cardStyle, marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>Endpoint Name</label>
                    <input value={webhookName} onChange={e => setWebhookName(e.target.value)} placeholder='e.g. "Zapier trigger"' required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>URL (https only)</label>
                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "10px" }}>Events to listen for</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                    {ALL_EVENTS.map(ev => (
                      <label key={ev.key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer", backgroundColor: webhookEvents.includes(ev.key) ? "var(--accent)" + "10" : "var(--bg)", borderColor: webhookEvents.includes(ev.key) ? "var(--accent)" : "var(--line)", fontSize: "13px", color: "var(--ink)" }}>
                        <input type="checkbox" checked={webhookEvents.includes(ev.key)} onChange={() => toggleEvent(ev.key)} />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={saving || webhookEvents.length === 0} style={{ ...btnPrimary, opacity: saving || webhookEvents.length === 0 ? 0.6 : 1 }}>{saving ? "Creating..." : "Create Endpoint"}</button>
                  <button type="button" onClick={() => setShowWebhookForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {webhooks.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No webhook endpoints yet. Add one to receive real-time event notifications.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {webhooks.map(w => (
                <div key={w.id} style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", marginBottom: "4px" }}>{w.name}</div>
                    <code style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace", wordBreak: "break-all" }}>{w.url}</code>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {w.events.map(ev => <span key={ev} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#8B5CF620", color: "#8B5CF6", fontWeight: 600 }}>{ev}</span>)}
                    </div>
                    {w.failure_count > 0 && <p style={{ fontSize: "12px", color: "#DC2626", margin: "6px 0 0 0" }}>⚠ {w.failure_count} recent failures</p>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Last triggered: {w.last_triggered_at ? new Date(w.last_triggered_at).toLocaleDateString() : "Never"}</div>
                    <button onClick={() => deleteWebhook(w.id)} style={{ padding: "6px 14px", backgroundColor: "transparent", color: "#DC2626", border: "1px solid #DC262640", borderRadius: "16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API reference */}
      <div style={{ ...cardStyle, marginTop: "32px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>Quick Reference</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { method: "GET", path: "/api/v1/contacts", perm: "read:crm" },
            { method: "POST", path: "/api/v1/contacts", perm: "write:crm" },
            { method: "GET", path: "/api/v1/leads", perm: "read:crm" },
            { method: "POST", path: "/api/v1/leads", perm: "write:crm" },
            { method: "GET", path: "/api/v1/invoices", perm: "read:finance" },
            { method: "POST", path: "/api/v1/invoices", perm: "write:finance" },
            { method: "GET", path: "/api/v1/expenses", perm: "read:finance" },
            { method: "GET", path: "/api/v1/inventory", perm: "read:inventory" },
            { method: "GET", path: "/api/v1/employees", perm: "read:hr" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", backgroundColor: "var(--bg)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: r.method === "GET" ? "#3B82F6" : "#10B981", width: "36px", flexShrink: 0 }}>{r.method}</span>
              <code style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--ink)", flex: 1 }}>{r.path}</code>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "var(--accent)" + "15", color: "var(--accent)", fontWeight: 600, flexShrink: 0 }}>{r.perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
