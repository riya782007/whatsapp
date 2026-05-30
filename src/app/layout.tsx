import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Public site URL — set NEXT_PUBLIC_SITE_URL in Vercel to your real domain
// so canonical links, sitemap and social images resolve correctly.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voice2wa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Voice2WA – Speak Your Mind, Send Like a Pro | AI Voice to WhatsApp",
    template: "%s | Voice2WA",
  },
  description:
    "Turn rough voice notes into clean, professional WhatsApp & Telegram messages in Hindi, Hinglish or English. Just speak — AI fixes spelling, grammar and structure. Free to start.",
  applicationName: "Voice2WA",
  authors: [{ name: "Voice2WA" }],
  creator: "Voice2WA",
  publisher: "Voice2WA",
  category: "productivity",
  keywords: [
    "voice to WhatsApp",
    "WhatsApp message formatter",
    "Hindi voice to text",
    "Hinglish voice to text",
    "AI message writer",
    "voice note to professional message",
    "speech to text WhatsApp",
    "Telegram message formatter",
    "professional WhatsApp message generator",
    "AI WhatsApp tool India",
    "बोलकर मैसेज लिखें",
    "voice typing app",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Voice2WA – Speak Your Mind, Send Like a Pro",
    description:
      "Record a casual voice note, get a perfectly formatted message in Hindi, Hinglish or English. Share to WhatsApp, Telegram & more.",
    url: SITE_URL,
    type: "website",
    locale: "en_IN",
    siteName: "Voice2WA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice2WA – AI Voice to WhatsApp Formatter",
    description:
      "Speak for 10 seconds. Send a polished message in 3. Hindi, Hinglish & English.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#25D366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Publisher ID. Defaults to the live account ID; override via
// NEXT_PUBLIC_ADSENSE_CLIENT in Vercel if needed.
const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-8484576096599533";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Structured data for richer search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Voice2WA",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web, Android",
              description:
                "Turn voice notes into professional WhatsApp, Telegram and chat messages in Hindi, Hinglish or English.",
              url: SITE_URL,
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "INR", name: "Free" },
                { "@type": "Offer", price: "99", priceCurrency: "INR", name: "Pro (monthly)" },
                { "@type": "Offer", price: "499", priceCurrency: "INR", name: "Lifetime" },
              ],
              inLanguage: ["hi", "en"],
            }),
          }}
        />
        {/* Google AdSense — only loaded when a real publisher ID is configured */}
        {ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
