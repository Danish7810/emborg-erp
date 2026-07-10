import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderEmborgEmail } from "../../../lib/emailTemplate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── Fetch all data for one company over the last 30 days ──────────
async function fetchCompanyData(companyId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();

  const [
    { data: leads },
    { data: contacts },
    { data: invoices },
    { data: expenses },
    { data: inventory },
    { data: employees },
    { data: payroll },
    { data: leaveRequests },
  ] = await Promise.all([
    supabase.from("leads").select("title, value, status, created_at").eq("company_id", companyId).gte("created_at", sinceStr),
    supabase.from("contacts").select("id, created_at").eq("company_id", companyId),
    supabase.from("invoices").select("amount, status, due_date, client_name").eq("company_id", companyId).gte("created_at", sinceStr),
    supabase.from("expenses").select("amount, category").eq("company_id", companyId).gte("created_at", sinceStr),
    supabase.from("inventory").select("name, quantity, low_stock_alert").eq("company_id", companyId),
    supabase.from("employees").select("id, status").eq("company_id", companyId),
    supabase.from("payroll").select("amount, status, period").eq("company_id", companyId).gte("created_at", sinceStr),
    supabase.from("leave_requests").select("status, leave_type").eq("company_id", companyId).gte("created_at", sinceStr),
  ]);

  // Crunch the numbers
  const wonLeads = (leads || []).filter(l => l.status === "won");
  const activeLeads = (leads || []).filter(l => !["won","lost"].includes(l.status));
  const lostLeads = (leads || []).filter(l => l.status === "lost");
  const totalRevenue = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
  const pipelineValue = activeLeads.reduce((s, l) => s + (l.value || 0), 0);
  const conversionRate = (leads || []).length > 0
    ? Math.round((wonLeads.length / (leads || []).length) * 100) : 0;

  const paidInvoices = (invoices || []).filter(i => i.status === "paid");
  const overdueInvoices = (invoices || []).filter(i => i.status !== "paid" && i.due_date && new Date(i.due_date) < new Date());
  const invoiceRevenue = paidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.amount || 0), 0);

  const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const expenseByCategory: Record<string, number> = {};
  (expenses || []).forEach(e => {
    expenseByCategory[e.category || "Other"] = (expenseByCategory[e.category || "Other"] || 0) + (e.amount || 0);
  });
  const topExpenseCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];

  const lowStockItems = (inventory || []).filter(i => i.quantity <= i.low_stock_alert);
  const activeEmployees = (employees || []).filter(e => e.status === "active").length;
  const pendingPayroll = (payroll || []).filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingLeaves = (leaveRequests || []).filter(l => l.status === "pending").length;

  return {
    period: since.toLocaleString("default", { month: "long", year: "numeric" }),
    leads: {
      total: (leads || []).length,
      won: wonLeads.length,
      lost: lostLeads.length,
      active: activeLeads.length,
      conversionRate,
      totalRevenue,
      pipelineValue,
      topDeal: wonLeads.sort((a, b) => (b.value || 0) - (a.value || 0))[0]?.title || null,
    },
    contacts: {
      total: (contacts || []).length,
      newThisMonth: (contacts || []).filter(c => new Date(c.created_at) >= since).length,
    },
    finance: {
      invoiceRevenue,
      overdueAmount,
      overdueCount: overdueInvoices.length,
      totalExpenses,
      topExpenseCategory: topExpenseCategory ? topExpenseCategory[0] + " (INR " + topExpenseCategory[1].toLocaleString("en-IN") + ")" : null,
      netProfit: invoiceRevenue - totalExpenses,
    },
    inventory: {
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 3).map(i => i.name + " (" + i.quantity + " left)"),
    },
    hr: {
      activeEmployees,
      pendingPayroll,
      pendingLeaves,
    },
  };
}

