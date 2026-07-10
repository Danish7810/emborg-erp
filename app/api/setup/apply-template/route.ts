import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
import { createClient } from "@supabase/supabase-js";
import { INDUSTRY_TEMPLATES } from "../../../lib/industryTemplates";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { templateId, includeSampleData } = await req.json();
  const template = INDUSTRY_TEMPLATES.find(t => t.id === templateId);
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const { data: companyId } = await supabase.rpc("get_my_company_id");
  if (!companyId) return NextResponse.json({ error: "Company not found" }, { status: 400 });

  const results: Record<string, number> = {};

  // ── Insert sample inventory ────────────────────────────────────
  if (template.sampleInventory.length > 0) {
    const { data, error } = await serviceClient.from("inventory").insert(
      template.sampleInventory.map(item => ({ ...item, company_id: companyId }))
    );
    results.inventory = template.sampleInventory.length;
    if (error) console.error("Inventory insert error:", error.message);
  }

  // ── Insert sample contacts ─────────────────────────────────────
  if (includeSampleData && template.sampleContacts.length > 0) {
    const { error } = await serviceClient.from("contacts").insert(
      template.sampleContacts.map(c => ({ ...c, company_id: companyId }))
    );
    results.contacts = template.sampleContacts.length;
    if (error) console.error("Contacts insert error:", error.message);
  }

  // ── Insert sample leads ────────────────────────────────────────
  if (includeSampleData && template.sampleLeads.length > 0) {
    const { error } = await serviceClient.from("leads").insert(
      template.sampleLeads.map(l => ({ ...l, company_id: companyId }))
    );
    results.leads = template.sampleLeads.length;
    if (error) console.error("Leads insert error:", error.message);
  }

  // ── Update company name with industry tag ──────────────────────
  await serviceClient
    .from("companies")
    .update({ name: template.name })
    .eq("id", companyId);

  return NextResponse.json({
    success: true,
    template: template.name,
    created: results,
    tips: template.tips,
  });
}
