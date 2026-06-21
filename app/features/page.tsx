export default function Features() {
  const modules = [
    { title: "Inventory Management", desc: "Track stock, warehouses, and product flow in real-time." },
    { title: "Accounting and Finance", desc: "Manage invoices, expenses, and financial reports." },
    { title: "CRM", desc: "Track leads, customers, and sales pipelines." },
    { title: "HR and Payroll", desc: "Manage employees, salaries, and attendance." },
    { title: "Sales Management", desc: "Monitor sales performance and orders." },
    { title: "Project Management", desc: "Plan and track projects and tasks efficiently." }
  ];

  return (
    <main style={{ padding: "80px 20px", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center", fontSize: "36px", color: "#0f172a", marginBottom: "10px" }}>
        EMBORG Features
      </h1>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "50px" }}>
        Everything your business needs, in one platform.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        {modules.map((m, i) => (
          <div key={i} style={{
            padding: "25px",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            backgroundColor: "#f8fafc"
          }}>
            <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>{m.title}</h3>
            <p style={{ color: "#64748b", fontSize: "14px" }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
