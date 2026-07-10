import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function fireWebhook(
  companyId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Webhook delivery is already treated as non-critical/best-effort by every
  // caller (fire-and-forget) -- if the service isn't configured, silently
  // skip rather than throwing, same spirit as the configured-check elsewhere.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return;
  const serviceClient = getServiceClient();

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
          "X-EMBORG-Signature": `sha256=${signature}`,
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
