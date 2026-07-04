import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  const cronSecret = process.env.CRON_SECRET || "";

  return NextResponse.json({
    service_key_present: key.length > 0,
    service_key_length: key.length,
    service_key_prefix: key.substring(0, 12),
    service_key_type: key.startsWith("eyJ") ? "legacy_jwt" : key.startsWith("sb_secret_") ? "new_secret_key" : key.length === 0 ? "MISSING" : "unknown",
    cron_secret_present: cronSecret.length > 0,
    cron_secret_length: cronSecret.length,
  });
}
