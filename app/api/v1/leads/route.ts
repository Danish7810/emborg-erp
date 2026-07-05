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
  const status = url.searchParams.get("status");
  let query = db.from("leads").select("*", { count: "exact" }).eq("company_id", ctx.companyId).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "write:crm");
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const { data, error } = await db.from("leads").insert({ ...body, company_id: ctx.companyId, status: body.status || "new" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  fireWebhook(ctx.companyId, "lead.created", data);
  if (body.status === "won") fireWebhook(ctx.companyId, "lead.won", data);
  if (body.status === "lost") fireWebhook(ctx.companyId, "lead.lost", data);
  return NextResponse.json({ data }, { status: 201 });
}
