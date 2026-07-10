const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, { encoding: 'utf8' });
  console.log('✅ Written:', relPath);
}

// ═══════════════════════════════════════════════════════════════════
// SHARED EMAIL TEMPLATE — one branded wrapper, reused by all 3 notifs
// ═══════════════════════════════════════════════════════════════════
write('app/lib/emailTemplate.ts', `type EmailBlock = {
  badgeText: string;
  badgeColor: string;
  badgeBg: string;
  heading: string;
  bodyHtml: string;   // inner paragraphs, already formatted
  ctaText?: string;
  ctaUrl?: string;
};

export function renderEmborgEmail(block: EmailBlock): string {
  return \`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563EB,#4F46E5);padding:32px 40px;">
      <h1 style="margin:0;font-size:28px;font-weight:800;color:white;letter-spacing:-1px;">EMBORG</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Cloud ERP for SMEs</p>
    </div>
    <div style="padding:40px;">
      <div style="display:inline-block;padding:6px 14px;background:\${block.badgeBg};border-radius:20px;margin-bottom:24px;">
        <span style="font-size:12px;font-weight:700;color:\${block.badgeColor};">\${block.badgeText}</span>
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;">\${block.heading}</h2>
      \${block.bodyHtml}
      \${block.ctaUrl ? \`<a href="\${block.ctaUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:#2563EB;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">\${block.ctaText}</a>\` : ""}
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;text-align:center;">
        <p style="margin:0;font-size:12px;color:#aaa;">Sent via <strong style="color:#2563EB;">EMBORG</strong> — emborgerp.com</p>
      </div>
    </div>
  </div>
</body>
</html>\`;
}
`);

// ═══════════════════════════════════════════════════════════════════
// 1. INVOICE DUE REMINDERS — daily cron job (Vercel Cron)
// ═══════════════════════════════════════════════════════════════════
write('app/api/cron/invoice-reminders/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
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
    const label = diff === -3 ? "due in 3 days" : diff === 0 ? "due today" : \`overdue by \${diff} day\${diff > 1 ? "s" : ""}\`;

    const html = renderEmborgEmail({
      badgeText: isOverdue ? "OVERDUE" : "PAYMENT DUE",
      badgeColor: isOverdue ? "#EF4444" : "#F59E0B",
      badgeBg: isOverdue ? "#FEE2E2" : "#FEF3C7",
      heading: \`Hi \${inv.client_name || "there"},\`,
      bodyHtml: \`<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        Invoice <strong>#\${inv.invoice_number}</strong> for <strong>\${inv.currency || "INR"} \${Number(inv.amount).toLocaleString("en-IN")}</strong> is \${label}.
      </p>
      <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">Please arrange payment at your earliest convenience. If you've already paid, you can disregard this reminder.</p>\`,
    });

    try {
      await resend.emails.send({
        from: "EMBORG <onboarding@resend.dev>",
        to: inv.client_email,
        subject: isOverdue
          ? \`OVERDUE: Invoice #\${inv.invoice_number} Payment Required\`
          : \`Payment Reminder: Invoice #\${inv.invoice_number}\`,
        html,
      });
      sent++;
    } catch (e) {
      console.error("Failed to send reminder for", inv.invoice_number, e);
    }
  }

  return NextResponse.json({ success: true, sent, checked: invoices?.length || 0, skipped: skipped.length });
}
`);

