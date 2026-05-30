import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/config";
import { errorMessage } from "@/lib/utils";

// Creates a LIVE Razorpay Payment Link on each upgrade request.
// The link accepts UPI, cards, net-banking and wallets (whatever is
// enabled on the account). Money is settled to the merchant's Razorpay
// account. Activates only when Razorpay keys are present in the env.
export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payments are not configured yet.", configured: false },
        { status: 503 }
      );
    }

    const { planId, userId } = await req.json();
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Where Razorpay sends the customer back after payment.
    // APP_URL lets you pin the production URL; otherwise we use the request origin.
    const origin = process.env.APP_URL || req.nextUrl.origin;

    // reference_id encodes the plan so the callback knows what was bought.
    const referenceId = `v2wa_${plan.id}_${Date.now()}`;

    // notes carry the plan + the user id so the webhook can attribute the
    // payment to the right user and persist their entitlement.
    const notes: Record<string, string> = { plan: plan.id };
    if (typeof userId === "string" && userId) notes.userId = userId;

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: "INR",
        accept_partial: false,
        description: `Voice2WA ${plan.name} Plan`,
        reference_id: referenceId,
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes,
        callback_url: `${origin}/api/payment/callback`,
        callback_method: "get",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = data?.error?.description || "Could not create payment link";
      console.error("Razorpay payment link failed:", data);
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json({
      configured: true,
      url: data.short_url,
      paymentLinkId: data.id,
      referenceId,
      plan: plan.id,
    });
  } catch (error: unknown) {
    console.error("Payment link error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
