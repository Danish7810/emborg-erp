const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\Danish\\emborg';

function write(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, { encoding: 'utf8' });
  console.log('✅ Written:', relPath);
}

// ═══════════════════════════════════════════════════════════════════
// 1. API KEY AUTH MIDDLEWARE — app/lib/apiKeyAuth.ts
// ═══════════════════════════════════════════════════════════════════
write('app/lib/apiKeyAuth.ts', `import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export type ApiKeyContext = {
  companyId: string;
  permissions: string[];
  keyId: string;
};

export async function resolveApiKey(
  authHeader: string | null,
  requiredPermission: string
): Promise<ApiKeyContext | NextResponse> {
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
      { error: \`This key does not have the '\${requiredPermission}' permission\` },
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
`);

// ═══════════════════════════════════════════════════════════════════
// 2. WEBHOOK DELIVERY HELPER — app/lib/webhookDelivery.ts
// ═══════════════════════════════════════════════════════════════════
write('app/lib/webhookDelivery.ts', `import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function fireWebhook(
  companyId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Get all active webhook endpoints for this company that listen to this event
  const { data: endpoints } = await serviceClient
    .from("webhook_endpoints")
    .select("id, url, secret, failure_count")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .contains("events", [event]);

  if (!endpoints || endpoints.length === 0) return;

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  for (const endpoint of endpoints) {
    // Skip endpoints that have failed 10+ times in a row (circuit breaker)
    if (endpoint.failure_count >= 10) continue;

    const signature = createHmac("sha256", endpoint.secret)
      .update(body)
      .digest("hex");

    let success = false;
    let responseStatus: number | null = null;
    let responseBody = "";

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-EMBORG-Signature": \`sha256=\${signature}\`,
          "X-EMBORG-Event": event,
          "User-Agent": "EMBORG-Webhooks/1.0",
        },
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      responseStatus = res.status;
      responseBody = await res.text().catch(() => "");
      success = res.ok;
    } catch (err) {
      responseBody = String(err);
    }

    // Log delivery
    await serviceClient.from("webhook_deliveries").insert({
      webhook_id: endpoint.id,
      company_id: companyId,
      event,
      payload: { event, data: payload },
      response_status: responseStatus,
      response_body: responseBody.slice(0, 500),
      success,
    });

    // Update endpoint stats
    await serviceClient
      .from("webhook_endpoints")
      .update({
        last_triggered_at: new Date().toISOString(),
        failure_count: success ? 0 : endpoint.failure_count + 1,
      })
      .eq("id", endpoint.id);
  }
}
`);

// ═══════════════════════════════════════════════════════════════════
// 3. API KEY MANAGEMENT — app/api/keys/route.ts
// ═══════════════════════════════════════════════════════════════════
write('app/api/keys/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
`);

// ═══════════════════════════════════════════════════════════════════
// 4. WEBHOOK MANAGEMENT — app/api/webhooks/route.ts
// ═══════════════════════════════════════════════════════════════════
write('app/api/webhooks/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
`);

// ═══════════════════════════════════════════════════════════════════
// 5. PUBLIC API ROUTES — /api/v1/*
// ═══════════════════════════════════════════════════════════════════
const v1Base = 'app/api/v1';

// ── Contacts ──────────────────────────────────────────────────────
write(v1Base + '/contacts/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
`);

// ── Leads ──────────────────────────────────────────────────────────
write(v1Base + '/leads/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
`);

// ── Invoices ───────────────────────────────────────────────────────
write(v1Base + '/invoices/route.ts', `import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "../../../lib/apiKeyAuth";
import { createClient } from "@supabase/supabase-js";
import { fireWebhook } from "../../../lib/webhookDelivery";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "read:finance");
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const status = url.searchParams.get("status");
  let query = db.from("invoices").select("*", { count: "exact" }).eq("company_id", ctx.companyId).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}

export async function POST(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "write:finance");
  if (ctx instanceof NextResponse) return ctx;
  const body = await req.json();
  if (!body.client_name || !body.amount) return NextResponse.json({ error: "client_name and amount are required" }, { status: 400 });
  const invoiceNumber = "INV-" + Date.now().toString().slice(-6);
  const { data, error } = await db.from("invoices").insert({ ...body, company_id: ctx.companyId, invoice_number: body.invoice_number || invoiceNumber, status: body.status || "draft" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  fireWebhook(ctx.companyId, "invoice.created", data);
  if (body.status === "paid") fireWebhook(ctx.companyId, "invoice.paid", data);
  return NextResponse.json({ data }, { status: 201 });
}
`);

