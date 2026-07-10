import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireUser } from "../../lib/apiAuth";
import { renderEmborgEmail } from "../../lib/emailTemplate";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { leaveRequestId } = await req.json();
    if (!leaveRequestId) return NextResponse.json({ error: "Missing leaveRequestId" }, { status: 400 });

    // Fetch via AUTHENTICATED client — RLS ensures caller can only act on
    // leave requests within their own company.
    const { data: leave, error: leaveErr } = await supabase
      .from("leave_requests")
      .select("id, company_id, employee_id, leave_type, start_date, end_date, status, notes")
      .eq("id", leaveRequestId)
      .single();

    if (leaveErr || !leave) return NextResponse.json({ error: "Leave request not found or access denied" }, { status: 404 });

    if (leave.status !== "approved" && leave.status !== "rejected") {
      return NextResponse.json({ sent: false, reason: "Status is not approved/rejected — nothing to notify" });
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("full_name, email")
      .eq("id", leave.employee_id)
      .single();

    if (!employee?.email) return NextResponse.json({ sent: false, reason: "Employee has no email on file" });

    const isApproved = leave.status === "approved";
    const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const html = renderEmborgEmail({
      badgeText: isApproved ? "APPROVED" : "NOT APPROVED",
      badgeColor: isApproved ? "#16A34A" : "#EF4444",
      badgeBg: isApproved ? "#DCFCE7" : "#FEE2E2",
      heading: `Hi ${employee.full_name || "there"},`,
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        Your <strong>${leave.leave_type}</strong> leave request for <strong>${fmt(leave.start_date)} – ${fmt(leave.end_date)}</strong> has been <strong>${leave.status}</strong>.
      </p>
      ${leave.notes ? `<p style="margin:0;font-size:14px;color:#888;line-height:1.6;">Note: ${leave.notes}</p>` : ""}`,
    });

    await resend.emails.send({
      from: "EMBORG <onboarding@resend.dev>",
      to: employee.email,
      subject: isApproved ? "Your leave request has been approved" : "Update on your leave request",
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Leave notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
