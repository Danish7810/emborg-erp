export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid var(--line)", backgroundColor: "var(--bg-alt)", padding: "60px 40px 30px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <img src="/brand/logo.svg" alt="EMBORG" width="24" height="24" />
            <span className="tight" style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, maxWidth: "260px", margin: 0 }}>
            Simplifying business operations for growing SMEs across finance, inventory, CRM, HR, sales, and projects.
          </p>
        </div>

        <div style={{ display: "flex", gap: "50px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Product</p>
            <a href="/features" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Features</a>
            <a href="/pricing" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Pricing</a>
          </div>

          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Company</p>
            <a href="/" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>About</a>
            <a href="/" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Blog</a>
            <a href="/" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Careers</a>
          </div>

          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Get in touch</p>
            <a href="/contact" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Contact</a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "40px auto 0", paddingTop: "20px", borderTop: "1px solid var(--line)", fontSize: "13px", color: "var(--muted)" }}>
        Copyright {year} EMBORG. All rights reserved.
      </div>
    </footer>
  );
}