// ── Expenses ───────────────────────────────────────────────────────
write(v1Base + '/expenses/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
`);

// ── Inventory ──────────────────────────────────────────────────────
write(v1Base + '/inventory/route.ts', `import { NextRequest, NextResponse } from "next/server";
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
  let query = db.from("inventory").select("*", { count: "exact" }).eq("company_id", ctx.companyId).order("name").range(offset, offset + limit - 1);
  if (lowStock) query = query.lte("quantity", db.rpc as never);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = lowStock ? (data || []).filter((i: { quantity: number; low_stock_alert: number }) => i.quantity <= i.low_stock_alert) : data;
  return NextResponse.json({ data: result, total: count, limit, offset });
}
`);

// ── Employees ──────────────────────────────────────────────────────
write(v1Base + '/employees/route.ts', `import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "../../../lib/apiKeyAuth";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const ctx = await resolveApiKey(req.headers.get("authorization"), "read:hr");
  if (ctx instanceof NextResponse) return ctx;
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const { data, error, count } = await db.from("employees")
    .select("id, full_name, email, department, position, status, join_date, created_at", { count: "exact" })
    .eq("company_id", ctx.companyId).order("full_name").range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, limit, offset });
}
`);

// ═══════════════════════════════════════════════════════════════════
// 6. API + WEBHOOKS MANAGEMENT UI — /dashboard/settings/api
// ═══════════════════════════════════════════════════════════════════
write('app/dashboard/settings/api/page.tsx', `"use client";
import { useEffect, useState } from "react";

const ALL_PERMISSIONS = [
  { key: "read:crm", label: "Read CRM", desc: "Read contacts and leads" },
  { key: "write:crm", label: "Write CRM", desc: "Create contacts and leads" },
  { key: "read:finance", label: "Read Finance", desc: "Read invoices and expenses" },
  { key: "write:finance", label: "Write Finance", desc: "Create invoices" },
  { key: "read:inventory", label: "Read Inventory", desc: "Read products and stock" },
  { key: "write:inventory", label: "Write Inventory", desc: "Update stock levels" },
  { key: "read:hr", label: "Read HR", desc: "Read employee list" },
];

const ALL_EVENTS = [
  { key: "contact.created", label: "Contact created" },
  { key: "lead.created", label: "Lead created" },
  { key: "lead.won", label: "Lead won" },
  { key: "lead.lost", label: "Lead lost" },
  { key: "invoice.created", label: "Invoice created" },
  { key: "invoice.paid", label: "Invoice paid" },
  { key: "invoice.overdue", label: "Invoice overdue" },
  { key: "inventory.low_stock", label: "Inventory low stock" },
  { key: "leave.approved", label: "Leave approved" },
  { key: "leave.rejected", label: "Leave rejected" },
];

type ApiKey = { id: string; name: string; key_prefix: string; permissions: string[]; is_active: boolean; last_used_at: string | null; created_at: string };
type Webhook = { id: string; name: string; url: string; events: string[]; is_active: boolean; last_triggered_at: string | null; failure_count: number; created_at: string; secret?: string };

