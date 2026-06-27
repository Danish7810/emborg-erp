"use client";
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
