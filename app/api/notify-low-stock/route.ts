import { NextRequest, NextResponse } from "next/server";
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
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#666;line-height:1.6;">
        <strong>${item.name}</strong>${item.sku ? ` (SKU: ${item.sku})` : ""} has ${item.quantity} ${item.unit || "units"} remaining — at or below your alert threshold of ${item.low_stock_alert}.
      </p>
      <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">Consider reordering soon to avoid running out.</p>`,
      ctaText: "View Inventory",
      ctaUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.emborgerp.com") + "/dashboard/inventory",
    });

    for (const admin of admins) {
      if (!admin.email) continue;
      await resend.emails.send({
        from: "EMBORG <onboarding@resend.dev>",
        to: admin.email,
        subject: isOut ? `Out of stock: ${item.name}` : `Low stock alert: ${item.name}`,
        html,
      });
    }

    return NextResponse.json({ sent: true, notified: admins.length });
  } catch (err) {
    console.error("Low stock notify error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
