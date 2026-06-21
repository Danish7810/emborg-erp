import "./globals.css";

export const metadata = {
  title: "EMBORG ERP",
  description: "Modern ERP platform for SMEs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 40px", borderBottom: "1px solid var(--line)", backgroundColor: "rgba(250,250,249,0.8)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 1000 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/brand/logo.svg" alt="EMBORG" width="28" height="28" />
            <span className="tight" style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
          </a>

          <nav style={{ display: "flex", gap: "28px" }}>
            <a href="/" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Home</a>
            <a href="/features" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Features</a>
            <a href="/pricing" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Pricing</a>
            <a href="/contact" style={{ textDecoration: "none", color: "var(--muted)", fontSize: "14px" }}>Contact</a>
          </nav>

          <a href="/contact" style={{ backgroundColor: "var(--accent)", color: "white", padding: "9px 18px", borderRadius: "20px", border: "none", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Request Demo</a>
        </header>

        <div>{children}</div>
      </body>
    </html>
  );
}
