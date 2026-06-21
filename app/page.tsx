"use client";
import { useState } from "react";
import useScrollReveal from "./hooks/useScrollReveal";
import ModulesInfographic from "./components/ModulesInfographic";
import ModuleDetail from "./components/ModuleDetail";
import { modules } from "./data";

export default function Home() {
  useScrollReveal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = modules.find((m) => m.id === selectedId) || null;

  return (
    <main>
      <section className="hero-glow" style={{ padding: "100px 40px 40px", display: "flex", alignItems: "center", gap: "60px", maxWidth: "1200px", margin: "0 auto", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px" }} className="fade-up">
          <h1 className="tight" style={{ fontSize: "56px", fontWeight: 700, color: "var(--ink)", lineHeight: 1.05, margin: 0 }}>Run your entire business in one system.</h1>
          <p style={{ fontSize: "19px", marginTop: "24px", color: "var(--muted)", maxWidth: "480px", lineHeight: 1.5 }}>EMBORG brings finance, inventory, CRM, HR, sales, and projects together, so nothing falls through the cracks.</p>
          <div style={{ marginTop: "36px", display: "flex", gap: "14px" }}>
            <a href="/contact" className="btn-primary" style={{ padding: "13px 26px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Request a demo</a>
            <a href="/features" className="btn-secondary" style={{ padding: "13px 26px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Explore features</a>
          </div>
        </div>

        <div style={{ flex: "1 1 420px" }} className="fade-up">
          <ModulesInfographic onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      </section>

      <section style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }} className="fade-up">
        <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>About EMBORG</p>
        <h2 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.3 }}>
          A simpler, more affordable alternative to enterprise ERP.
        </h2>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "680px", margin: "0 auto" }}>
          EMBORG is a cloud ERP platform built for small and mid-sized businesses across retail, manufacturing,
          distribution, logistics, healthcare, and restaurants. Instead of stitching together spreadsheets and
          disconnected tools, EMBORG gives every department, inventory, finance, CRM, HR, sales, and
          projects, a single shared system. It is faster to set up than legacy ERP suites, easier for teams to
          actually use, and priced for growing businesses rather than large enterprises.
        </p>
      </section>

      <section style={{ padding: "0 40px 60px", maxWidth: "700px", margin: "0 auto" }} className="fade-up">
        <ModuleDetail module={selected} />
      </section>

      <section style={{ padding: "80px 40px", backgroundColor: "var(--bg-alt)" }}>
        <h2 className="tight fade-up" style={{ textAlign: "center", fontSize: "34px", fontWeight: 700, color: "var(--ink)", marginBottom: "50px" }}>Every department, one platform.</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelectedId(m.id); document.getElementById("module-detail-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              className="fade-up card-interactive"
              style={{ padding: "24px", border: selectedId === m.id ? "2px solid var(--accent)" : "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg)", textAlign: "left", cursor: "pointer", font: "inherit" }}
            >
              <h3 style={{ color: "var(--ink)", margin: "0 0 8px 0", fontSize: "17px" }}>{m.name}</h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{m.problem}</p>
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 40px", textAlign: "center" }} className="fade-up">
        <h2 className="tight" style={{ fontSize: "30px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>See EMBORG on your own data.</h2>
        <p style={{ fontSize: "16px", color: "var(--muted)", margin: "0 0 28px 0" }}>Book a short walkthrough with our team, no commitment required.</p>
        <a href="/contact" className="btn-primary" style={{ padding: "13px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Request a demo</a>
      </section>
    </main>
  );
}
