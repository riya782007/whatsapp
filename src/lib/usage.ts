function getTodayKey(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `voicepro_usage_${yyyy}-${mm}-${dd}`;
}

export function getUsageToday(): number {
  if (typeof window === "undefined") return 0;
  const val = localStorage.getItem(getTodayKey());
  return val ? parseInt(val, 10) : 0;
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return;
  const current = getUsageToday();
  localStorage.setItem(getTodayKey(), String(current + 1));
}

export function canUseForFree(): boolean {
  return getUsageToday() < 5;
}

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("voicepro_premium") === "true";
}

export function setPremium(val: boolean): void {
  if (typeof window === "undefined") return;
  if (val) {
    localStorage.setItem("voicepro_premium", "true");
  } else {
    localStorage.removeItem("voicepro_premium");
  }
}
