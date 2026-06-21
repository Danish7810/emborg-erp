export default function Pricing() {
  const plans = [
    { name: "Starter", price: "$19/month", desc: "For small businesses getting started", highlight: false },
    { name: "Business", price: "$49/month", desc: "Best for growing SMEs", highlight: true },
    { name: "Enterprise", price: "Custom", desc: "For large organizations", highlight: false }
  ];

  return (
    <main style={{ padding: "80px 20px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center", fontSize: "36px", color: "#0f172a", marginBottom: "10px" }}>
        Simple, Transparent Pricing
      </h1>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "50px" }}>
        Choose the plan that fits your business.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        {plans.map((plan, i) => (
          <div key={i} style={{
            padding: "30px",
            backgroundColor: "white",
            border: plan.highlight ? "2px solid #2563eb" : "1px solid #e2e8f0",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <h3 style={{ color: "#0f172a" }}>{plan.name}</h3>
            <h2 style={{ fontSize: "28px", margin: "10px 0", color: "#2563eb" }}>{plan.price}</h2>
            <p style={{ color: "#64748b" }}>{plan.desc}</p>
            <a href="/contact" style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: plan.highlight ? "#2563eb" : "white",
              color: plan.highlight ? "white" : "#2563eb",
              border: "1px solid #2563eb",
              borderRadius: "8px",
              textDecoration: "none"
            }}>
              Get Started
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
