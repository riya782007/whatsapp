// ─────────────────────────────────────────────────────────────
// Voice2WA – central app configuration
// Languages, tone presets, pricing plans and usage limits.
// Shared by the UI and the API routes so everything stays in sync.
// ─────────────────────────────────────────────────────────────

export type Language = "auto" | "hindi" | "hinglish" | "english";

export type Tone =
  | "general"
  | "office"
  | "society"
  | "dealer"
  | "shopkeeper"
  | "teacher"
  | "sales"
  | "event";

export interface Poll {
  question: string;
  options: string[];
}

export interface Result {
  formattedMessage: string;
  poll: Poll | null;
  language?: Language;
  tone?: Tone;
}

export interface LanguageConfig {
  label: string;
  flag: string;
  sublabel: string;
  color: string;
  hint: string;
}

export const LANGUAGE_CONFIG: Record<Language, LanguageConfig> = {
  auto: {
    label: "Auto",
    flag: "✨",
    sublabel: "Auto-Detect",
    color: "from-violet-500 to-fuchsia-600",
    hint: "🎙 Just speak — we detect your language and reply in the same one",
  },
  hindi: {
    label: "हिंदी",
    flag: "🇮🇳",
    sublabel: "Hindi",
    color: "from-orange-500 to-orange-600",
    hint: "🎙 Speak in Hindi → message in हिंदी (Devanagari)",
  },
  hinglish: {
    label: "HIN+ENG",
    flag: "🔀",
    sublabel: "Hinglish",
    color: "from-green-500 to-emerald-600",
    hint: "🎙 Speak in Hinglish → message in Hinglish (Roman Hindi + English)",
  },
  english: {
    label: "English",
    flag: "🇬🇧",
    sublabel: "English",
    color: "from-blue-500 to-blue-600",
    hint: "🎙 Speak in English → professionally formatted English message",
  },
};

export interface ToneConfig {
  label: string;
  emoji: string;
  description: string;
  /** Pro tones are locked for free users to drive upgrades. */
  pro: boolean;
}

export const TONE_CONFIG: Record<Tone, ToneConfig> = {
  general: {
    label: "Professional",
    emoji: "💬",
    description: "Clean, polished and neutral — works for any chat",
    pro: false,
  },
  office: {
    label: "Office / Work",
    emoji: "💼",
    description: "Crisp updates for work groups & colleagues",
    pro: false,
  },
  society: {
    label: "Society Admin",
    emoji: "🏘️",
    description: "Notices & announcements for RWA / apartment groups",
    pro: true,
  },
  dealer: {
    label: "Property Dealer",
    emoji: "🏠",
    description: "Persuasive listings & client follow-ups",
    pro: true,
  },
  shopkeeper: {
    label: "Shop / Vendor",
    emoji: "🛒",
    description: "Offers, order updates & customer replies",
    pro: true,
  },
  teacher: {
    label: "Teacher / Coaching",
    emoji: "🧑‍🏫",
    description: "Clear notices for students & parents",
    pro: true,
  },
  sales: {
    label: "Sales / Marketing",
    emoji: "🤝",
    description: "Catchy, convincing promotional messages",
    pro: true,
  },
  event: {
    label: "Event / Invite",
    emoji: "🎉",
    description: "Warm invitations & event reminders",
    pro: true,
  },
};

// ── Monetization ────────────────────────────────────────────

export type PlanTier = "free" | "pro" | "lifetime";

export const FREE_DAILY_LIMIT = 5;

export interface Plan {
  id: PlanTier;
  name: string;
  price: number; // in INR
  priceLabel: string;
  period: string;
  /** Razorpay sends amount in the smallest unit (paise). */
  amountPaise: number;
  tagline: string;
  highlight?: string;
  popular?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 99,
    priceLabel: "₹99",
    period: "/month",
    amountPaise: 9900,
    tagline: "For daily messengers",
    highlight: "Less than ₹3.5/day",
    popular: true,
    features: [
      "Unlimited messages",
      "All 8 professional tones",
      "No ads",
      "Message history",
      "Priority AI (fastest)",
      "All share options",
    ],
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 499,
    priceLabel: "₹499",
    period: "one-time",
    amountPaise: 49900,
    tagline: "Pay once, use forever",
    highlight: "Best value — no renewals",
    features: [
      "Everything in Pro",
      "One-time payment",
      "Lifetime updates",
      "Early access to new features",
    ],
  },
];

/** Default app currency. */
export const CURRENCY = "INR";
