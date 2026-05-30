import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/config";
import { errorMessage } from "@/lib/utils";

// Creates a Razorpay order. Activates only when Razorpay keys are set.
// Uses the Razorpay REST API directly (Basic auth) — no extra dependency.
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

    const { planId } = await req.json();
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: "INR",
        receipt: `v2wa_${plan.id}_${Date.now()}`,
        notes: { plan: plan.id },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Razorpay order failed:", detail);
      return NextResponse.json({ error: "Could not create order" }, { status: 502 });
    }

    const order = await res.json();
    return NextResponse.json({
      configured: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan: plan.id,
    });
  } catch (error: unknown) {
    console.error("Order error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
