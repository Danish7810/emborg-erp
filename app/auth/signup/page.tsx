"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, company_name: companyName } }
    });

    if (signupError) { setError(signupError.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
        <div style={{ maxWidth: "400px", padding: "40px", border: "1px solid var(--line)", borderRadius: "20px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="tight" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Account created!</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px 0" }}>Welcome to EMBORG. Click below to sign in and start using your CRM.</p>
          <a href="/auth/login" style={{ display: "inline-block", padding: "11px 24px", backgroundColor: "var(--accent)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Go to sign in</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="28" height="28" />
          <span className="tight" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>

        <h1 className="tight" style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0", textAlign: "center" }}>Create your account</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", textAlign: "center", margin: "0 0 28px 0" }}>Start your free EMBORG CRM today</p>

        <form onSubmit={handleSignup} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input type="text" placeholder="Your full name" autoComplete="off" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="text" placeholder="Company name" autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="email" placeholder="Email address" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="password" placeholder="Password (min 6 characters)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />

          {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "12px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", marginTop: "20px" }}>
          Already have an account? <a href="/auth/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </main>
  );
}
