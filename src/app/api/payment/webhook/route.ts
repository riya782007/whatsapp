import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { upsertEntitlement, expiryForTier } from "@/lib/supabase";
import { PlanTier } from "@/lib/config";

// Razorpay webhook — the server source of truth for entitlements.
// Configure it in the Razorpay Dashboard (Settings -> Webhooks) pointing
// to: https://<your-domain>/api/payment/webhook  with events:
//   payment_link.paid  (and optionally payment.captured)
// Set the same secret you enter there as RAZORPAY_WEBHOOK_SECRET in Vercel.
//
// IMPORTANT: signature is computed over the RAW request body, so we read
// req.text() (not req.json()).
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Not configured yet — acknowledge so Razorpay doesn't retry forever.
    return NextResponse.json({ ok: false, reason: "webhook_not_configured" }, { status: 200 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  let valid = false;
  try {
    valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 400 });
  }

  interface WebhookBody {
    event?: string;
    payload?: {
      payment_link?: { entity?: { id?: string; notes?: Record<string, string> } };
      payment?: { entity?: { id?: string } };
    };
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  try {
    const event = body.event;

    // Primary: payment link fully paid
    if (event === "payment_link.paid") {
      const link = body.payload?.payment_link?.entity;
      const payment = body.payload?.payment?.entity;
      const notes = link?.notes || {};
      const userId: string | undefined = notes.userId;
      const planFromNotes: string | undefined = notes.plan;

      if (userId && (planFromNotes === "pro" || planFromNotes === "lifetime")) {
        const tier = planFromNotes as Exclude<PlanTier, "free">;
        await upsertEntitlement({
          userId,
          tier,
          expiresAt: expiryForTier(tier),
          paymentId: payment?.id ?? link?.id ?? null,
        });
      }
    }

    // Always 200 so Razorpay marks delivery successful.
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook handling error:", e);
    // Still 200 to avoid infinite retries; we logged it for inspection.
    return NextResponse.json({ ok: true, note: "handled_with_error" });
  }
}
