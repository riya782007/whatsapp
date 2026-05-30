// ─────────────────────────────────────────────────────────────
// Local message history (localStorage). Keeps the last N results
// so a user never loses a formatted message on refresh.
// ─────────────────────────────────────────────────────────────

import { Language, Result, Tone } from "./config";

const HISTORY_KEY = "v2wa_history";
const MAX_ITEMS = 20;

export interface HistoryItem extends Result {
  id: string;
  createdAt: number;
  transcript?: string;
  language: Language;
  tone: Tone;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getHistory(): HistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function addHistory(
  item: Omit<HistoryItem, "id" | "createdAt">
): HistoryItem[] {
  if (!isBrowser()) return [];
  const entry: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function removeHistory(id: string): HistoryItem[] {
  if (!isBrowser()) return [];
  const next = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(HISTORY_KEY);
}