export default function ApiSettingsPage() {
  const [tab, setTab] = useState<"keys" | "webhooks">("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPerms, setKeyPerms] = useState<string[]>([]);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    const r = await fetch("/api/keys"); const d = await r.json();
    setKeys(d.keys || []);
  }
  async function loadWebhooks() {
    const r = await fetch("/api/webhooks"); const d = await r.json();
    setWebhooks(d.webhooks || []);
  }

  useEffect(() => { loadKeys(); loadWebhooks(); }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: keyName, permissions: keyPerms }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setNewKey(d.key); setKeyName(""); setKeyPerms([]); setShowKeyForm(false); setSaving(false); loadKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key? Any app using it will immediately lose access.")) return;
    await fetch("/api/keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadKeys();
  }

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const r = await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: webhookName, url: webhookUrl, events: webhookEvents }) });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setSaving(false); return; }
    setNewWebhookSecret(d.webhook.secret); setWebhookName(""); setWebhookUrl(""); setWebhookEvents([]);
    setShowWebhookForm(false); setSaving(false); loadWebhooks();
  }

  async function deleteWebhook(id: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    await fetch("/api/webhooks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadWebhooks();
  }

  function togglePerm(p: string) { setKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]); }
  function toggleEvent(e: string) { setWebhookEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]); }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const cardStyle = { padding: "20px", border: "1px solid var(--line)", borderRadius: "14px", backgroundColor: "var(--bg-alt)" };
  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", backgroundColor: "var(--bg)", color: "var(--ink)", fontSize: "14px", boxSizing: "border-box" as const };
  const btnPrimary = { padding: "10px 20px", backgroundColor: "var(--accent)", color: "white", border: "none", borderRadius: "20px", fontWeight: 600, fontSize: "13px", cursor: "pointer" };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 className="tight" style={{ fontSize: "28px", fontWeight: 800, color: "var(--ink)", margin: "0 0 8px 0" }}>API & Webhooks</h1>
        <p style={{ fontSize: "15px", color: "var(--muted)", margin: 0 }}>Connect EMBORG to external tools, automate workflows, and build integrations.</p>
      </div>

      {/* Base URL banner */}
      <div style={{ ...cardStyle, marginBottom: "24px", backgroundColor: "var(--bg)" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px 0" }}>API Base URL</p>
        <code style={{ fontSize: "14px", color: "var(--accent)", fontFamily: "monospace" }}>https://www.emborgerp.com/api/v1</code>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 0 0" }}>All requests require: <code style={{ fontFamily: "monospace" }}>Authorization: Bearer emb_live_...</code></p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", backgroundColor: "var(--bg-alt)", padding: "4px", borderRadius: "12px", width: "fit-content" }}>
        {(["keys", "webhooks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: tab === t ? "var(--bg)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontWeight: tab === t ? 600 : 400, fontSize: "13px", cursor: "pointer" }}>
            {t === "keys" ? "API Keys" : "Webhooks"}
          </button>
        ))}
      </div>

      {/* ── Revealed new key ── */}
      {newKey && (
        <div style={{ ...cardStyle, marginBottom: "20px", border: "1px solid #10B981", backgroundColor: "#DCFCE7" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>✓ API key created — copy it now. You will never see it again.</p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <code style={{ flex: 1, fontSize: "13px", backgroundColor: "white", padding: "10px 12px", borderRadius: "8px", border: "1px solid #BBF7D0", fontFamily: "monospace", wordBreak: "break-all" }}>{newKey}</code>
            <button onClick={() => copyToClipboard(newKey)} style={{ ...btnPrimary, backgroundColor: "#16A34A", flexShrink: 0 }}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <button onClick={() => setNewKey(null)} style={{ marginTop: "12px", fontSize: "12px", color: "#166534", background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
        </div>
      )}

      {/* ── Revealed webhook secret ── */}
      {newWebhookSecret && (
        <div style={{ ...cardStyle, marginBottom: "20px", border: "1px solid #10B981", backgroundColor: "#DCFCE7" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#166534", margin: "0 0 8px 0" }}>✓ Webhook created — save the signing secret. You will not see it again.</p>
          <code style={{ fontSize: "12px", backgroundColor: "white", padding: "10px 12px", borderRadius: "8px", border: "1px solid #BBF7D0", fontFamily: "monospace", wordBreak: "break-all", display: "block" }}>{newWebhookSecret}</code>
          <p style={{ fontSize: "12px", color: "#166534", margin: "8px 0 0 0" }}>Use this to verify the <code>X-EMBORG-Signature</code> header on incoming requests.</p>
          <button onClick={() => setNewWebhookSecret(null)} style={{ marginTop: "8px", fontSize: "12px", color: "#166534", background: "none", border: "none", cursor: "pointer" }}>Dismiss</button>
        </div>
      )}

      {error && <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>{error}</p>}

      {tab === "keys" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>API Keys ({keys.length})</h2>
            <button onClick={() => setShowKeyForm(!showKeyForm)} style={btnPrimary}>+ New Key</button>
          </div>

          {showKeyForm && (
            <form onSubmit={createKey} style={{ ...cardStyle, marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>Key Name</label>
                  <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder='e.g. "Zapier integration"' required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "10px" }}>Permissions</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                    {ALL_PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer", backgroundColor: keyPerms.includes(p.key) ? "var(--accent)" + "10" : "var(--bg)", borderColor: keyPerms.includes(p.key) ? "var(--accent)" : "var(--line)" }}>
                        <input type="checkbox" checked={keyPerms.includes(p.key)} onChange={() => togglePerm(p.key)} style={{ marginTop: "2px" }} />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{p.label}</div>
                          <div style={{ fontSize: "11px", color: "var(--muted)" }}>{p.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={saving || keyPerms.length === 0} style={{ ...btnPrimary, opacity: saving || keyPerms.length === 0 ? 0.6 : 1 }}>{saving ? "Creating..." : "Create Key"}</button>
                  <button type="button" onClick={() => setShowKeyForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {keys.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No API keys yet. Create one to start integrating EMBORG with external tools.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {keys.map(k => (
                <div key={k.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", marginBottom: "4px" }}>{k.name}</div>
                    <code style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>{k.key_prefix}••••••••••••</code>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {k.permissions.map(p => <span key={p} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "var(--accent)" + "15", color: "var(--accent)", fontWeight: 600 }}>{p}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</div>
                    <button onClick={() => revokeKey(k.id)} style={{ padding: "6px 14px", backgroundColor: "transparent", color: "#DC2626", border: "1px solid #DC262640", borderRadius: "16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "webhooks" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>Webhooks ({webhooks.length})</h2>
            <button onClick={() => setShowWebhookForm(!showWebhookForm)} style={btnPrimary}>+ Add Endpoint</button>
          </div>

          {showWebhookForm && (
            <form onSubmit={createWebhook} style={{ ...cardStyle, marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>Endpoint Name</label>
                    <input value={webhookName} onChange={e => setWebhookName(e.target.value)} placeholder='e.g. "Zapier trigger"' required style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>URL (https only)</label>
                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "10px" }}>Events to listen for</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                    {ALL_EVENTS.map(ev => (
                      <label key={ev.key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "8px", cursor: "pointer", backgroundColor: webhookEvents.includes(ev.key) ? "var(--accent)" + "10" : "var(--bg)", borderColor: webhookEvents.includes(ev.key) ? "var(--accent)" : "var(--line)", fontSize: "13px", color: "var(--ink)" }}>
                        <input type="checkbox" checked={webhookEvents.includes(ev.key)} onChange={() => toggleEvent(ev.key)} />
                        {ev.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={saving || webhookEvents.length === 0} style={{ ...btnPrimary, opacity: saving || webhookEvents.length === 0 ? 0.6 : 1 }}>{saving ? "Creating..." : "Create Endpoint"}</button>
                  <button type="button" onClick={() => setShowWebhookForm(false)} style={{ padding: "10px 20px", backgroundColor: "transparent", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          {webhooks.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>No webhook endpoints yet. Add one to receive real-time event notifications.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {webhooks.map(w => (
                <div key={w.id} style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", marginBottom: "4px" }}>{w.name}</div>
                    <code style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace", wordBreak: "break-all" }}>{w.url}</code>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {w.events.map(ev => <span key={ev} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#8B5CF620", color: "#8B5CF6", fontWeight: 600 }}>{ev}</span>)}
                    </div>
                    {w.failure_count > 0 && <p style={{ fontSize: "12px", color: "#DC2626", margin: "6px 0 0 0" }}>⚠ {w.failure_count} recent failures</p>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>Last triggered: {w.last_triggered_at ? new Date(w.last_triggered_at).toLocaleDateString() : "Never"}</div>
                    <button onClick={() => deleteWebhook(w.id)} style={{ padding: "6px 14px", backgroundColor: "transparent", color: "#DC2626", border: "1px solid #DC262640", borderRadius: "16px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API reference */}
      <div style={{ ...cardStyle, marginTop: "32px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", margin: "0 0 14px 0" }}>Quick Reference</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { method: "GET", path: "/api/v1/contacts", perm: "read:crm" },
            { method: "POST", path: "/api/v1/contacts", perm: "write:crm" },
            { method: "GET", path: "/api/v1/leads", perm: "read:crm" },
            { method: "POST", path: "/api/v1/leads", perm: "write:crm" },
            { method: "GET", path: "/api/v1/invoices", perm: "read:finance" },
            { method: "POST", path: "/api/v1/invoices", perm: "write:finance" },
            { method: "GET", path: "/api/v1/expenses", perm: "read:finance" },
            { method: "GET", path: "/api/v1/inventory", perm: "read:inventory" },
            { method: "GET", path: "/api/v1/employees", perm: "read:hr" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px", backgroundColor: "var(--bg)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: r.method === "GET" ? "#3B82F6" : "#10B981", width: "36px", flexShrink: 0 }}>{r.method}</span>
              <code style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--ink)", flex: 1 }}>{r.path}</code>
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "12px", backgroundColor: "var(--accent)" + "15", color: "var(--accent)", fontWeight: 600, flexShrink: 0 }}>{r.perm}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// ── Add API Settings link to Settings sidebar navigation ──────────
const settingsPath = path.join(ROOT, 'app', 'dashboard', 'settings', 'page.tsx');
if (fs.existsSync(settingsPath)) {
  let settings = fs.readFileSync(settingsPath, 'utf8');
  if (!settings.includes('/dashboard/settings/api')) {
    // Add API link at the top of settings
    settings = settings.replace(
      /<div style={{ maxWidth/,
      `<div style={{ marginBottom: "16px" }}>
  <a href="/dashboard/settings/api" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", backgroundColor: "var(--accent)", color: "white", borderRadius: "20px", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
    🔑 API & Webhooks
  </a>
</div>
<div style={{ maxWidth`
    );
    fs.writeFileSync(settingsPath, settings, 'utf8');
    console.log('✅ Settings page: added API & Webhooks link');
  }
}

console.log('\nRun: npm run build');
