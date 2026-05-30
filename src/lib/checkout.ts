// ─────────────────────────────────────────────────────────────
// Razorpay Payment Link flow (live UPI / card payments).
//   1. startCheckout(plan) -> server creates a live payment link
//      -> we redirect the browser to Razorpay's hosted page.
//   2. After payment, Razorpay redirects back to /api/payment/callback,
//      which verifies the signature and bounces to /?pay=ok&pid=...&plan=...
//   3. finalizeFromRedirect() re-confirms the payment server-side and,
//      only then, unlocks Pro locally.
// ─────────────────────────────────────────────────────────────

import { Plan, PlanTier } from "./config";
import { getPlan, getUserId, setPlan, setPlanRecord } from "./usage";

export interface CheckoutResult {
  status: "redirecting" | "unconfigured" | "error";
  message?: string;
}

export async function startCheckout(plan: Plan): Promise<CheckoutResult> {
  try {
    const res = await fetch("/api/payment/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, userId: getUserId() }),
    });

    if (res.status === 503) return { status: "unconfigured" };
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      return { status: "error", message: e.error || "Could not start payment" };
    }

    const data = await res.json();
    if (!data.url) {
      return { status: "error", message: "No payment link returned. Please try again." };
    }

    // Send the customer to the live Razorpay payment page.
    window.location.href = data.url;
    return { status: "redirecting" };
  } catch (e: unknown) {
    return { status: "error", message: e instanceof Error ? e.message : "Payment failed to start" };
  }
}

export type FinalizeResult =
  | { state: "none" }
  | { state: "success"; tier: PlanTier; method?: string }
  | { state: "failed"; reason?: string };

/**
 * Called on app load. If we're returning from a payment, confirm it
 * server-side and unlock Pro. Always cleans the query params from the URL.
 */
export async function finalizeFromRedirect(): Promise<FinalizeResult> {
  if (typeof window === "undefined") return { state: "none" };

  const params = new URLSearchParams(window.location.search);
  const pay = params.get("pay");
  if (!pay) return { state: "none" };

  const cleanUrl = () =>
    window.history.replaceState({}, "", window.location.pathname);

  if (pay === "fail") {
    const reason = params.get("reason") || undefined;
    cleanUrl();
    return { state: "failed", reason };
  }

  if (pay === "ok") {
    const pid = params.get("pid");
    const planId = params.get("plan");
    cleanUrl();
    if (!pid || !planId) return { state: "failed", reason: "missing_params" };

    try {
      const res = await fetch("/api/payment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pid, planId, userId: getUserId() }),
      });
      const data = await res.json();
      if (data.valid) {
        setPlan(data.tier as PlanTier, pid);
        return { state: "success", tier: data.tier, method: data.method };
      }
      return { state: "failed", reason: data.error };
    } catch {
      return { state: "failed", reason: "confirm_error" };
    }
  }

  return { state: "none" };
}

/**
 * On app load, ask the server (Supabase) for the real entitlement and
 * mirror it locally. Returns the tier we ended up with. Falls back to the
 * locally stored plan if the server isn't configured/reachable.
 */
export async function syncEntitlementFromServer(): Promise<PlanTier> {
  if (typeof window === "undefined") return "free";
  const userId = getUserId();
  if (!userId) return getPlan().tier;
  try {
    const res = await fetch(`/api/entitlement?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return getPlan().tier;
    const data = await res.json();
    if (data.active && (data.tier === "pro" || data.tier === "lifetime")) {
      setPlanRecord(
        data.tier,
        data.expiresAt ? Date.parse(data.expiresAt) : undefined,
        data.paymentId
      );
      return data.tier;
    }
    return getPlan().tier;
  } catch {
    return getPlan().tier;
  }
}
