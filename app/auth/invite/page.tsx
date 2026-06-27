"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function AcceptInvitePage() {
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    setToken(t);
    if (!t) { setError("Invalid invite link."); setLoading(false); return; }
    const supabase = createClient();
    supabase.from("invitations").select("*").eq("token", t).eq("accepted", false).single().then(({ data, error }) => {
      if (error || !data) { setError("This invite link is invalid or has already been used."); }
      else { setInvitation(data); }
      setLoading(false);
    });
  }, []);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: { data: { full_name: fullName, company_id: invitation.company_id, role: invitation.role } }
    });
    if (signupError) { setError(signupError.message); setSaving(false); return; }
    await supabase.from("invitations").update({ accepted: true }).eq("token", token);
    setDone(true);
    setSaving(false);
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}><p style={{ color: "var(--muted)" }}>Loading...</p></div>;

  if (done) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)" }}>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#10B98122", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: "0 0 8px" }}>Account created!</h2>
        <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 24px" }}>Check your email to confirm, then log in.</p>
        <a href="/auth/login" style={{ padding: "12px 28px", backgroundColor: "var(--accent)", color: "white", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>Go to Login</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="tight" style={{ fontSize: "32px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>EMBORG</h1>
          {error ? (
            <p style={{ color: "#EF4444", fontSize: "14px" }}>{error}</p>
          ) : (
            <>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>Accept Invitation</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>You have been invited as <strong>{invitation?.role}</strong></p>
            </>
          )}
        </div>
        {!error && invitation && (
          <form onSubmit={handleAccept} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input value={invitation.email} disabled style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg-alt)", color: "var(--muted)", fontSize: "14px" }} />
            <input placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <input placeholder="Create a password" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: "12px 16px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }} />
            <button type="submit" disabled={saving} style={{ padding: "13px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Creating account..." : "Join Team"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
