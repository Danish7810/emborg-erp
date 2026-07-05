import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../lib/apiAuth";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VALID_PERMISSIONS = [
  "read:crm", "write:crm",
  "read:finance", "write:finance",
  "read:inventory", "write:inventory",
  "read:hr",
];

// GET — list all keys for this company (never returns the full key)
export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data: companyId } = await supabase.rpc("get_my_company_id");
  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, permissions, is_active, last_used_at, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys });
}

// POST — create a new API key
export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;

  const { name, permissions } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const invalidPerms = (permissions || []).filter((p: string) => !VALID_PERMISSIONS.includes(p));
  if (invalidPerms.length > 0) {
    return NextResponse.json({ error: "Invalid permissions: " + invalidPerms.join(", ") }, { status: 400 });
  }

  const { data: companyId } = await supabase.rpc("get_my_company_id");

  // Generate: emb_live_ + 32 random hex chars
  const rawKey = "emb_live_" + randomBytes(16).toString("hex");
  const keyPrefix = rawKey.substring(0, 16); // e.g. "emb_live_a3f9b2c"
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data: newKey, error } = await serviceClient
    .from("api_keys")
    .insert({
      company_id: companyId,
      created_by: user.id,
      name: name.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions: permissions || [],
    })
    .select("id, name, key_prefix, permissions, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the raw key ONCE — never stored, never retrievable again
  return NextResponse.json({ key: rawKey, meta: newKey });
}

// DELETE — revoke a key
export async function DELETE(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Key ID required" }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
