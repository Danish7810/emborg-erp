import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "../../../lib/apiKeyAuth";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "read:finance");
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const { data, error, count } = await db.from("expenses").select("*", { count: "exact" })
    .eq("company_id", ctx.companyId).order("date", { ascending: false }).range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}
