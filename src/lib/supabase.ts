// ─────────────────────────────────────────────────────────────
// Server-side Supabase access via PostgREST (no extra dependency).
// Stores the source-of-truth entitlement for each user, written by
// the Razorpay webhook + payment status check, and read on app load.
//
// Table (run the SQL in the README/env docs):
//   entitlements(user_id text pk, tier text, expires_at timestamptz,
//                payment_id text, updated_at timestamptz)
// Use the SERVICE ROLE key (server only) — it bypasses RLS.
// ─────────────────────────────────────────────────────────────

import { PlanTier } from "./config";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

const TABLE = "entitlements";

export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export interface EntitlementInput {
  userId: string;
  tier: Exclude<PlanTier, "free">;
  /** ISO string or null (null = never expires / lifetime) */
  expiresAt: string | null;
  paymentId?: string | null;
}

export interface EntitlementResult {
  tier: PlanTier;
  active: boolean;
  expiresAt: string | null;
  paymentId: string | null;
}

/** Upsert an entitlement row keyed by user_id. */
export async function upsertEntitlement(input: EntitlementInput): Promise<boolean> {
  if (!supabaseConfigured()) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=user_id`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({
      user_id: input.userId,
      tier: input.tier,
      expires_at: input.expiresAt,
      payment_id: input.paymentId ?? null,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    console.error("Supabase upsert failed:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/** Read the current entitlement for a user; computes active vs expired. */
export async function getEntitlement(userId: string): Promise<EntitlementResult> {
  const inactive: EntitlementResult = {
    tier: "free",
    active: false,
    expiresAt: null,
    paymentId: null,
  };
  if (!supabaseConfigured() || !userId) return inactive;

  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?user_id=eq.${encodeURIComponent(
    userId
  )}&select=tier,expires_at,payment_id&limit=1`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    console.error("Supabase read failed:", res.status);
    return inactive;
  }

  const rows = (await res.json()) as Array<{
    tier: PlanTier;
    expires_at: string | null;
    payment_id: string | null;
  }>;
  if (!rows.length) return inactive;

  const row = rows[0];
  const active =
    row.tier === "lifetime" ||
    (row.tier === "pro" && (!row.expires_at || Date.parse(row.expires_at) > Date.now()));

  return {
    tier: active ? row.tier : "free",
    active,
    expiresAt: row.expires_at,
    paymentId: row.payment_id,
  };
}

/** Helper: compute the expiry ISO string for a tier. */
export function expiryForTier(tier: Exclude<PlanTier, "free">): string | null {
  if (tier === "lifetime") return null;
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}
