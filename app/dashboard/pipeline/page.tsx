"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Lead = { id: string; title: string; value: number; status: string; notes: string; created_at: string; };

const STAGES = ["new", "contacted", "qualified", "won", "lost"];
const STAGE_LABELS: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", won: "Won", lost: "Lost" };
const STAGE_COLORS: Record<string, string> = { new: "#3B82F6", contacted: "#8B5CF6", qualified: "#F59E0B", won: "#10B981", lost: "#EF4444" };
const STAGE_PROB: Record<string, number> = { new: 0.1, contacted: 0.25, qualified: 0.6, won: 1, lost: 0 };

function fmt(n: number) { return n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0); }

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("leads").select("*").order("created_at", { ascending: true }).then(({ data }) => {
      setLeads(data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "40px", color: "var(--muted)", fontSize: "14px" }}>Loading analytics...</div>;

  const stageCounts: Record<string, number> = {};
  const stageValues: Record<string, number> = {};
  STAGES.forEach(s => { stageCounts[s] = 0; stageValues[s] = 0; });
  leads.forEach(l => { stageCounts[l.status] = (stageCounts[l.status] || 0) + 1; stageValues[l.status] = (stageValues[l.status] || 0) + (l.value || 0); });

  const activeStages = ["new", "contacted", "qualified"];
  const totalActive = activeStages.reduce((s, st) => s + stageCounts[st], 0);
  const maxCount = Math.max(...STAGES.map(s => stageCounts[s]), 1);

  const totalClosed = stageCounts["won"] + stageCounts["lost"];
  const winRate = totalClosed > 0 ? Math.round((stageCounts["won"] / totalClosed) * 100) : 0;
  const totalLeads = leads.length;
  const overallConversion = totalLeads > 0 ? Math.round((stageCounts["won"] / totalLeads) * 100) : 0;

  const forecast = STAGES.reduce((sum, s) => sum + stageValues[s] * STAGE_PROB[s], 0);

  const now = new Date();
  const months: { label: string; created: number; won: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    const created = leads.filter(l => { const ld = new Date(l.created_at); return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear(); }).length;
    const won = leads.filter(l => { const ld = new Date(l.created_at); return l.status === "won" && ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear(); }).length;
    months.push({ label, created, won });
  }
  const maxMonthVal = Math.max(...months.map(m => m.created), 1);

  const funnelStages = ["new", "contacted", "qualified", "won"];
  const dropoffs = funnelStages.map((s, i) => {
    const curr = stageCounts[s];
    const prev = i === 0 ? totalLeads || 1 : stageCounts[funnelStages[i - 1]] || 1;
    return { stage: s, count: curr, rate: Math.round((curr / prev) * 100) };
  });

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "20px", border: "1px solid var(--line)" };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Pipeline Analytics</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{leads.length} total leads tracked</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Total Leads", value: String(leads.length), color: "#3B82F6" },
          { label: "Active Pipeline", value: String(totalActive), color: "#8B5CF6" },
          { label: "Won Deals", value: String(stageCounts["won"]), color: "#10B981" },
          { label: "Win Rate", value: winRate + "%", color: "#10B981" },
          { label: "Overall Conversion", value: overallConversion + "%", color: "#F59E0B" },
          { label: "Weighted Forecast", value: fmt(forecast), color: "#6366F1" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 6px 0", fontWeight: 500 }}>{k.label}</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: k.color, margin: 0 }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: "16px" }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Conversion Funnel</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {funnelStages.map((s, i) => {
              const d = dropoffs[i];
              const barW = maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0;
              return (
                <div key={s}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>{STAGE_LABELS[s]}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{d.count} leads &bull; {d.rate}% from prev</span>
                  </div>
                  <div style={{ height: "28px", backgroundColor: "var(--line)", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: barW + "%", backgroundColor: STAGE_COLORS[s], borderRadius: "6px", display: "flex", alignItems: "center", paddingLeft: "8px", transition: "width 0.4s ease" }}>
                      {barW > 15 && <span style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>{fmt(stageValues[s])}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Stage Breakdown</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STAGES.map(s => {
              const pct = leads.length > 0 ? Math.round((stageCounts[s] / leads.length) * 100) : 0;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: STAGE_COLORS[s], flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "var(--ink)", width: "90px" }}>{STAGE_LABELS[s]}</span>
                  <div style={{ flex: 1, height: "8px", backgroundColor: "var(--line)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pct + "%", backgroundColor: STAGE_COLORS[s], borderRadius: "4px" }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--muted)", width: "60px", textAlign: "right" }}>{stageCounts[s]} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0" }}>Won Revenue</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#10B981", margin: 0 }}>{fmt(stageValues["won"])}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0" }}>Lost Value</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#EF4444", margin: 0 }}>{fmt(stageValues["lost"])}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", margin: "0 0 2px 0" }}>Active Value</p>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#8B5CF6", margin: 0 }}>{fmt(activeStages.reduce((s, st) => s + stageValues[st], 0))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 20px 0" }}>Monthly Trend (Last 6 Months)</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "120px" }}>
          {months.map(m => (
            <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "2px", width: "100%" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>{m.created}</span>
                <div style={{ width: "100%", display: "flex", gap: "2px", justifyContent: "center", alignItems: "flex-end" }}>
                  <div style={{ width: "40%", height: Math.max((m.created / maxMonthVal) * 90, m.created > 0 ? 4 : 0) + "px", backgroundColor: "#3B82F6", borderRadius: "3px 3px 0 0" }} />
                  <div style={{ width: "40%", height: Math.max((m.won / maxMonthVal) * 90, m.won > 0 ? 4 : 0) + "px", backgroundColor: "#10B981", borderRadius: "3px 3px 0 0" }} />
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500 }}>{m.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", backgroundColor: "#3B82F6", borderRadius: "2px" }} /><span style={{ fontSize: "12px", color: "var(--muted)" }}>Created</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", backgroundColor: "#10B981", borderRadius: "2px" }} /><span style={{ fontSize: "12px", color: "var(--muted)" }}>Won</span></div>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Weighted Revenue Forecast</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)" }}>
                {["Stage", "Deals", "Total Value", "Win Probability", "Weighted Value"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.filter(s => s !== "lost").map(s => (
                <tr key={s} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STAGE_COLORS[s] }} />
                      <span style={{ fontWeight: 500, color: "var(--ink)" }}>{STAGE_LABELS[s]}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{stageCounts[s]}</td>
                  <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 500 }}>{fmt(stageValues[s])}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "20px", backgroundColor: STAGE_COLORS[s] + "22", color: STAGE_COLORS[s], fontSize: "12px", fontWeight: 600 }}>{Math.round(STAGE_PROB[s] * 100)}%</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 700 }}>{fmt(stageValues[s] * STAGE_PROB[s])}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "var(--bg-alt)" }}>
                <td colSpan={4} style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>Total Forecast</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#6366F1", fontSize: "16px" }}>{fmt(forecast)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
