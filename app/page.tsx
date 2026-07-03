"use client";
import { useState } from "react";
import useScrollReveal from "./hooks/useScrollReveal";
import ModulesInfographic from "./components/ModulesInfographic";
import ModuleDetail from "./components/ModuleDetail";
import StatBar from "./components/StatBar";
import Testimonials from "./components/Testimonials";
import PlatformPillars from "./components/PlatformPillars";
import TrustBar from "./components/TrustBar";
import { modules } from "./data";
import DashboardLink from "./components/DashboardLink";
import PageWrapper from "./components/PageWrapper";

export default function Home() {
  useScrollReveal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = modules.find((m) => m.id === selectedId) || null;

  return (
    <PageWrapper><main>
      <section className="hero-glow" style={{ padding: "100px 40px 40px", display: "flex", alignItems: "center", gap: "60px", maxWidth: "1200px", margin: "0 auto", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px" }} className="fade-up">
          <h1 className="tight" style={{ fontSize: "56px", fontWeight: 700, color: "var(--ink)", lineHeight: 1.05, margin: 0 }}>Run your entire business in one system.</h1>
          <p style={{ fontSize: "19px", marginTop: "24px", color: "var(--muted)", maxWidth: "480px", lineHeight: 1.5 }}>EMBORG brings finance, inventory, CRM, HR, sales, and projects together, so nothing falls through the cracks.</p>
          <div style={{ marginTop: "36px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="/contact" className="btn-primary" style={{ padding: "13px 26px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Request a demo</a>
            <DashboardLink /><a href="/features" className="btn-secondary" style={{ padding: "13px 26px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Explore features</a>
          </div>
        </div>

        <div style={{ flex: "1 1 420px" }} className="fade-up">
          <ModulesInfographic onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      </section>

      <StatBar />
      {/* Intelligent Enterprise Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "var(--bg-alt)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }} className="fade-up">
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>The Future of Business Operations</p>
            <h2 className="tight" style={{ fontSize: "42px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.1 }}>Welcome to the Intelligent Enterprise.</h2>
            <p style={{ fontSize: "18px", color: "var(--muted)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>Where your team, your data, and AI work together to drive growth, cut costs, and delight customers.</p>
          </div>

          {/* 4 pillars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "56px" }}>
            {[
              { icon: "AI", color: "#6366F1", title: "EMBORG AI", desc: "Always-on AI assistant that answers questions, surfaces insights, and guides your team in real time.", href: "/dashboard" },
              { icon: "CRM", color: "#3B82F6", title: "Customer 360", desc: "Every contact, lead, deal, and interaction in one place. Full pipeline visibility from first touch to closed deal.", href: "/features" },
              { icon: "OPS", color: "#10B981", title: "Operations Hub", desc: "Inventory, finance, HR, and payroll working as one unified system. No more switching between tools.", href: "/features" },
              { icon: "DATA", color: "#F59E0B", title: "Live Intelligence", desc: "Real-time dashboards, pipeline analytics, P&L reports, and forecasts so you always know where you stand.", href: "/dashboard" },
            ].map(p => (
              <a key={p.title} href={p.href} style={{ textDecoration: "none" }} className="fade-up">
                <div style={{ backgroundColor: "var(--bg)", borderRadius: "16px", padding: "28px", border: "1px solid var(--line)", height: "100%", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: p.color + "22", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: p.color, letterSpacing: "0.05em" }}>{p.icon}</span>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0" }}>{p.title}</h3>
                  <p style={{ fontSize: "14px", color: "var(--muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>{p.desc}</p>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: p.color }}>Learn more &rarr;</span>
                </div>
              </a>
            ))}
          </div>

          {/* Bottom banner */}
          <div style={{ backgroundColor: "var(--bg)", borderRadius: "20px", padding: "40px 48px", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }} className="fade-up">
            <div style={{ flex: "1 1 400px" }}>
              <h3 className="tight" style={{ fontSize: "26px", fontWeight: 800, color: "var(--ink)", margin: "0 0 12px 0" }}>Your team and AI, working as one.</h3>
              <p style={{ fontSize: "15px", color: "var(--muted)", margin: "0", lineHeight: 1.6 }}>
                Your people handle relationships and decisions. EMBORG AI handles data, reminders, and insights. The result? Faster growth, stronger customer relationships, and a business that runs even when you are not watching.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a href="/contact" style={{ padding: "13px 26px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>See EMBORG in action</a>
              <a href="/auth/signup" style={{ padding: "13px 26px", backgroundColor: "transparent", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Start free trial</a>
            </div>
          </div>
        </div>
      </section>
      <TrustBar />

      <section style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }} className="fade-up">
        <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 14px 0" }}>About EMBORG</p>
        <h2 className="tight" style={{ fontSize: "34px", fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", lineHeight: 1.1 }}>A simpler, more affordable alternative to enterprise ERP.</h2>
        <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "680px", margin: "0 auto" }}>
          EMBORG is a cloud ERP platform built for small and mid-sized businesses across retail, manufacturing,
          distribution, logistics, healthcare, and restaurants. Instead of stitching together spreadsheets and
          disconnected tools, EMBORG gives every department a single shared system. Faster to set up than
          legacy ERP suites, easier to use, and priced for growing businesses.
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

      <PlatformPillars />
      <Testimonials />

      <section style={{ padding: "80px 40px", textAlign: "center" }} className="fade-up">
        <h2 className="tight" style={{ fontSize: "30px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>See EMBORG on your own data.</h2>
        <p style={{ fontSize: "16px", color: "var(--muted)", margin: "0 0 28px 0" }}>Book a short walkthrough with our team, no commitment required.</p>
        <a href="/contact" className="btn-primary" style={{ padding: "13px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "24px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Request a demo</a>
      </section>
    </main></PageWrapper>
  );
}