// ═══════════════════════════════════════════════════════════════════
// 2. LOW STOCK ALERT — called by the app right after inventory update
// ═══════════════════════════════════════════════════════════════════
write('app/api/notify-low-stock/route.ts', `import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireUser } from "../../lib/apiAuth";
import { renderEmborgEmail } from "../../lib/emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const { user, supabase } = auth;

    const { itemId } = await req.json();
    if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

    // Fetch item using the AUTHENTICATED client — RLS ensures caller can only
    // trigger this for items in their own company.
    const { data: item, error: itemErr } = await supabase
      .from("inventory")
      .select("id, company_id, name, sku, quantity, low_stock_alert, unit")
      .eq("id", itemId)
      .single();

    if (itemErr || !item) return NextResponse.json({ error: "Item not found or access denied" }, { status: 404 });

    if (item.quantity > item.low_stock_alert) {
      return NextResponse.json({ sent: false, reason: "Stock is above threshold" });
    }

    // Get all Admins in this company to notify (service client — safe, we already verified access above)
    const { data: admins } = await serviceClient
      .from("profiles")
      .select("email, full_name")
      .eq("company_id", item.company_id)
      .eq("role", "Admin");

    if (!admins || admins.length === 0) {
      return NextResponse.json({ sent: false, reason: "No admin emails found" });
    }

    const isOut = item.quantity <= 0;
    const html = renderEmborgEmail({
      badgeText: isOut ? "OUT OF STOCK" : "LOW STOCK",
      badgeColor: isOut ? "#EF4444" : "#F59E0B",
      badgeBg: isOut ? "#FEE2E2" : "#FEF3C7",
      heading: isOut ? "Item is out of stock" : "Stock running low",
      bodyHtml: \`<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        <strong>\${item.name}</strong>\${item.sku ? \` (SKU: \${item.sku})\` : ""} has \${item.quantity} \${item.unit || "units"} remaining — at or below your alert threshold of \${item.low_stock_alert}.
      </p>
      <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">Consider reordering soon to avoid running out.</p>\`,
      ctaText: "View Inventory",
      ctaUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.emborgerp.com") + "/dashboard/inventory",
    });

    for (const admin of admins) {
      if (!admin.email) continue;
      await resend.emails.send({
        from: "EMBORG <onboarding@resend.dev>",
        to: admin.email,
        subject: isOut ? \`Out of stock: \${item.name}\` : \`Low stock alert: \${item.name}\`,
        html,
      });
    }

    return NextResponse.json({ sent: true, notified: admins.length });
  } catch (err) {
    console.error("Low stock notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
`);

// ═══════════════════════════════════════════════════════════════════
// 3. LEAVE STATUS NOTIFICATION — called when admin approves/rejects
// ═══════════════════════════════════════════════════════════════════
write('app/api/notify-leave-status/route.ts', `import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireUser } from "../../lib/apiAuth";
import { renderEmborgEmail } from "../../lib/emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const { supabase } = auth;

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
      heading: \`Hi \${employee.full_name || "there"},\`,
      bodyHtml: \`<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        Your <strong>\${leave.leave_type}</strong> leave request for <strong>\${fmt(leave.start_date)} – \${fmt(leave.end_date)}</strong> has been <strong>\${leave.status}</strong>.
      </p>
      \${leave.notes ? \`<p style="margin:0;font-size:14px;color:#888;line-height:1.6;">Note: \${leave.notes}</p>\` : ""}\`,
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
`);

// ═══════════════════════════════════════════════════════════════════
// 4. VERCEL CRON CONFIG — runs invoice-reminders daily at 8:30am IST
// ═══════════════════════════════════════════════════════════════════
const vercelJsonPath = path.join(ROOT, 'vercel.json');
let vercelConfig = { crons: [] };
if (fs.existsSync(vercelJsonPath)) {
  try { vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8')); } catch {}
}
if (!vercelConfig.crons) vercelConfig.crons = [];
const alreadyHasCron = vercelConfig.crons.some(c => c.path === '/api/cron/invoice-reminders');
if (!alreadyHasCron) {
  vercelConfig.crons.push({ path: '/api/cron/invoice-reminders', schedule: '0 3 * * *' });
}
fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2), { encoding: 'utf8' });
console.log('✅ Written: vercel.json (cron: daily at 3:00 UTC = 8:30am IST)');

console.log(`
════════════════════════════════════════
PHASE 2 — EMAIL NOTIFICATIONS: SUMMARY
════════════════════════════════════════
1. Invoice due reminders — runs automatically every day via Vercel Cron
   Sends at: 3 days before due, due today, and overdue milestones (1/7/14/30 days)
   No manual clicking needed anymore.

2. Low stock alerts — POST to /api/notify-low-stock with { itemId }
   Call this right after any inventory quantity update in your inventory page.
   I need to see that page to wire the call in — paste it next.

3. Leave approved/rejected — POST to /api/notify-leave-status with { leaveRequestId }
   Call this right after updating a leave request's status in your HR page.
   I need to see that page to wire the call in — paste it next.

⚠️  ACTION NEEDED — add CRON_SECRET:
   1. Generate a random string (e.g. run: openssl rand -hex 32, or just mash your keyboard 40 chars)
   2. Add to .env.local:      CRON_SECRET=your_random_string_here
   3. Add to Vercel env vars: CRON_SECRET=same_string (Production)
   Vercel automatically sends this as a Bearer token to cron routes — no extra config needed.

Run: npm run build
`);
