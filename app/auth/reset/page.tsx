"use client";
import { useState } from "react";
import { createClient } from "../../lib/supabase";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://emborgerp.com/auth/update-password" });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
        <div style={{ maxWidth: "400px", padding: "40px", border: "1px solid var(--line)", borderRadius: "20px", textAlign: "center" }}>
          <h2 className="tight" style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 12px 0" }}>Check your email</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>We sent a password reset link to <strong>{email}</strong>. Click it to set a new password.</p>
          <a href="/auth/login" style={{ display: "inline-block", marginTop: "20px", padding: "11px 24px", backgroundColor: "var(--accent)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Back to sign in</a>
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

        <h1 className="tight" style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px 0", textAlign: "center" }}>Reset your password</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", textAlign: "center", margin: "0 0 28px 0" }}>Enter your email and we will send you a reset link.</p>

        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
          {error && <p style={{ fontSize: "13px", color: "#dc2626", margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "12px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "15px", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", marginTop: "20px" }}>
          <a href="/auth/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Back to sign in</a>
        </p>
      </div>
    </main>
  );
}
