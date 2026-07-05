import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "../../../lib/apiKeyAuth";
import { createClient } from "@supabase/supabase-js";
import { fireWebhook } from "../../../lib/webhookDelivery";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "read:crm");
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const { data, error, count } = await db.from("contacts").select("*", { count: "exact" })
    .eq("company_id", ctx.companyId).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "write:crm");
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  if (!body.full_name) return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  const { data, error } = await db.from("contacts").insert({ ...body, company_id: ctx.companyId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  fireWebhook(ctx.companyId, "contact.created", data);
  return NextResponse.json({ data }, { status: 201 });
}
