// ─────────────────────────────────────────────────────────────
// Client-side usage + plan tracking (localStorage based).
// Used to enforce the free daily limit and unlock Pro features.
// Note: this is a client-side gate for UX/funnel purposes. Real
// entitlement is confirmed server-side at payment verification.
// ─────────────────────────────────────────────────────────────

import { FREE_DAILY_LIMIT, PlanTier } from "./config";

const USAGE_KEY = "v2wa_usage";
const PLAN_KEY = "v2wa_plan";

interface UsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

interface PlanRecord {
  tier: PlanTier;
  /** epoch ms; undefined for lifetime */
  expiresAt?: number;
  paymentId?: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ── Usage ───────────────────────────────────────────────────

export function getUsage(): UsageRecord {
  if (!isBrowser()) return { date: todayStr(), count: 0 };
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: todayStr(), count: 0 };
    const parsed = JSON.parse(raw) as UsageRecord;
    // reset on a new day
    if (parsed.date !== todayStr()) return { date: todayStr(), count: 0 };
    return parsed;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

export function incrementUsage(): number {
  if (!isBrowser()) return 0;
  const current = getUsage();
  const next: UsageRecord = { date: todayStr(), count: current.count + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  return next.count;
}

export function getRemaining(): number {
  return Math.max(0, FREE_DAILY_LIMIT - getUsage().count);
}

// ── Plan ────────────────────────────────────────────────────

export function getPlan(): PlanRecord {
  if (!isBrowser()) return { tier: "free" };
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return { tier: "free" };
    const parsed = JSON.parse(raw) as PlanRecord;
    // expire monthly subscriptions
    if (parsed.tier === "pro" && parsed.expiresAt && Date.now() > parsed.expiresAt) {
      return { tier: "free" };
    }
    return parsed;
  } catch {
    return { tier: "free" };
  }
}

export function setPlan(tier: PlanTier, paymentId?: string): void {
  if (!isBrowser()) return;
  const record: PlanRecord = { tier, paymentId };
  if (tier === "pro") {
    // 30 days from now
    record.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  }
  localStorage.setItem(PLAN_KEY, JSON.stringify(record));
}

export function isPro(): boolean {
  const plan = getPlan();
  return plan.tier === "pro" || plan.tier === "lifetime";
}

/** Whether a free user still has messages left today. Pro users always true. */
export function canGenerate(): boolean {
  if (isPro()) return true;
  return getRemaining() > 0;
}