// ── Ask Claude to write the summary ───────────────────────────────
async function generateSummary(data: Awaited<ReturnType<typeof fetchCompanyData>>, companyName: string): Promise<string> {
  const prompt = `You are EMBORG AI writing a monthly business performance summary for a small business owner.
Company: ${companyName}
Period: ${data.period}

Here is their real business data for the month:

SALES & PIPELINE:
- New leads: ${data.leads.total} | Won: ${data.leads.won} | Lost: ${data.leads.lost} | Active: ${data.leads.active}
- Conversion rate: ${data.leads.conversionRate}%
- Revenue from won deals: INR ${data.leads.totalRevenue.toLocaleString("en-IN")}
- Active pipeline value: INR ${data.leads.pipelineValue.toLocaleString("en-IN")}
${data.leads.topDeal ? "- Best deal closed: " + data.leads.topDeal : "- No deals won this month"}

CONTACTS:
- Total contacts: ${data.contacts.total} | New this month: ${data.contacts.newThisMonth}

FINANCE:
- Invoice revenue collected: INR ${data.finance.invoiceRevenue.toLocaleString("en-IN")}
- Overdue invoices: ${data.finance.overdueCount} worth INR ${data.finance.overdueAmount.toLocaleString("en-IN")}
- Total expenses: INR ${data.finance.totalExpenses.toLocaleString("en-IN")}
- Net profit: INR ${data.finance.netProfit.toLocaleString("en-IN")}
${data.finance.topExpenseCategory ? "- Biggest expense category: " + data.finance.topExpenseCategory : ""}

INVENTORY:
- Items at/below low stock threshold: ${data.inventory.lowStockCount}
${data.inventory.lowStockItems.length > 0 ? "- Items needing reorder: " + data.inventory.lowStockItems.join(", ") : "- All stock levels healthy"}

HR:
- Active employees: ${data.hr.activeEmployees}
- Pending payroll: INR ${data.hr.pendingPayroll.toLocaleString("en-IN")}
- Pending leave requests: ${data.hr.pendingLeaves}

Write a warm, concise monthly summary email body (not the subject line, not a greeting, just the body paragraphs).
- 3-4 short paragraphs max
- Plain English, no jargon
- Be honest: if numbers are low or zero, say so without sugarcoating but stay encouraging
- Highlight the 2-3 most important things that happened
- End with 2-3 specific, actionable items they should focus on next month
- Format as clean HTML paragraphs (<p> tags only, no headers, no bullet lists)
- Keep it under 300 words total`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const result = await response.json();
  return result.content?.[0]?.text || "<p>We could not generate your summary this month. Please log in to view your dashboard.</p>";
}

// ── Main cron handler ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Get all companies with at least one admin profile that has an email
  const { data: companies, error: companyErr } = await supabase
    .from("companies")
    .select("id, name");

  if (companyErr || !companies || companies.length === 0) {
    return NextResponse.json({ error: "No companies found", detail: companyErr?.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const company of companies) {
    try {
      // Get the Admin email for this company
      const { data: admins } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("company_id", company.id)
        .eq("role", "Admin")
        .limit(1);

      if (!admins || admins.length === 0 || !admins[0].email) continue;

      const admin = admins[0];
      const data = await fetchCompanyData(company.id);
      const summaryHtml = await generateSummary(data, company.name || "your business");

      const now = new Date();
      const monthYear = now.toLocaleString("default", { month: "long", year: "numeric" });

      // Build the stats snapshot to show below the AI text
      const statsHtml = `
        <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;">
          <tr style="background:#f8f8ff;">
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Revenue</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#1a1a2e;font-weight:700;">INR ${data.finance.invoiceRevenue.toLocaleString("en-IN")}</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Pipeline</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#1a1a2e;font-weight:700;">INR ${data.leads.pipelineValue.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Leads Won</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#10B981;font-weight:700;">${data.leads.won} (${data.leads.conversionRate}%)</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Overdue</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:${data.finance.overdueCount > 0 ? "#EF4444" : "#10B981"};font-weight:700;">${data.finance.overdueCount > 0 ? "INR " + data.finance.overdueAmount.toLocaleString("en-IN") : "None"}</td>
          </tr>
          <tr style="background:#f8f8ff;">
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Net Profit</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:${data.finance.netProfit >= 0 ? "#10B981" : "#EF4444"};font-weight:700;">INR ${data.finance.netProfit.toLocaleString("en-IN")}</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:#666;font-weight:600;">Low Stock</td>
            <td style="padding:10px 12px;border:1px solid #eee;color:${data.inventory.lowStockCount > 0 ? "#F59E0B" : "#10B981"};font-weight:700;">${data.inventory.lowStockCount > 0 ? data.inventory.lowStockCount + " items" : "All good"}</td>
          </tr>
        </table>
      `;

      const html = renderEmborgEmail({
        badgeText: "MONTHLY SUMMARY",
        badgeColor: "#2563EB",
        badgeBg: "#EFF6FF",
        heading: `${monthYear} — Your Business at a Glance`,
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">Hi ${admin.full_name || "there"},</p>
          ${summaryHtml}
          ${statsHtml}
        `,
        ctaText: "Open Dashboard",
        ctaUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.emborgerp.com") + "/dashboard",
      });

      await resend.emails.send({
        from: "EMBORG AI <onboarding@resend.dev>",
        to: admin.email,
        subject: `${monthYear} Business Summary — ${company.name || "EMBORG"}`,
        html,
      });

      sent++;
    } catch (err) {
      failed++;
      if (errors.length < 5) errors.push(String(err));
      console.error("Monthly summary failed for company", company.id, err);
    }
  }

  return NextResponse.json({ success: true, sent, failed, companies: companies.length, errors });
}
