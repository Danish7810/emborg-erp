const fs = require('fs');
const path = require('path');

const footerPath = path.join('C:\\Users\\Danish\\emborg', 'app', 'components', 'Footer.tsx');

const newFooter = `export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid var(--line)", backgroundColor: "var(--bg-alt)", padding: "60px 40px 30px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>

        {/* Brand */}
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <img src="/brand/logo.svg" alt="EMBORG" width="24" height="24" />
            <span className="tight" style={{ fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "260px", margin: "0 0 16px 0" }}>
            Simplifying business operations for growing SMEs across finance, inventory, CRM, HR, sales, and projects.
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
            <a href="mailto:support@emborgerp.com" style={{ color: "var(--accent)", textDecoration: "none" }}>support@emborgerp.com</a>
          </p>
        </div>

        <div style={{ display: "flex", gap: "50px", flexWrap: "wrap" }}>

          {/* Product */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Product</p>
            <a href="/features" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Features</a>
            <a href="/pricing" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Pricing</a>
            <a href="/blog" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Blog</a>
          </div>

          {/* Company */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Company</p>
            <a href="/about" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>About</a>
            <a href="/contact" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Contact</a>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 14px 0" }}>Legal</p>
            <a href="/privacy" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Privacy Policy</a>
            <a href="/terms" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none", marginBottom: "10px" }}>Terms of Service</a>
            <a href="/refund" style={{ display: "block", fontSize: "14px", color: "var(--ink)", textDecoration: "none" }}>Refund Policy</a>
          </div>

        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "40px auto 0", paddingTop: "20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontSize: "13px", color: "var(--muted)" }}>
        <span>Copyright {year} EMBORG. All rights reserved.</span>
        <span>Built in India 🇮🇳</span>
      </div>
    </footer>
  );
}
`;

fs.writeFileSync(footerPath, newFooter, { encoding: 'utf8' });
console.log('✅ Footer.tsx fixed');
console.log('   About → /about');
console.log('   Blog → /blog');
console.log('   Legal section: Privacy / Terms / Refund — all styled consistently');
console.log('   Added support email');
console.log('   Added "Built in India" tagline');
console.log('\nRun: npm run build && git add . && git commit -m "Fix footer links" && git push');
