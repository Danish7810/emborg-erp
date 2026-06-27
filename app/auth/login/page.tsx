"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { window.location.href = "/dashboard"; }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "40px", border: "1px solid var(--line)", borderRadius: "20px", backgroundColor: "var(--bg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
          <img src="/brand/logo.svg" alt="EMBORG" width="28" height="28" />
          <span className="tight" style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)" }}>EMBORG</span>
        </div>

        <h1 className="tight" style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0", textAlign: "center" }}>Welcome back</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", textAlign: "center", margin: "0 0 28px 0" }}>Sign in to your EMBORG account</p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />

          {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "12px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", marginTop: "20px" }}>
          No account yet? <a href="/auth/reset" style={{ color: "var(--accent)", textDecoration: "none" }}>Forgot password?</a> | <a href="/auth/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Create one</a>
        </p>
      </div>
    </main>
  );
}

