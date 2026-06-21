"use client";
import useScrollReveal from "../hooks/useScrollReveal";

export default function Pricing() {
  useScrollReveal();

  const plans = [
    { name: "Starter", price: "$19", period: "/month", desc: "For small businesses getting started.", highlight: false },
    { name: "Business", price: "$49", period: "/month", desc: "Best for growing SMEs.", highlight: true },
    { name: "Enterprise", price: "Custom", period: "", desc: "For large organizations with custom needs.", highlight: false }
  ];

  return (
    <main>
      <section style={{ padding: "100px 40px 20px", maxWidth: "700px", margin: "0 auto", textAlign: "center" }} className="fade-up">
        <h1 className="tight" style={{ fontSize: "44px", fontWeight: 700, color: "var(--ink)", margin: 0, lineHeight: 1.1 }}>Simple, transparent pricing.</h1>
        <p style={{ fontSize: "17px", color: "var(--muted)", marginTop: "18px", lineHeight: 1.5 }}>No hidden fees. Cancel anytime. Switch plans as you grow.</p>
      </section>

      <section style={{ padding: "60px 40px 30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
          {plans.map((plan, i) => (
            <div key={i} className="fade-up card-interactive" style={{ padding: "32px", backgroundColor: plan.highlight ? "var(--ink)" : "var(--bg-alt)", border: plan.highlight ? "none" : "1px solid var(--line)", borderRadius: "18px", textAlign: "center" }}>
              {plan.highlight && (
                <div style={{ display: "inline-block", padding: "4px 12px", backgroundColor: "var(--accent)", color: "white", borderRadius: "12px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "16px" }}>Most popular</div>
              )}
              <h3 style={{ color: plan.highlight ? "white" : "var(--ink)", margin: "0 0 6px 0", fontSize: "18px" }}>{plan.name}</h3>
              <div style={{ margin: "10px 0 14px 0" }}>
                <span className="tight" style={{ fontSize: "36px", fontWeight: 700, color: plan.highlight ? "white" : "var(--ink)" }}>{plan.price}</span>
                <span style={{ fontSize: "15px", color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--muted)" }}>{plan.period}</span>
              </div>
              <p style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "var(--muted)", fontSize: "14px", margin: "0 0 22px 0" }}>{plan.desc}</p>
              <a href="/contact" className="btn-primary" style={{ display: "inline-block", padding: "11px 24px", backgroundColor: plan.highlight ? "white" : "var(--accent)", color: plan.highlight ? "var(--ink)" : "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Get started</a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "20px 40px 100px", textAlign: "center" }} className="fade-up">
        <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "14px" }}>Secure payments accepted via</p>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 14px" }}>Visa</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 14px" }}>Mastercard</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 14px" }}>UPI</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 14px" }}>Net Banking</span>
        </div>
      </section>
    </main>
  );
}
