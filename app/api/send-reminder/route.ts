import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { invoiceNumber, client, amount, dueDate, status, recipientEmail } = await req.json();

    const due = dueDate ? new Date(dueDate).toLocaleDateString("en-IN") : "N/A";
    const isOverdue = status === "overdue";
    const subject = isOverdue
      ? "OVERDUE: Invoice #" + invoiceNumber + " Payment Required"
      : "Payment Reminder: Invoice #" + invoiceNumber + " Due Soon";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-1px;">EMBORG</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Cloud ERP for SMEs</p>
    </div>
    <div style="padding:40px;">
      <div style="display:inline-block;padding:6px 14px;background:${isOverdue ? "#FEE2E2" : "#FEF3C7"};border-radius:20px;margin-bottom:24px;">
        <span style="font-size:12px;font-weight:700;color:${isOverdue ? "#EF4444" : "#F59E0B"};">${isOverdue ? "OVERDUE" : "PAYMENT DUE"}</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a2e;">Hi ${client},</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.6;">
        ${isOverdue
          ? "This is a reminder that your payment is overdue. Please arrange payment at your earliest convenience."
          : "This is a friendly reminder that your invoice is due soon. Please arrange payment before the due date."}
      </p>
      <div style="background:#f8f8ff;border-radius:12px;padding:24px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-size:13px;color:#888;">Invoice Number</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:#1a1a2e;text-align:right;">#${invoiceNumber}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Amount Due</td><td style="padding:8px 0;font-size:18px;font-weight:800;color:#6366F1;text-align:right;">INR ${Number(amount).toLocaleString("en-IN")}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Due Date</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:${isOverdue ? "#EF4444" : "#1a1a2e"};text-align:right;">${due}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#888;border-top:1px solid #eee;">Status</td><td style="padding:8px 0;text-align:right;"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${isOverdue ? "#FEE2E2" : "#FEF3C7"};color:${isOverdue ? "#EF4444" : "#F59E0B"};">${status.toUpperCase()}</span></td></tr>
        </table>
      </div>
      <p style="margin:0 0 32px;font-size:14px;color:#888;line-height:1.6;">If you have already made the payment, please disregard this message. For any queries, please reply to this email.</p>
      <div style="border-top:1px solid #eee;padding-top:24px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#6366F1;">EMBORG</strong> - Cloud ERP for SMEs</p>
        <p style="margin:4px 0 0;font-size:12px;color:#aaa;">emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: "EMBORG <onboarding@resend.dev>",
      to: recipientEmail || "kazidanish.er@gmail.com",
      subject,
      html,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
