import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../lib/apiAuth";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VALID_EVENTS = [
  "contact.created", "lead.won", "lead.lost", "lead.created",
  "invoice.created", "invoice.paid", "invoice.overdue",
  "inventory.low_stock", "leave.approved", "leave.rejected",
];

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data: companyId } = await supabase.rpc("get_my_company_id");
  const { data: webhooks, error } = await supabase
    .from("webhook_endpoints")
    .select("id, name, url, events, is_active, last_triggered_at, failure_count, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhooks });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { name, url, events } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!url?.startsWith("https://")) return NextResponse.json({ error: "URL must start with https://" }, { status: 400 });
  if (!events?.length) return NextResponse.json({ error: "Select at least one event" }, { status: 400 });

  const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) return NextResponse.json({ error: "Invalid events: " + invalidEvents.join(", ") }, { status: 400 });

  const { data: companyId } = await supabase.rpc("get_my_company_id");
  const secret = randomBytes(32).toString("hex");

  const { data: webhook, error } = await serviceClient
    .from("webhook_endpoints")
    .insert({ company_id: companyId, created_by: user.id, name: name.trim(), url, secret, events })
    .select("id, name, url, events, secret, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Return secret once so they can configure their receiver
  return NextResponse.json({ webhook });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { id } = await req.json();
  const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
