"use client";
import { useState } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import ModuleDetail from "../components/ModuleDetail";
import { modules } from "../data";

export default function Features() {
  useScrollReveal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = modules.find((m) => m.id === selectedId) || null;

  return (
    <main>
      <section style={{ padding: "100px 40px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }} className="fade-up">
        <h1 className="tight" style={{ fontSize: "44px", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>Everything your business needs, in one platform.</h1>
        <p style={{ fontSize: "17px", color: "var(--muted)", marginTop: "18px", lineHeight: 1.5 }}>Six modules. One login. No spreadsheets stitched together at midnight.</p>
      </section>

      <section style={{ padding: "60px 40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); document.getElementById("feature-detail-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              className="fade-up"
              style={{ padding: "28px", border: selectedId === m.id ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg-alt)", textAlign: "left", cursor: "pointer", font: "inherit" }}
            >
              <h3 style={{ color: "var(--ink)", margin: "0 0 10px 0", fontSize: "18px" }}>{m.name}</h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 8px 0", lineHeight: 1.5 }}>{m.problem}</p>
              <p style={{ fontSize: "14px", color: "var(--accent)", margin: 0, fontWeight: 600 }}>{m.outcome}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="feature-detail-anchor" style={{ padding: "0 40px 60px", maxWidth: "700px", margin: "0 auto" }} className="fade-up">
        <ModuleDetail module={selected} />
      </section>

      <section style={{ padding: "0 40px 100px", textAlign: "center" }} className="fade-up">
        <a href="/contact" style={{ padding: "13px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Request a demo</a>
      </section>
    </main>
  );
}
