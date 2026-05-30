// ─────────────────────────────────────────────────────────────
// Client-side Razorpay checkout flow.
// Creates an order on our server, opens Razorpay, then verifies the
// payment server-side before unlocking Pro locally.
// ─────────────────────────────────────────────────────────────

import { Plan } from "./config";
import { setPlan } from "./usage";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export interface CheckoutResult {
  status: "success" | "cancelled" | "unconfigured" | "error";
  message?: string;
}

export async function startCheckout(plan: Plan): Promise<CheckoutResult> {
  try {
    // 1. Create order on our backend
    const orderRes = await fetch("/api/payment/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });

    if (orderRes.status === 503) {
      return { status: "unconfigured" };
    }
    if (!orderRes.ok) {
      const e = await orderRes.json().catch(() => ({}));
      return { status: "error", message: e.error || "Could not start checkout" };
    }

    const order = await orderRes.json();

    if (!window.Razorpay) {
      return { status: "error", message: "Payment library not loaded. Refresh and try again." };
    }

    // 2. Open Razorpay checkout
    return await new Promise<CheckoutResult>((resolve) => {
      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Voice2WA",
        description: `${plan.name} Plan`,
        order_id: order.orderId,
        theme: { color: "#22c55e" },
        handler: async (response: RazorpayResponse) => {
          // 3. Verify on the server
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verify = await verifyRes.json();
          if (verify.valid) {
            const tier = plan.id === "lifetime" ? "lifetime" : "pro";
            setPlan(tier, verify.paymentId);
            resolve({ status: "success" });
          } else {
            resolve({ status: "error", message: "Payment could not be verified." });
          }
        },
        modal: {
          ondismiss: () => resolve({ status: "cancelled" }),
        },
      });
      rzp.open();
    });
  } catch (e: unknown) {
    return { status: "error", message: e instanceof Error ? e.message : "Checkout failed" };
  }
}
