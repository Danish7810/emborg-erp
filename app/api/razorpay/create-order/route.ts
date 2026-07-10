import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { invoiceId } = await req.json();
  if (!invoiceId) return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });

  // Read the invoice through the RLS-scoped client so a user can only
  // create a payment order for an invoice their own company owns.
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, amount, status, invoice_number")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  if (!invoice.amount || invoice.amount <= 0) return NextResponse.json({ error: "Invoice has no payable amount" }, { status: 400 });

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const basicAuth = Buffer.from(keyId + ":" + keySecret).toString("base64");

  // The order amount always comes from the invoice row we just read
  // server-side, never from client input — this is what prevents a
  // caller from requesting a cheap order against an expensive invoice.
  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + basicAuth },
    body: JSON.stringify({
      amount: Math.round(invoice.amount * 100),
      currency: "INR",
      receipt: invoice.invoice_number,
      notes: { invoice_id: invoice.id },
    }),
  });

  const order = await rzpRes.json();
  if (!rzpRes.ok) {
    return NextResponse.json({ error: order?.error?.description || "Failed to create payment order" }, { status: 502 });
  }

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
}
