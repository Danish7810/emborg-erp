export default function Testimonials() {
  const testimonials = [
    { quote: "We cut our monthly close from three days to one afternoon. EMBORG just works.", name: "Priya M.", role: "Finance Lead, Retail Chain", initials: "PM" },
    { quote: "Finally one system for inventory and sales. Our team stopped asking where the data is.", name: "Rajan K.", role: "Operations Manager, Distribution", initials: "RK" },
    { quote: "Setup was fast. We were running payroll on EMBORG within the first week.", name: "Sneha T.", role: "HR Manager, Manufacturing Firm", initials: "ST" }
  ];

  return (
    <section style={{ padding: "80px 40px", backgroundColor: "var(--bg)" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 12px 0", textAlign: "center" }}>What our customers say</p>
      <h2 className="tight fade-up" style={{ textAlign: "center", fontSize: "32px", fontWeight: 700, color: "var(--ink)", margin: "0 0 50px 0" }}>Businesses running better on EMBORG.</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
        {testimonials.map((t, i) => (
          <div key={i} className="fade-up" style={{ padding: "28px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg-alt)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <p style={{ fontSize: "15px", color: "var(--ink)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>"{t.quote}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{t.initials}</span>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{t.name}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
