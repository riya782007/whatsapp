import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Voice2WA – Speak. Format. Send.",
  description:
    "Convert your casual Hinglish voice notes into professional, beautifully formatted WhatsApp messages in seconds. Powered by AI.",
  keywords: [
    "WhatsApp message formatter",
    "Hinglish voice to text",
    "AI WhatsApp tool",
    "voice to WhatsApp",
    "professional WhatsApp message",
    "India AI messaging",
  ],
  openGraph: {
    title: "Voice2WA – Speak. Format. Send.",
    description:
      "Record a casual voice note, get a perfectly formatted WhatsApp message. Powered by Whisper + Llama AI.",
    type: "website",
    locale: "en_IN",
    siteName: "Voice2WA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice2WA – AI WhatsApp Formatter",
    description:
      "Speak for 10 seconds. Send in 3. Look like a pro every time.",
  },
  robots: { index: true, follow: true },
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
        {/* Google AdSense — only loaded when a real publisher ID is configured */}
        {ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {/* Razorpay checkout — used by the upgrade flow */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
