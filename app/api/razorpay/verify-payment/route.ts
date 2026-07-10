import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { requireUser } from "../../../lib/apiAuth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { invoiceId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!invoiceId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing verification fields" }, { status: 400 });
  }

  // Razorpay's own documented verification: HMAC-SHA256 of
  // "order_id|payment_id" using the account's key secret must match
  // the signature Razorpay returned to the browser. Only Razorpay
  // (which holds the secret) can produce a signature that passes this
  // check, so a forged client-side "success" callback cannot pass it.
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSignature = createHmac("sha256", keySecret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(razorpay_signature);
  const isValid = expected.length === provided.length && timingSafeEqual(expected, provided);

  if (!isValid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // RLS-scoped client: this can only ever update an invoice belonging
  // to the caller's own company.
  const { data: updated, error } = await supabase
    .from("invoices")
    .update({ status: "paid" })
    .eq("id", invoiceId)
    .select("id, invoice_number, status")
    .single();

  if (error || !updated) return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });

  return NextResponse.json({ success: true, invoice: updated, paymentId: razorpay_payment_id });
}
