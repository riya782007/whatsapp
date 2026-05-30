import type { MetadataRoute } from "next";

// PWA manifest — lets users "Add to Home Screen" and improves SEO/quality signals.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voice2WA – Speak Your Mind, Send Like a Pro",
    short_name: "Voice2WA",
    description:
      "Turn voice notes into professional WhatsApp, Telegram & chat messages in Hindi, Hinglish or English.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#25D366",
    orientation: "portrait",
    categories: ["productivity", "utilities", "business"],
    lang: "en-IN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
