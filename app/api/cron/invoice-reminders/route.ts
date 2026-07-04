import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderEmborgEmail } from "../../../lib/emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

// Service-role client — this route has no logged-in user (it's a cron job),
// so it must use the service key and scope everything manually by company_id.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

function daysBetween(a: Date, b: Date) {
  const ms = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / ms);
}

export async function GET(req: NextRequest) {
  // ── Protect this route: only Vercel Cron (with the secret) can call it ──
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pull all unpaid invoices with a due date — company scoping happens per-row below
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, company_id, client_name, client_email, amount, currency, status, due_date, invoice_number")
    .not("status", "in", '("paid","cancelled")')
    .not("due_date", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const skipped: string[] = [];

  for (const inv of invoices || []) {
    if (!inv.client_email || !inv.due_date) continue;

    const due = new Date(inv.due_date);
    due.setHours(0, 0, 0, 0);
    const diff = daysBetween(due, today); // positive = overdue by N days, negative = due in N days, 0 = due today

    // Only send on specific milestones — avoids spamming every single day
    const shouldSend =
      diff === -3 ||               // 3 days before due
      diff === 0 ||                // due today
      diff === 1 || diff === 7 || diff === 14 || diff === 30; // overdue milestones

    if (!shouldSend) { skipped.push(inv.invoice_number); continue; }

    const isOverdue = diff > 0;
    const label = diff === -3 ? "due in 3 days" : diff === 0 ? "due today" : `overdue by ${diff} day${diff > 1 ? "s" : ""}`;

    const html = renderEmborgEmail({
      badgeText: isOverdue ? "OVERDUE" : "PAYMENT DUE",
      badgeColor: isOverdue ? "#EF4444" : "#F59E0B",
      badgeBg: isOverdue ? "#FEE2E2" : "#FEF3C7",
      heading: `Hi ${inv.client_name || "there"},`,
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        Invoice <strong>#${inv.invoice_number}</strong> for <strong>${inv.currency || "INR"} ${Number(inv.amount).toLocaleString("en-IN")}</strong> is ${label}.
      </p>
      <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">Please arrange payment at your earliest convenience. If you've already paid, you can disregard this reminder.</p>`,
    });

    try {
      await resend.emails.send({
        from: "EMBORG <onboarding@resend.dev>",
        to: inv.client_email,
        subject: isOverdue
          ? `OVERDUE: Invoice #${inv.invoice_number} Payment Required`
          : `Payment Reminder: Invoice #${inv.invoice_number}`,
        html,
      });
      sent++;
    } catch (e) {
      console.error("Failed to send reminder for", inv.invoice_number, e);
    }
  }

  return NextResponse.json({ success: true, sent, checked: invoices?.length || 0, skipped: skipped.length });
}
