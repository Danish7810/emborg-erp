export default function PlatformPillars() {
  const pillars = [
    { name: "CRM", desc: "Keep every customer, lead, and deal in one pipeline. Never lose a follow-up again.", href: "/dashboard/contacts", color: "#3B82F6" },
    { name: "Inventory", desc: "Real-time stock levels across every warehouse and location.", href: "/dashboard/inventory", color: "#10B981" },
    { name: "Finance", desc: "Automated invoicing, expense tracking, and live financial reports.", href: "/features", color: "#F59E0B" },
    { name: "HR and Payroll", desc: "Pay people correctly and on time, every single cycle.", href: "/features", color: "#8B5CF6" },
  ];

  return (
    <section style={{ padding: "80px 40px", backgroundColor: "var(--bg)" }}>
      <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--accent)", margin: "0 0 12px 0", textAlign: "center" }}>The EMBORG Platform</p>
      <h2 className="tight" style={{ textAlign: "center", fontSize: "34px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Where your whole business runs together.</h2>
      <p style={{ textAlign: "center", fontSize: "16px", color: "var(--muted)", margin: "0 0 50px 0", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
        Finance, inventory, CRM, and HR in one system. No spreadsheets stitched together. No data lost between tools.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto 40px" }}>
        {pillars.map((p, i) => (
          <a key={i} href={p.href} className="card-interactive" style={{ padding: "28px", border: "1px solid var(--line)", borderRadius: "16px", backgroundColor: "var(--bg-alt)", textDecoration: "none", display: "block" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: p.color, marginBottom: "14px", opacity: 0.9 }} />
            <h3 style={{ color: "var(--ink)", margin: "0 0 8px 0", fontSize: "18px" }}>{p.name}</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
          </a>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: "15px", color: "var(--muted)", maxWidth: "700px", margin: "0 auto", lineHeight: 1.7 }}>
        Your teams work inside the systems that run your business. The result? Faster decisions, stronger customer relationships, and growth — all in one place.
      </p>
    </section>
  );
}
