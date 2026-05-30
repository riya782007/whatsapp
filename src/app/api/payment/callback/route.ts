import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Razorpay redirects the customer here (GET) after they pay the link.
// We verify the signature, then redirect back into the app with a short
// status so the client can confirm + unlock. The client ALSO re-confirms
// the payment server-side (see /api/payment/status) before unlocking.
export async function GET(req: NextRequest) {
  const origin = process.env.APP_URL || req.nextUrl.origin;
  const params = req.nextUrl.searchParams;

  const paymentId = params.get("razorpay_payment_id") ?? "";
  const linkId = params.get("razorpay_payment_link_id") ?? "";
  const refId = params.get("razorpay_payment_link_reference_id") ?? "";
  const linkStatus = params.get("razorpay_payment_link_status") ?? "";
  const signature = params.get("razorpay_signature") ?? "";

  const fail = (msg: string) =>
    NextResponse.redirect(`${origin}/?pay=fail&reason=${encodeURIComponent(msg)}`);

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return fail("not_configured");
  if (!paymentId || !linkId || !signature) return fail("missing_fields");

  // Signature = HMAC_SHA256(link_id|reference_id|link_status|payment_id)
  const payload = `${linkId}|${refId}|${linkStatus}|${paymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

  let valid = false;
  try {
    valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    valid = false;
  }

  if (!valid) return fail("signature_mismatch");
  if (linkStatus !== "paid") return fail("not_paid");

  // plan is encoded in reference_id: v2wa_<plan>_<timestamp>
  const plan = refId.split("_")[1] || "pro";

  return NextResponse.redirect(
    `${origin}/?pay=ok&pid=${encodeURIComponent(paymentId)}&plan=${encodeURIComponent(plan)}`
  );
}
