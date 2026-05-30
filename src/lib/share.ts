// ─────────────────────────────────────────────────────────────
// Cross-platform share helpers. Opens the right deep-link / intent
// for each destination so a user can send their message anywhere.
// ─────────────────────────────────────────────────────────────

export type ShareTarget =
  | "whatsapp"
  | "telegram"
  | "sms"
  | "email"
  | "copy"
  | "native";

export function shareTo(target: ShareTarget, text: string): void {
  if (typeof window === "undefined") return;
  const encoded = encodeURIComponent(text);

  switch (target) {
    case "whatsapp":
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
      break;
    case "telegram":
      // Telegram share screen — user picks the chat/group
      window.open(`https://t.me/share/url?url=&text=${encoded}`, "_blank");
      break;
    case "sms":
      // works on mobile browsers
      window.open(`sms:?&body=${encoded}`, "_blank");
      break;
    case "email":
      window.open(`mailto:?body=${encoded}`, "_blank");
      break;
    case "copy":
      navigator.clipboard?.writeText(text);
      break;
    case "native":
      if (navigator.share) {
        navigator.share({ text }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(text);
      }
      break;
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}
