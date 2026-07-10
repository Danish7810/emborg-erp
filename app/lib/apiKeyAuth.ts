import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export type ApiKeyContext = {
  companyId: string;
  permissions: string[];
  keyId: string;
};

export async function resolveApiKey(
  authHeader: string | null,
  requiredPermission: string
): Promise<ApiKeyContext | NextResponse> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
  const serviceClient = getServiceClient();

  if (!authHeader?.startsWith("Bearer emb_")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use: Authorization: Bearer emb_live_..." },
      { status: 401 }
    );
  }

  const rawKey = authHeader.replace("Bearer ", "").trim();
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const { data: apiKey, error } = await serviceClient
    .from("api_keys")
    .select("id, company_id, permissions, is_active")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !apiKey) {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  if (!apiKey.permissions.includes(requiredPermission)) {
    return NextResponse.json(
      { error: `This key does not have the '${requiredPermission}' permission` },
      { status: 403 }
    );
  }

  // Update last_used_at fire-and-forget
  serviceClient
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return {
    companyId: apiKey.company_id,
    permissions: apiKey.permissions,
    keyId: apiKey.id,
  };
}
