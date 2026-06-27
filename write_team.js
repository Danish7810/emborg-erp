const fs = require("fs");

// ── 1. INVITE API ROUTE ───────────────────────────────────────────
fs.mkdirSync("app/api/invite", { recursive: true });

const inviteApi = `import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, role, companyId, companyName, inviterName } = await req.json();

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("company_id", companyId)
      .eq("accepted", false)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Invitation already sent to this email." }, { status: 400 });
    }

    // Create invitation record
    const { data: invitation, error: invErr } = await supabase
      .from("invitations")
      .insert({ email, role, company_id: companyId })
      .select()
      .single();

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 400 });

    const inviteUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL + "/auth/invite?token=" + invitation.token
      : "https://emborgerp.com/auth/invite?token=" + invitation.token;

    const html = \`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-1px;">EMBORG</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Cloud ERP for SMEs</p>
    </div>
    <div style="padding:40px;">
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;">You have been invited!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">
        <strong>\${inviterName || "A team member"}</strong> has invited you to join <strong>\${companyName || "their team"}</strong> on EMBORG as a <strong>\${role}</strong>.
      </p>
      <a href="\${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#6366F1;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:24px;">
        Accept Invitation
      </a>
      <p style="margin:0 0 8px;font-size:13px;color:#888;">Or copy this link:</p>
      <p style="margin:0;font-size:12px;color:#6366F1;word-break:break-all;">\${inviteUrl}</p>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#6366F1;">EMBORG</strong> - emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>\`;

    await resend.emails.send({
      from: "EMBORG <onboarding@resend.dev>",
      to: email,
      subject: inviterName + " invited you to join " + (companyName || "EMBORG"),
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
`;

fs.writeFileSync("app/api/invite/route.ts", inviteApi, "utf8");
console.log("Invite API:", fs.statSync("app/api/invite/route.ts").size, "bytes");

// ── 2. ACCEPT INVITE PAGE ─────────────────────────────────────────
fs.mkdirSync("app/auth/invite", { recursive: true });

const acceptInvite = `"use client";
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
`;

fs.writeFileSync("app/auth/invite/page.tsx", acceptInvite, "utf8");
console.log("Accept invite page:", fs.statSync("app/auth/invite/page.tsx").size, "bytes");

// ── 3. TEAM SETTINGS PAGE ─────────────────────────────────────────
fs.mkdirSync("app/dashboard/settings", { recursive: true });

const teamSettings = `"use client";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Member = { id: string; full_name: string; role: string; created_at: string; };
type Invitation = { id: string; email: string; role: string; accepted: boolean; created_at: string; };

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/auth/login"; return; }
      setUserEmail(user.email || "");

      const { data: profile } = await supabase.from("profiles").select("company_id, full_name, role").eq("id", user.id).single();
      if (!profile?.company_id) { setLoading(false); return; }
      setCompanyId(profile.company_id);
      setUserName(profile.full_name || "");
      setUserRole(profile.role || "member");

      const { data: company } = await supabase.from("companies").select("name").eq("id", profile.company_id).single();
      setCompanyName(company?.name || "");

      const [{ data: mems }, { data: invs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, created_at").eq("company_id", profile.company_id),
        supabase.from("invitations").select("*").eq("company_id", profile.company_id).order("created_at", { ascending: false }),
      ]);
      setMembers(mems || []);
      setInvitations(invs || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, companyId, companyName, inviterName: userName }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Invitation sent to " + inviteEmail, true);
        setInviteEmail("");
        const supabase = createClient();
        const { data: invs } = await supabase.from("invitations").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
        setInvitations(invs || []);
      } else {
        showToast(data.error || "Failed to send invite", false);
      }
    } catch { showToast("Error sending invite", false); }
    setSending(false);
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const supabase = createClient();
    await supabase.from("profiles").update({ role: newRole }).eq("id", memberId);
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    showToast("Role updated", true);
  }

  async function handleCancelInvite(invId: string) {
    const supabase = createClient();
    await supabase.from("invitations").delete().eq("id", invId);
    setInvitations(invitations.filter(i => i.id !== invId));
    showToast("Invitation cancelled", true);
  }

  const cardStyle = { backgroundColor: "var(--bg-alt)", borderRadius: "14px", padding: "24px", border: "1px solid var(--line)" };
  const isAdmin = userRole === "admin";

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "10px", backgroundColor: toast.ok ? "#10B981" : "#EF4444", color: "white", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: "24px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 700, color: "var(--ink)", margin: "0 0 4px 0" }}>Team Settings</h1>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: 0 }}>{companyName} - Manage your team members and roles</p>
      </div>

      {/* Your account */}
      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Your Account</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "white" }}>{userName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>{userName || userEmail}</p>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>{userEmail}</p>
          </div>
          <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, backgroundColor: isAdmin ? "#6366F122" : "#10B98122", color: isAdmin ? "#6366F1" : "#10B981" }}>
            {userRole.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Invite member */}
      {isAdmin && (
        <div style={{ ...cardStyle, marginBottom: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Invite Team Member</h3>
          <form onSubmit={handleInvite} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
              style={{ flex: 1, minWidth: "200px", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}
            />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ padding: "10px 14px", border: "1px solid var(--line)", borderRadius: "10px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px" }}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={sending} style={{ padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", opacity: sending ? 0.7 : 1 }}>
              {sending ? "Sending..." : "Send Invite"}
            </button>
          </form>
        </div>
      )}

      {/* Team members */}
      <div style={{ ...cardStyle, marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Team Members ({members.length})</h3>
        {loading ? <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{(m.full_name || "?").charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>{m.full_name || "Unknown"}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Joined {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                {isAdmin ? (
                  <select value={m.role || "member"} onChange={e => handleRoleChange(m.id, e.target.value)}
                    style={{ padding: "5px 10px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg-alt)", color: "var(--ink)", fontSize: "12px", fontWeight: 600 }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, backgroundColor: m.role === "admin" ? "#6366F122" : "#10B98122", color: m.role === "admin" ? "#6366F1" : "#10B981" }}>
                    {(m.role || "member").toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.filter(i => !i.accepted).length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", margin: "0 0 16px 0" }}>Pending Invitations</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {invitations.filter(i => !i.accepted).map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "var(--bg)", borderRadius: "10px", border: "1px solid var(--line)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#F59E0B22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>{inv.email}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>Invited {new Date(inv.created_at).toLocaleDateString()} as {inv.role}</p>
                </div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "#F59E0B22", color: "#F59E0B" }}>PENDING</span>
                {isAdmin && (
                  <button onClick={() => handleCancelInvite(inv.id)} style={{ padding: "5px 12px", backgroundColor: "transparent", color: "#EF4444", border: "1px solid #EF4444", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.mkdirSync("app/dashboard/settings", { recursive: true });
fs.writeFileSync("app/dashboard/settings/page.tsx", teamSettings, "utf8");
console.log("Team settings:", fs.statSync("app/dashboard/settings/page.tsx").size, "bytes");
