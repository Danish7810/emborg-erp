import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../../lib/apiAuth";

// Service-role client — bypasses RLS. Only used AFTER we've verified
// the caller is a logged-in member of the company they're inviting into.
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ── 1. Require a logged-in user ──────────────────────────────
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth; // 401
    const { user, supabase } = auth;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { email, role, companyId, companyName, inviterName } = await req.json();

    if (!email || !companyId) {
      return NextResponse.json({ error: "Missing email or companyId" }, { status: 400 });
    }

    // ── 2. Verify the caller actually belongs to this company ────
    // Uses the AUTHENTICATED client (RLS-scoped) — if this returns
    // nothing, the caller does not belong to companyId and we stop.
    const { data: callerProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.company_id !== companyId) {
      return NextResponse.json({ error: "You do not have permission to invite to this company." }, { status: 403 });
    }

    // Optional but recommended: only Admins can invite
    if (callerProfile.role && callerProfile.role !== "Admin") {
      return NextResponse.json({ error: "Only Admins can invite team members." }, { status: 403 });
    }

    // ── 3. Check for an existing pending invite (service client — bypasses RLS safely, we already verified permission) ──
    const { data: existing } = await serviceClient
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("company_id", companyId)
      .eq("accepted", false)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Invitation already sent to this email." }, { status: 400 });
    }

    // ── 4. Create the invitation record ──────────────────────────
    const { data: invitation, error: invErr } = await serviceClient
      .from("invitations")
      .insert({ email, role, company_id: companyId })
      .select()
      .single();

    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 400 });

    const inviteUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL + "/auth/invite?token=" + invitation.token
      : "https://www.emborgerp.com/auth/invite?token=" + invitation.token;

    const html = `<!DOCTYPE html>
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
        <strong>${inviterName || "A team member"}</strong> has invited you to join <strong>${companyName || "their team"}</strong> on EMBORG as a <strong>${role}</strong>.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#6366F1;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:24px;">
        Accept Invitation
      </a>
      <p style="margin:0 0 8px;font-size:13px;color:#888;">Or copy this link:</p>
      <p style="margin:0;font-size:12px;color:#6366F1;word-break:break-all;">${inviteUrl}</p>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#6366F1;">EMBORG</strong> - emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: "EMBORG <onboarding@resend.dev>",
      to: email,
      subject: inviterName + " invited you to join " + (companyName || "EMBORG"),
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
  }
}
