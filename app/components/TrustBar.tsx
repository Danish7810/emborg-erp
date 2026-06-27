export default function TrustBar() {
  const industries = [
    "Retail", "Manufacturing", "Wholesale Distribution",
    "Logistics", "Healthcare", "Restaurants", "Construction", "Professional Services"
  ];

  return (
    <section style={{ padding: "40px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", backgroundColor: "var(--bg-alt)", overflow: "hidden" }}>
      <p style={{ textAlign: "center", fontSize: "13px", color: "var(--muted)", margin: "0 0 20px 0", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Built for businesses across
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        {industries.map((industry, i) => (
          <span key={i} style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--bg)", whiteSpace: "nowrap" }}>
            {industry}
          </span>
        ))}
      </div>
    </section>
  );
}
