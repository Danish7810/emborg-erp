import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "../../../lib/apiKeyAuth";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "read:inventory");
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const lowStock = url.searchParams.get("low_stock") === "true";
  const query = db.from("inventory").select("*", { count: "exact" }).eq("company_id", ctx.companyId).order("name").range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = lowStock ? (data || []).filter((i: { quantity: number; low_stock_alert: number }) => i.quantity <= i.low_stock_alert) : data;
  return NextResponse.json({ data: result, total: count, limit, offset });
}
