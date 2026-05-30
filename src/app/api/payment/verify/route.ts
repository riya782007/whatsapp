import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { errorMessage } from "@/lib/utils";

// Verifies a Razorpay payment signature server-side. This is the source
// of truth for entitlement — the client only flips to "pro" after this
// returns { valid: true }.
export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ valid: false, error: "Payments not configured" }, { status: 503 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ valid: false, error: "Missing fields" }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature)
    );

    if (!valid) {
      return NextResponse.json({ valid: false, error: "Signature mismatch" }, { status: 400 });
    }

    return NextResponse.json({ valid: true, paymentId: razorpay_payment_id });
  } catch (error: unknown) {
    console.error("Verify error:", error);
    return NextResponse.json({ valid: false, error: errorMessage(error) }, { status: 500 });
  }
}
