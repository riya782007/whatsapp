import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/config";
import { errorMessage } from "@/lib/utils";

// Final source of truth before unlocking Pro. Given a payment id + plan,
// we fetch the payment directly from Razorpay and confirm it is captured
// and the amount matches the plan price. This stops anyone from unlocking
// by crafting a fake callback URL.
export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ valid: false, error: "Payments not configured" }, { status: 503 });
    }

    const { paymentId, planId } = await req.json();
    const plan = PLANS.find((p) => p.id === planId);
    if (!paymentId || !plan) {
      return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: "Payment not found" }, { status: 404 });
    }

    const payment = await res.json();

    const captured = payment.status === "captured" || payment.captured === true;
    const amountOk = Number(payment.amount) === plan.amountPaise;

    if (!captured || !amountOk) {
      return NextResponse.json({
        valid: false,
        error: `Payment not confirmed (status: ${payment.status})`,
      });
    }

    const tier = plan.id === "lifetime" ? "lifetime" : "pro";
    return NextResponse.json({ valid: true, tier, paymentId, method: payment.method });
  } catch (error: unknown) {
    console.error("Payment status error:", error);
    return NextResponse.json({ valid: false, error: errorMessage(error) }, { status: 500 });
  }
}
